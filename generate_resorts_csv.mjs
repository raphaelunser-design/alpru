import fs from "node:fs";

const OUT_FILE = process.env.OUT_FILE || "resorts_seed_alps_2km.csv";
const MAX_TOTAL = Number.parseInt(process.env.MAX_TOTAL || "0", 10); // 0 = kein Limit
const MIN_PISTE_KM = Number.parseFloat(process.env.MIN_PISTE_KM || "2");
const CONCURRENCY = 6;
const BATCH_SIZE = 80;
const BATCH_RETRIES = 2;

const ALPINE_COUNTRY_CODES = new Set(["AT", "CH", "DE", "FR", "IT", "LI", "MC", "SI"]);
const ALPS_QID = "Q1286";
const ALPS_WIKIDATA_PROPERTIES = ["P4552", "P706"];
const ALPS_BBOX = {
  latMin: 43.0,
  latMax: 48.8,
  lonMin: 5.0,
  lonMax: 17.2,
};

const BAD_DOMAINS = new Set(["playandplaywork.com"]);
const SKI_KEYWORDS = [
  "ski",
  "skigebiet",
  "snow",
  "alpin",
  "alpine",
  "alps",
  "alpen",
  "berg",
  "mont",
  "mount",
  "lift",
  "bahn",
  "seilbahn",
  "gondel",
  "piste",
  "gletscher",
  "dolomit",
];

const COUNTRY_CODE_TO_DE = {
  AT: "Österreich",
  CH: "Schweiz",
  DE: "Deutschland",
  FR: "Frankreich",
  IT: "Italien",
  LI: "Liechtenstein",
  MC: "Monaco",
  SI: "Slowenien",
};

const NEUTRAL_SCORE = 0.5;
const SOURCE_LABEL = "openskistats.org + api.openskimap.org + wikidata.org";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(s) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tokenizeName(name) {
  const slug = slugify(name);
  if (!slug) return [];
  return slug.split("-").filter((token) => token.length >= 3);
}

function safeDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function scoreWebsite(name, url) {
  const domain = safeDomain(url);
  if (!domain) return -1;
  if (BAD_DOMAINS.has(domain)) return -999;

  const tokens = tokenizeName(name);
  const urlLower = url.toLowerCase();
  let score = 0;

  for (const keyword of SKI_KEYWORDS) {
    if (domain.includes(keyword) || urlLower.includes(keyword)) {
      score += 2;
      break;
    }
  }

  for (const token of tokens) {
    if (domain.includes(token)) score += 3;
    if (urlLower.includes(token)) score += 1;
  }

  return score;
}

function pickOfficialUrl(name, websites) {
  const candidates = websites
    .map((w) => String(w || "").trim())
    .filter((w) => w && (w.startsWith("http://") || w.startsWith("https://")));

  let bestUrl = "";
  let bestScore = -1;

  for (const url of candidates) {
    const score = scoreWebsite(name, url);
    if (score > bestScore) {
      bestScore = score;
      bestUrl = url;
    }
  }

  if (bestScore < 2) return "";
  return bestUrl;
}

function csvEscape(x) {
  const s = x === null || x === undefined ? "" : String(x);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function collectCoords(coords, out) {
  if (!Array.isArray(coords)) return out;
  if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
    out.push(coords);
    return out;
  }
  for (const c of coords) collectCoords(c, out);
  return out;
}

function centroidFromGeometry(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") {
    const [lon, lat] = geometry.coordinates || [];
    if (Number.isFinite(lon) && Number.isFinite(lat)) return { lon, lat };
  }

  const coords = collectCoords(geometry.coordinates, []);
  if (!coords.length) return null;

  let sumLon = 0;
  let sumLat = 0;
  let n = 0;

  for (const [lon, lat] of coords) {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    sumLon += lon;
    sumLat += lat;
    n += 1;
  }

  if (!n) return null;
  return { lon: sumLon / n, lat: sumLat / n };
}

function isInAlpsBBox(coord) {
  if (!coord) return false;
  const { lat, lon } = coord;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= ALPS_BBOX.latMin &&
    lat <= ALPS_BBOX.latMax &&
    lon >= ALPS_BBOX.lonMin &&
    lon <= ALPS_BBOX.lonMax
  );
}

async function fetchText(url, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "AlpivoSeed/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === tries) throw err;
      await sleep(1200 * attempt);
    }
  }
  return "";
}

async function fetchJson(url, tries = 4) {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "AlpivoSeed/1.0" },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === tries) throw err;
      await sleep(1500 * attempt);
    }
  }
  return null;
}

function normalizeQid(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.startsWith("Q")) return raw;
  if (/^\d+$/.test(raw)) return `Q${raw}`;
  return raw;
}

function extractClaimIds(entity, prop) {
  const claims = entity?.claims?.[prop] ?? [];
  if (!Array.isArray(claims)) return [];
  return claims.map((claim) => claim?.mainsnak?.datavalue?.value?.id).filter(Boolean);
}

async function isAlpsRange(qid, cache, depth = 0) {
  const normalized = normalizeQid(qid);
  if (!normalized) return false;
  if (normalized === ALPS_QID) return true;
  if (cache.has(normalized)) return cache.get(normalized);
  if (depth > 4) return false;

  const data = await fetchJson(`https://www.wikidata.org/wiki/Special:EntityData/${normalized}.json`);
  const entity = data?.entities?.[normalized];
  if (!entity) {
    cache.set(normalized, false);
    return false;
  }

  const nextIds = new Set([
    ...extractClaimIds(entity, "P361"),
    ...extractClaimIds(entity, "P706"),
    ...extractClaimIds(entity, "P4552"),
  ]);

  for (const id of nextIds) {
    if (await isAlpsRange(id, cache, depth + 1)) {
      cache.set(normalized, true);
      return true;
    }
  }

  cache.set(normalized, false);
  return false;
}

async function checkAlpsResort(wikidataId, resortCache, rangeCache) {
  const qid = normalizeQid(wikidataId);
  if (!qid) return { match: false, hasRange: false };
  if (resortCache.has(qid)) return resortCache.get(qid);

  const data = await fetchJson(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  const entity = data?.entities?.[qid];
  if (!entity) {
    const result = { match: false, hasRange: false };
    resortCache.set(qid, result);
    return result;
  }

  const rangeIds = new Set(ALPS_WIKIDATA_PROPERTIES.flatMap((prop) => extractClaimIds(entity, prop)));
  if (rangeIds.size === 0) {
    const result = { match: false, hasRange: false };
    resortCache.set(qid, result);
    return result;
  }

  for (const id of rangeIds) {
    if (await isAlpsRange(id, rangeCache)) {
      const result = { match: true, hasRange: true };
      resortCache.set(qid, result);
      return result;
    }
  }

  const result = { match: false, hasRange: true };
  resortCache.set(qid, result);
  return result;
}

function extractOpenSkiStatsRows(html) {
  const startTag = '<script type="application/vnd.jupyter.widget-state+json">';
  const start = html.indexOf(startTag);
  if (start === -1) throw new Error("OpenSkiStats widget JSON nicht gefunden");

  const end = html.indexOf("</script>", start + startTag.length);
  if (end === -1) throw new Error("OpenSkiStats widget JSON Ende nicht gefunden");

  const jsonText = html.slice(start + startTag.length, end).trim();
  const json = JSON.parse(jsonText);

  const stateKey = Object.keys(json.state).find((k) => json.state[k]?.state?.props?.data);
  if (!stateKey) throw new Error("OpenSkiStats data block fehlt");

  const data = json.state[stateKey].state.props.data;
  const size = data?.ski_area_id?.length ?? 0;

  const rows = [];
  for (let i = 0; i < size; i += 1) {
    rows.push({
      ski_area_id: data.ski_area_id?.[i] ?? "",
      ski_area_name: data.ski_area_name?.[i] ?? "",
      country: data.country?.[i] ?? "",
      country_code: data.country_code?.[i] ?? "",
      region: data.region?.[i] ?? "",
      locality: data.locality?.[i] ?? "",
      run_count: data.run_count?.[i] ?? null,
      lift_count: data.lift_count?.[i] ?? null,
      min_elevation: data.min_elevation?.[i] ?? null,
      max_elevation: data.max_elevation?.[i] ?? null,
      vertical_drop: data.vertical_drop?.[i] ?? null,
    });
  }

  return rows;
}

function sumDownhillKm(stats) {
  const byDifficulty = stats?.runs?.byActivity?.downhill?.byDifficulty;
  if (!byDifficulty) return null;

  let total = 0;
  for (const diff of Object.values(byDifficulty)) {
    if (diff?.lengthInKm) total += diff.lengthInKm;
  }
  if (!total) return null;
  return Math.round(total * 10) / 10;
}

function sumDownhillStats(stats) {
  const byDifficulty = stats?.runs?.byActivity?.downhill?.byDifficulty;
  if (!byDifficulty) {
    return {
      totalKm: null,
      easyKm: null,
      intermediateKm: null,
      advancedKm: null,
      totalRuns: null,
    };
  }

  let totalKm = 0;
  let easyKm = 0;
  let intermediateKm = 0;
  let advancedKm = 0;
  let totalRuns = 0;

  for (const [key, diff] of Object.entries(byDifficulty)) {
    const length = diff?.lengthInKm ?? 0;
    const count = diff?.count ?? 0;
    if (length) totalKm += length;
    if (count) totalRuns += count;

    if (key === "novice" || key === "easy") {
      easyKm += length;
    } else if (key === "intermediate") {
      intermediateKm += length;
    } else if (key === "advanced" || key === "expert" || key === "extreme" || key === "freeride") {
      advancedKm += length;
    }
  }

  const round1 = (value) => (value ? Math.round(value * 10) / 10 : null);

  return {
    totalKm: round1(totalKm),
    easyKm: round1(easyKm),
    intermediateKm: round1(intermediateKm),
    advancedKm: round1(advancedKm),
    totalRuns: totalRuns || null,
  };
}

function sumLiftCount(stats) {
  const byType = stats?.lifts?.byType;
  if (!byType) return null;

  let total = 0;
  for (const lift of Object.values(byType)) {
    if (lift?.count) total += lift.count;
  }
  return total || null;
}

function pickElevation(stats, row) {
  const minElevation = stats?.minElevation ?? row.min_elevation ?? null;
  const maxElevation = stats?.maxElevation ?? row.max_elevation ?? null;
  let vertical = stats?.verticalDrop ?? row.vertical_drop ?? null;

  if (vertical === null && Number.isFinite(minElevation) && Number.isFinite(maxElevation)) {
    vertical = Math.round((maxElevation - minElevation) * 10) / 10;
  }

  return {
    minElevation,
    maxElevation,
    vertical,
  };
}

function pickPlace(properties) {
  const places = Array.isArray(properties?.places) ? properties.places : [];
  const localized =
    places.find((p) => p?.localized?.de?.country) ||
    places.find((p) => p?.localized?.en?.country) ||
    places[0];
  return localized?.localized?.de || localized?.localized?.en || {};
}

function getSkimapUrl(properties) {
  const sources = Array.isArray(properties?.sources) ? properties.sources : [];
  const skimap = sources.find((s) => s?.type === "skimap.org");
  if (!skimap?.id) return "";
  return `https://skimap.org/skiareas/view/${skimap.id}`;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;

  const runners = Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(runners);
  return results;
}

async function main() {
  console.log("Lade OpenSkiStats Tabelle...");
  const html = await fetchText("https://openskistats.org/ski-areas/");
  const rows = extractOpenSkiStatsRows(html);

  const alpine = rows.filter((r) => ALPINE_COUNTRY_CODES.has(r.country_code));
  const target = MAX_TOTAL ? alpine.slice(0, MAX_TOTAL) : alpine;
  console.log(
    `Alpen-Resorts gefunden (Länderfilter): ${alpine.length}, exportiere: ${target.length}, min km: ${MIN_PISTE_KM}`
  );

  const usedSlugs = new Set();
  const lastChecked = new Date().toISOString().slice(0, 10);
  const resortCache = new Map();
  const rangeCache = new Map();

  const rowsOut = [];
  const badLinks = [];

  for (let start = 0; start < target.length; start += BATCH_SIZE) {
    const batch = target.slice(start, start + BATCH_SIZE);
    let attempt = 0;
    let batchResults = [];

    while (attempt <= BATCH_RETRIES) {
      attempt += 1;
      try {
        batchResults = await mapWithConcurrency(batch, CONCURRENCY, async (row) => {
          if (!row.ski_area_id) return null;

          const feature = await fetchJson(`https://api.openskimap.org/features/${row.ski_area_id}.geojson`);
          if (!feature) return null;

          const properties = feature.properties || {};
          const geometry = feature.geometry || null;
          const coord = centroidFromGeometry(geometry);
          if (!coord) return null;

          const name = properties.name || row.ski_area_name;
          if (!name) return null;

          const alpsCheck = await checkAlpsResort(properties.wikidataID, resortCache, rangeCache);
          const inAlpsBBox = isInAlpsBBox(coord);
          if (!alpsCheck.match && !inAlpsBBox) return null;

          const place = pickPlace(properties);
          const country = COUNTRY_CODE_TO_DE[row.country_code] || place.country || row.country || "";
          const region = place.region || row.region || "";

          const downhillStats = sumDownhillStats(properties.statistics);
          const piste_km = downhillStats.totalKm ?? sumDownhillKm(properties.statistics) ?? null;
          const lifts_count_total = sumLiftCount(properties.statistics) ?? row.lift_count ?? null;
          const runs_count_total = downhillStats.totalRuns ?? row.run_count ?? null;
          const elevations = pickElevation(properties.statistics, row);

          let slug = slugify(name);
          if (!slug) return null;

          let suffix = 2;
          while (usedSlugs.has(slug)) {
            slug = `${slug}-${suffix}`;
            suffix += 1;
          }
          usedSlugs.add(slug);

          const websites = Array.isArray(properties.websites) ? properties.websites : [];
          const official_url = pickOfficialUrl(name, websites);
          if (!official_url && websites.length) {
            badLinks.push({
              slug,
              name,
              country,
              candidate: websites[0] || "",
            });
          }
          const skimap_url = getSkimapUrl(properties);
          const piste_map_url = skimap_url;
          const openskimap_url = `https://openskimap.org/?obj=${row.ski_area_id}`;

          if (!Number.isFinite(piste_km) || piste_km < MIN_PISTE_KM) return null;

          return {
            slug,
            name,
            country,
            region,
            piste_km,
            apres_score: NEUTRAL_SCORE,
            crowd_score: NEUTRAL_SCORE,
            infra_score: NEUTRAL_SCORE,
            hut_score: NEUTRAL_SCORE,
            park_score: NEUTRAL_SCORE,
            beginner_score: NEUTRAL_SCORE,
            advanced_score: NEUTRAL_SCORE,
            lat: coord.lat,
            lon: coord.lon,
            image_url: "",
            openskimap_url,
            skimap_url,
            piste_map_url,
            official_url,
            skipass_url: "",
            piste_km_total: piste_km,
            piste_km_easy: downhillStats.easyKm,
            piste_km_intermediate: downhillStats.intermediateKm,
            piste_km_advanced: downhillStats.advancedKm,
            runs_count_total,
            lifts_count_total,
            elevation_min_m: elevations.minElevation,
            elevation_max_m: elevations.maxElevation,
            vertical_m: elevations.vertical,
            wikipedia_url: "",
            notes: "",
            source: SOURCE_LABEL,
            last_checked: lastChecked,
          };
        });
        break;
      } catch (err) {
        console.warn(`Batch ${start}-${start + batch.length} fehlgeschlagen (Versuch ${attempt}).`);
        if (attempt > BATCH_RETRIES) throw err;
        await sleep(1200 * attempt);
      }
    }

    rowsOut.push(...batchResults.filter(Boolean));
    console.log(`Batch ${start + 1}-${start + batch.length}: ${rowsOut.length} Resorts gesammelt`);
    await sleep(250);
  }

  const header = [
    "slug",
    "name",
    "country",
    "region",
    "piste_km",
    "apres_score",
    "crowd_score",
    "infra_score",
    "hut_score",
    "park_score",
    "beginner_score",
    "advanced_score",
    "lat",
    "lon",
    "image_url",
    "openskimap_url",
    "skimap_url",
    "piste_map_url",
    "official_url",
    "skipass_url",
    "piste_km_total",
    "piste_km_easy",
    "piste_km_intermediate",
    "piste_km_advanced",
    "runs_count_total",
    "lifts_count_total",
    "elevation_min_m",
    "elevation_max_m",
    "vertical_m",
    "wikipedia_url",
    "notes",
    "source",
    "last_checked",
  ];

  const lines = [header.join(",")];
  for (const row of rowsOut) {
    lines.push(header.map((h) => csvEscape(row[h])).join(","));
  }

  fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
  console.log(`Fertig: ${OUT_FILE} mit ${rowsOut.length} Resorts`);

  if (badLinks.length) {
    const badHeader = ["slug", "name", "country", "candidate"];
    const badLines = [badHeader.join(",")];
    for (const row of badLinks) {
      badLines.push(badHeader.map((h) => csvEscape(row[h])).join(","));
    }
    const badFile = "resorts_bad_links.csv";
    fs.writeFileSync(badFile, badLines.join("\n"), "utf8");
    console.log(`Hinweis: ${badLinks.length} zweifelhafte Links in ${badFile}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

