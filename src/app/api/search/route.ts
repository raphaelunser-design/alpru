import { NextResponse } from "next/server";
import { loadAllResortRows } from "@/lib/resortRepository";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const cacheHeaders = {
  "Cache-Control": "s-maxage=90, stale-while-revalidate=300",
};

type ResortSearchRow = {
  id: string;
  slug: string | null;
  name: string;
  country: string | null;
  region: string | null;
  piste_km: number | null;
  piste_km_total: number | null;
  hero_image_url: string | null;
  image_url: string | null;
  skipass_price_from: number | null;
};

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanSearchTerm(value: string) {
  return value
    .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function resortScore(row: ResortSearchRow, normalizedQuery: string) {
  const name = normalize(row.name);
  const region = normalize(row.region);
  const country = normalize(row.country);
  const slug = normalize(row.slug);

  if (name === normalizedQuery || slug === normalizedQuery) return 100;
  if (name.startsWith(normalizedQuery)) return 85;
  if (name.includes(normalizedQuery)) return 70;
  if (region.includes(normalizedQuery)) return 45;
  if (country.includes(normalizedQuery)) return 30;
  return 10;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = (searchParams.get("q") ?? "").trim();
  const term = cleanSearchTerm(rawQuery);
  const normalizedQuery = normalize(term);

  if (normalizedQuery.length < 2) {
    return NextResponse.json({ results: [] }, { headers: cacheHeaders });
  }

  const source = await loadAllResortRows(supabaseAdmin, { orderBy: "name" });
  const rows = source.resorts.filter((row) => {
    const haystack = [row.name, row.country, row.region, row.slug].map((value) => normalize(value)).join(" ");
    return haystack.includes(normalizedQuery);
  });

  const results = (rows as ResortSearchRow[])
    .map((row) => {
      const pisteKm = row.piste_km_total ?? row.piste_km ?? null;

      return {
        type: "resort" as const,
        title: row.name,
        subtitle: [row.country, row.region].filter(Boolean).join(", "),
        href: `/resort/${encodeURIComponent(row.slug || row.id)}`,
        imageUrl: row.hero_image_url || row.image_url || null,
        meta: pisteKm ? `${new Intl.NumberFormat("de-DE").format(pisteKm)} km Pisten` : "Skigebiet",
        price: row.skipass_price_from ? `Skipass ab ${new Intl.NumberFormat("de-DE").format(row.skipass_price_from)} €` : null,
        score: resortScore(row, normalizedQuery),
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "de"))
    .slice(0, 8)
    .map((item) => ({
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
      imageUrl: item.imageUrl,
      meta: item.meta,
      price: item.price,
    }));

  return NextResponse.json({ results, source: source.source, total: source.total, usingFallback: source.usingFallback }, { headers: cacheHeaders });
}
