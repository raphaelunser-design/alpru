import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";

const DEFAULT_PER_COUNTRY_LIMIT = Number(process.env.SYNC_PER_COUNTRY_LIMIT ?? 20);
const DEFAULT_MAX_TOTAL = Number(process.env.SYNC_MAX_TOTAL ?? 200);
const DEFAULT_PAGE_SIZE = 15;

const COUNTRIES = [
  { name: "Austria", code: "AT", qid: "Q40" },
  { name: "Germany", code: "DE", qid: "Q183" },
  { name: "Switzerland", code: "CH", qid: "Q39" },
  { name: "Italy", code: "IT", qid: "Q38" },
  { name: "France", code: "FR", qid: "Q142" },
];

const TYPE_IDS = ["Q130003", "Q3034650"]; // ski resort, ski area
const ALPS_QID = "Q1286";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url: string, headers: Record<string, string>, tries = 4, timeoutMs = 15000) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
        cache: "no-store",
        next: { revalidate: 0 },
      });
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          await sleep(500 * Math.pow(2, attempt));
          continue;
        }
        throw new Error(`Wikidata HTTP ${res.status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("Wikidata retries exceeded");
}

function parseCoord(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/Point\(([-0-9.]+) ([-0-9.]+)\)/i);
  if (!match) return null;
  const lon = Number(match[1]);
  const lat = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\u00e4/g, "ae")
    .replace(/\u00f6/g, "oe")
    .replace(/\u00fc/g, "ue")
    .replace(/\u00df/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toCommonsImageUrl(raw: string | null | undefined) {
  if (!raw) return "";
  if (raw.includes("Special:FilePath")) {
    return `${raw}width=1200`;
  }
  const file = raw.split("/").pop() ?? raw;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}width=1200`;
}

function extractQid(uri: string) {
  return uri.split("/").pop() ?? uri;
}

function buildSparql(countryQid: string, limit: number, offset: number) {
  const types = TYPE_IDS.map((id) => `wd:${id}`).join(" ");
  return `
    SELECT item itemLabel coord countryLabel officialWebsite image WHERE {
      VALUES type { ${types} }
      item wdt:P31/wdt:P279* type .
      item wdt:P17 wd:${countryQid} .
      item wdt:P625 coord .
      FILTER(
        EXISTS { item wdt:P706 wd:${ALPS_QID} . }
        || EXISTS { item wdt:P4552 wd:${ALPS_QID} . }
      )
      OPTIONAL { item wdt:P856 officialWebsite . }
      OPTIONAL { item wdt:P18 image . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
    }
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

export async function POST(req: Request) {
  const start = Date.now();
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const perCountryMax = Number(body.perCountryLimit ?? DEFAULT_PER_COUNTRY_LIMIT);
  const maxTotal = Number(body.maxTotal ?? DEFAULT_MAX_TOTAL);
  const pageSize = Math.max(5, Math.min(Number(body.pageSize ?? DEFAULT_PAGE_SIZE), 50));

  const results: Array<Record<string, string>> = [];
  const skipped: Array<{ country: string; reason: string }> = [];
  const seenItems = new Set<string>();

  for (const country of COUNTRIES) {
    if (results.length >= maxTotal) break;
    const countryQid = country.qid;

    let fetchedForCountry = 0;
    let offset = 0;

    while (fetchedForCountry < perCountryMax && results.length < maxTotal) {
      const remaining = Math.min(perCountryMax - fetchedForCountry, pageSize);
      const query = buildSparql(countryQid, remaining, offset);
      const sparqlUrl = `${WIKIDATA_SPARQL}format=json&query=${encodeURIComponent(query)}`;

      try {
        const data = await fetchJsonWithRetry(
          sparqlUrl,
          { "user-agent": "Alpivo/1.0", accept: "application/sparql-results+json" },
          4,
          30000
        );
        const bindings = data.results?.bindings ?? [];
        if (!bindings.length) break;

        for (const row of bindings) {
          if (results.length >= maxTotal) break;
          const itemUri = row.item.value;
          const name = row.itemLabel?.value ?? "";
          const coord = parseCoord(row.coord.value);
          if (!itemUri || !name || !coord) continue;

          const qid = extractQid(itemUri);
          if (seenItems.has(qid)) continue;
          seenItems.add(qid);

          results.push({
            qid,
            name,
            country: row.countryLabel?.value ?? country.name,
            region: "",
            lat: String(coord.lat),
            lon: String(coord.lon),
            official_url: row.officialWebsite?.value ?? "",
            image_url: toCommonsImageUrl(row.image.value),
          });
        }

        fetchedForCountry += bindings.length;
        offset += bindings.length;
      } catch (err) {
        const reason = err instanceof Error ? err.message : "sparql error";
        skipped.push({ country: country.code, reason });
        break;
      }
    }

    await sleep(1000);
  }

  if (results.length === 0) {
    return NextResponse.json({ error: "No resorts fetched", skipped }, { status: 500 });
  }

  const slugCounts = new Map<string, number>();
  const payload = results.map((row) => {
    const base = slugify(row.name);
    const seen = slugCounts.get(base) ?? 0;
    slugCounts.set(base, seen + 1);
    const slug = seen > 0 ? `${base}-${seen + 1}` : base;
    return {
      slug,
      name: row.name,
      country: row.country,
      region: row.region || null,
      lat: Number(row.lat),
      lon: Number(row.lon),
      image_url: row.image_url || null,
      official_url: row.official_url || null,
      piste_map_url: null,
      lift_status_url: null,
      skipass_url: null,
      provider: "wikidata",
      provider_id: row.qid,
    };
  });

  const slugs = payload.map((r) => r.slug);
  const existing = new Set<string>();
  for (let i = 0; i < slugs.length; i += 100) {
    const chunk = slugs.slice(i, i + 100);
    const { data } = await supabaseAdmin.from("resorts").select("slug").in("slug", chunk);
    (data ?? []).forEach((row) => {
      if (row.slug) existing.add(row.slug);
    });
  }

  let upserted = 0;
  for (let i = 0; i < payload.length; i += 100) {
    const chunk = payload.slice(i, i + 100);
    const { error } = await supabaseAdmin.from("resorts").upsert(chunk, { onConflict: "slug" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    upserted += chunk.length;
  }

  const inserted = payload.filter((r) => !existing.has(r.slug)).length;
  const updated = upserted - inserted;

  return NextResponse.json({
    upserted,
    inserted,
    updated,
    totalFetched: payload.length,
    skipped,
    durationMs: Date.now() - start,
  });
}
