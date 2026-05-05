import type { ResortSignalRow } from "@/lib/resortSignals";
import type { TripResortLite } from "@/lib/tripPlanner";

export type MvpResortRow = ResortSignalRow & {
  data_quality: "demo" | "estimated" | "verified";
  resort_style: string[];
};

const fallbackImage = "/bg/skilandschaft.png";

const mojibakeMap: Array<[string, string]> = [
  ["Ã„", "Ä"],
  ["Ã–", "Ö"],
  ["Ãœ", "Ü"],
  ["Ã¤", "ä"],
  ["Ã¶", "ö"],
  ["Ã¼", "ü"],
  ["ÃŸ", "ß"],
  ["Ã©", "é"],
  ["Ã¨", "è"],
  ["Ãª", "ê"],
  ["Ã¡", "á"],
  ["Ã³", "ó"],
  ["Ã²", "ò"],
  ["Ã­", "í"],
  ["Ã®", "î"],
  ["Ã´", "ô"],
  ["Ã¢", "â"],
  ["â€“", "–"],
  ["â€”", "–"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€œ", "“"],
  ["â€", "”"],
  ["Â·", "·"],
];

export function repairText(value: string | null | undefined) {
  if (!value) return value || null;
  return mojibakeMap.reduce((text, [broken, fixed]) => text.replaceAll(broken, fixed), value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitPistes(total: number, easyShare: number, advancedShare: number) {
  const easy = Math.round(total * easyShare * 10) / 10;
  const advanced = Math.round(total * advancedShare * 10) / 10;
  const intermediate = Math.max(0, Math.round((total - easy - advanced) * 10) / 10);
  return { easy, intermediate, advanced };
}

function resort(input: {
  name: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  pisteKm: number;
  elevationMin: number;
  elevationMax: number;
  lifts: number;
  skipass: number;
  apres: number;
  crowd: number;
  infra: number;
  huts: number;
  park: number;
  beginner: number;
  advanced: number;
  officialUrl?: string;
  styles: string[];
  easyShare?: number;
  advancedShare?: number;
}) {
  const slug = slugify(input.name);
  const split = splitPistes(input.pisteKm, input.easyShare || 0.28, input.advancedShare || 0.16);
  return {
    id: `demo-${slug}`,
    slug,
    name: input.name,
    country: input.country,
    region: input.region,
    lat: input.lat,
    lon: input.lon,
    piste_km: input.pisteKm,
    piste_km_total: input.pisteKm,
    piste_km_easy: split.easy,
    piste_km_intermediate: split.intermediate,
    piste_km_advanced: split.advanced,
    runs_count_total: Math.max(6, Math.round(input.pisteKm / 1.8)),
    lifts_count_total: input.lifts,
    elevation_min_m: input.elevationMin,
    elevation_max_m: input.elevationMax,
    vertical_m: input.elevationMax - input.elevationMin,
    image_url: fallbackImage,
    hero_image_url: fallbackImage,
    hero_image_alt: `Winterpanorama im Skigebiet ${input.name}`,
    image_source: "Alpivo Fallback",
    image_credit: "Alpivo",
    image_license: "Projektbild",
    official_url: input.officialUrl || null,
    piste_map_url: null,
    skipass_url: input.officialUrl || null,
    openskimap_url: null,
    skipass_price_from: input.skipass,
    apres_score: input.apres,
    crowd_score: input.crowd,
    infra_score: input.infra,
    hut_score: input.huts,
    park_score: input.park,
    beginner_score: input.beginner,
    advanced_score: input.advanced,
    data_quality: "estimated",
    resort_style: input.styles,
  } satisfies MvpResortRow;
}

export const MVP_RESORTS: MvpResortRow[] = [
  resort({ name: "Saalbach-Hinterglemm", country: "Österreich", region: "Salzburg", lat: 47.3916, lon: 12.6367, pisteKm: 270, elevationMin: 830, elevationMax: 2096, lifts: 70, skipass: 74, apres: 0.88, crowd: 0.76, infra: 0.9, huts: 0.86, park: 0.62, beginner: 0.78, advanced: 0.76, styles: ["apres", "groups", "large"], officialUrl: "https://www.saalbach.com" }),
  resort({ name: "Ischgl", country: "Österreich", region: "Tirol", lat: 47.0127, lon: 10.2922, pisteKm: 239, elevationMin: 1377, elevationMax: 2872, lifts: 45, skipass: 79, apres: 0.96, crowd: 0.82, infra: 0.9, huts: 0.86, park: 0.7, beginner: 0.58, advanced: 0.86, styles: ["apres", "premium", "snow"] }),
  resort({ name: "Sölden", country: "Österreich", region: "Tirol", lat: 46.9693, lon: 11.0074, pisteKm: 144, elevationMin: 1350, elevationMax: 3340, lifts: 31, skipass: 76, apres: 0.78, crowd: 0.72, infra: 0.86, huts: 0.74, park: 0.62, beginner: 0.62, advanced: 0.88, styles: ["glacier", "snow", "sport"] }),
  resort({ name: "Kitzbühel", country: "Österreich", region: "Tirol", lat: 47.4464, lon: 12.3929, pisteKm: 188, elevationMin: 800, elevationMax: 2000, lifts: 57, skipass: 74, apres: 0.76, crowd: 0.74, infra: 0.84, huts: 0.88, park: 0.48, beginner: 0.72, advanced: 0.74, styles: ["premium", "classic", "apres"] }),
  resort({ name: "St. Anton am Arlberg", country: "Österreich", region: "Tirol", lat: 47.1286, lon: 10.2641, pisteKm: 305, elevationMin: 1304, elevationMax: 2811, lifts: 88, skipass: 78, apres: 0.92, crowd: 0.8, infra: 0.92, huts: 0.82, park: 0.55, beginner: 0.48, advanced: 0.94, styles: ["freeride", "apres", "premium"], advancedShare: 0.25 }),
  resort({ name: "Serfaus-Fiss-Ladis", country: "Österreich", region: "Tirol", lat: 47.0405, lon: 10.6031, pisteKm: 214, elevationMin: 1200, elevationMax: 2820, lifts: 68, skipass: 72, apres: 0.58, crowd: 0.62, infra: 0.9, huts: 0.8, park: 0.74, beginner: 0.92, advanced: 0.7, styles: ["family", "snow", "large"], easyShare: 0.36 }),
  resort({ name: "Zillertal Arena", country: "Österreich", region: "Tirol/Salzburg", lat: 47.2307, lon: 12.1111, pisteKm: 150, elevationMin: 580, elevationMax: 2500, lifts: 52, skipass: 68, apres: 0.72, crowd: 0.7, infra: 0.8, huts: 0.78, park: 0.58, beginner: 0.75, advanced: 0.68, styles: ["value", "family", "apres"] }),
  resort({ name: "Mayrhofen", country: "Österreich", region: "Tirol", lat: 47.1667, lon: 11.8667, pisteKm: 142, elevationMin: 630, elevationMax: 2500, lifts: 44, skipass: 69, apres: 0.82, crowd: 0.72, infra: 0.82, huts: 0.78, park: 0.82, beginner: 0.62, advanced: 0.82, styles: ["apres", "park", "sport"] }),
  resort({ name: "Obertauern", country: "Österreich", region: "Salzburg", lat: 47.2506, lon: 13.5587, pisteKm: 100, elevationMin: 1630, elevationMax: 2313, lifts: 26, skipass: 66, apres: 0.78, crowd: 0.64, infra: 0.76, huts: 0.74, park: 0.55, beginner: 0.72, advanced: 0.7, styles: ["snow", "apres", "weekend"] }),
  resort({ name: "Schladming", country: "Österreich", region: "Steiermark", lat: 47.3929, lon: 13.6892, pisteKm: 123, elevationMin: 745, elevationMax: 2015, lifts: 46, skipass: 68, apres: 0.72, crowd: 0.66, infra: 0.82, huts: 0.8, park: 0.48, beginner: 0.74, advanced: 0.72, styles: ["classic", "groups", "value"] }),
  resort({ name: "Flachau", country: "Österreich", region: "Salzburg", lat: 47.3441, lon: 13.3929, pisteKm: 120, elevationMin: 740, elevationMax: 1980, lifts: 45, skipass: 67, apres: 0.7, crowd: 0.65, infra: 0.78, huts: 0.78, park: 0.56, beginner: 0.78, advanced: 0.66, styles: ["family", "value", "weekend"] }),
  resort({ name: "Lech Zürs", country: "Österreich", region: "Vorarlberg", lat: 47.2086, lon: 10.1411, pisteKm: 302, elevationMin: 1300, elevationMax: 2811, lifts: 85, skipass: 78, apres: 0.68, crowd: 0.68, infra: 0.92, huts: 0.88, park: 0.48, beginner: 0.64, advanced: 0.9, styles: ["premium", "freeride", "snow"] }),
  resort({ name: "Garmisch-Classic", country: "Deutschland", region: "Bayern", lat: 47.4917, lon: 11.0955, pisteKm: 40, elevationMin: 740, elevationMax: 2050, lifts: 18, skipass: 57, apres: 0.42, crowd: 0.56, infra: 0.62, huts: 0.62, park: 0.34, beginner: 0.62, advanced: 0.72, styles: ["daytrip", "value", "classic"] }),
  resort({ name: "Oberstdorf-Kleinwalsertal", country: "Deutschland/Österreich", region: "Allgäu/Vorarlberg", lat: 47.403, lon: 10.279, pisteKm: 130, elevationMin: 820, elevationMax: 2224, lifts: 48, skipass: 61, apres: 0.5, crowd: 0.58, infra: 0.72, huts: 0.72, park: 0.48, beginner: 0.76, advanced: 0.64, styles: ["family", "value", "daytrip"] }),
  resort({ name: "Feldberg", country: "Deutschland", region: "Schwarzwald", lat: 47.8647, lon: 8.0363, pisteKm: 63, elevationMin: 950, elevationMax: 1450, lifts: 28, skipass: 49, apres: 0.38, crowd: 0.6, infra: 0.58, huts: 0.52, park: 0.46, beginner: 0.8, advanced: 0.42, styles: ["budget", "daytrip", "family"], easyShare: 0.44, advancedShare: 0.08 }),
  resort({ name: "Davos Klosters", country: "Schweiz", region: "Graubünden", lat: 46.8027, lon: 9.8359, pisteKm: 269, elevationMin: 1120, elevationMax: 2844, lifts: 54, skipass: 86, apres: 0.62, crowd: 0.64, infra: 0.86, huts: 0.76, park: 0.72, beginner: 0.66, advanced: 0.84, styles: ["premium", "snow", "sport"] }),
  resort({ name: "Zermatt", country: "Schweiz", region: "Wallis", lat: 46.0207, lon: 7.7491, pisteKm: 360, elevationMin: 1620, elevationMax: 3883, lifts: 54, skipass: 92, apres: 0.58, crowd: 0.7, infra: 0.9, huts: 0.86, park: 0.48, beginner: 0.62, advanced: 0.88, styles: ["glacier", "premium", "snow"] }),
  resort({ name: "St. Moritz", country: "Schweiz", region: "Graubünden", lat: 46.4983, lon: 9.839, pisteKm: 155, elevationMin: 1720, elevationMax: 3303, lifts: 24, skipass: 88, apres: 0.58, crowd: 0.62, infra: 0.8, huts: 0.82, park: 0.48, beginner: 0.58, advanced: 0.82, styles: ["premium", "snow", "luxury"] }),
  resort({ name: "Laax", country: "Schweiz", region: "Graubünden", lat: 46.836, lon: 9.2575, pisteKm: 224, elevationMin: 1100, elevationMax: 3018, lifts: 28, skipass: 83, apres: 0.66, crowd: 0.66, infra: 0.82, huts: 0.74, park: 0.94, beginner: 0.64, advanced: 0.82, styles: ["park", "snow", "premium"] }),
  resort({ name: "Verbier", country: "Schweiz", region: "Wallis", lat: 46.0961, lon: 7.2286, pisteKm: 410, elevationMin: 821, elevationMax: 3330, lifts: 80, skipass: 94, apres: 0.82, crowd: 0.76, infra: 0.88, huts: 0.8, park: 0.56, beginner: 0.46, advanced: 0.95, styles: ["freeride", "premium", "apres"], advancedShare: 0.28 }),
  resort({ name: "Arosa Lenzerheide", country: "Schweiz", region: "Graubünden", lat: 46.783, lon: 9.679, pisteKm: 225, elevationMin: 1229, elevationMax: 2865, lifts: 43, skipass: 82, apres: 0.54, crowd: 0.58, infra: 0.82, huts: 0.76, park: 0.56, beginner: 0.76, advanced: 0.72, styles: ["family", "snow", "balanced"] }),
  resort({ name: "Grindelwald-Wengen", country: "Schweiz", region: "Berner Oberland", lat: 46.624, lon: 8.041, pisteKm: 160, elevationMin: 944, elevationMax: 2500, lifts: 47, skipass: 79, apres: 0.46, crowd: 0.68, infra: 0.8, huts: 0.82, park: 0.38, beginner: 0.72, advanced: 0.74, styles: ["panorama", "classic", "family"] }),
  resort({ name: "Les Trois Vallées", country: "Frankreich", region: "Savoie", lat: 45.414, lon: 6.633, pisteKm: 600, elevationMin: 1100, elevationMax: 3230, lifts: 160, skipass: 79, apres: 0.7, crowd: 0.78, infra: 0.94, huts: 0.76, park: 0.72, beginner: 0.72, advanced: 0.88, styles: ["large", "premium", "snow"] }),
  resort({ name: "Val d’Isère", country: "Frankreich", region: "Savoie", lat: 45.4486, lon: 6.9806, pisteKm: 300, elevationMin: 1550, elevationMax: 3456, lifts: 76, skipass: 75, apres: 0.74, crowd: 0.72, infra: 0.88, huts: 0.74, park: 0.62, beginner: 0.58, advanced: 0.9, styles: ["snow", "premium", "sport"] }),
  resort({ name: "Tignes", country: "Frankreich", region: "Savoie", lat: 45.469, lon: 6.909, pisteKm: 300, elevationMin: 1550, elevationMax: 3456, lifts: 76, skipass: 75, apres: 0.7, crowd: 0.7, infra: 0.86, huts: 0.7, park: 0.82, beginner: 0.62, advanced: 0.9, styles: ["glacier", "park", "snow"] }),
  resort({ name: "Chamonix", country: "Frankreich", region: "Haute-Savoie", lat: 45.9237, lon: 6.8694, pisteKm: 120, elevationMin: 1035, elevationMax: 3275, lifts: 43, skipass: 72, apres: 0.7, crowd: 0.74, infra: 0.78, huts: 0.72, park: 0.44, beginner: 0.38, advanced: 0.96, styles: ["freeride", "classic", "premium"], advancedShare: 0.3 }),
  resort({ name: "Les Deux Alpes", country: "Frankreich", region: "Isère", lat: 45.011, lon: 6.125, pisteKm: 200, elevationMin: 1300, elevationMax: 3600, lifts: 43, skipass: 68, apres: 0.66, crowd: 0.68, infra: 0.78, huts: 0.68, park: 0.84, beginner: 0.68, advanced: 0.78, styles: ["glacier", "park", "value"] }),
  resort({ name: "Alpe d’Huez", country: "Frankreich", region: "Isère", lat: 45.091, lon: 6.067, pisteKm: 250, elevationMin: 1125, elevationMax: 3330, lifts: 67, skipass: 69, apres: 0.68, crowd: 0.66, infra: 0.82, huts: 0.7, park: 0.7, beginner: 0.72, advanced: 0.8, styles: ["sunny", "large", "value"] }),
  resort({ name: "Val Thorens", country: "Frankreich", region: "Savoie", lat: 45.2978, lon: 6.5836, pisteKm: 150, elevationMin: 1800, elevationMax: 3230, lifts: 31, skipass: 74, apres: 0.84, crowd: 0.78, infra: 0.86, huts: 0.72, park: 0.72, beginner: 0.62, advanced: 0.82, styles: ["snow", "apres", "premium"] }),
  resort({ name: "Cortina d’Ampezzo", country: "Italien", region: "Veneto", lat: 46.5405, lon: 12.1357, pisteKm: 120, elevationMin: 1224, elevationMax: 2930, lifts: 36, skipass: 72, apres: 0.56, crowd: 0.62, infra: 0.76, huts: 0.82, park: 0.42, beginner: 0.66, advanced: 0.74, styles: ["premium", "panorama", "dolomites"] }),
  resort({ name: "Madonna di Campiglio", country: "Italien", region: "Trentino", lat: 46.2303, lon: 10.8262, pisteKm: 156, elevationMin: 850, elevationMax: 2500, lifts: 59, skipass: 69, apres: 0.64, crowd: 0.62, infra: 0.8, huts: 0.82, park: 0.54, beginner: 0.72, advanced: 0.74, styles: ["premium", "family", "dolomites"] }),
  resort({ name: "Livigno", country: "Italien", region: "Lombardei", lat: 46.538, lon: 10.135, pisteKm: 115, elevationMin: 1816, elevationMax: 2798, lifts: 32, skipass: 57, apres: 0.74, crowd: 0.6, infra: 0.76, huts: 0.72, park: 0.78, beginner: 0.72, advanced: 0.72, styles: ["value", "snow", "apres"] }),
  resort({ name: "Kronplatz", country: "Italien", region: "Südtirol", lat: 46.738, lon: 11.957, pisteKm: 121, elevationMin: 935, elevationMax: 2275, lifts: 32, skipass: 68, apres: 0.5, crowd: 0.58, infra: 0.86, huts: 0.82, park: 0.42, beginner: 0.82, advanced: 0.7, styles: ["family", "value", "dolomites"] }),
  resort({ name: "Alta Badia", country: "Italien", region: "Südtirol", lat: 46.57, lon: 11.93, pisteKm: 130, elevationMin: 1324, elevationMax: 2778, lifts: 53, skipass: 72, apres: 0.48, crowd: 0.58, infra: 0.82, huts: 0.9, park: 0.38, beginner: 0.84, advanced: 0.62, styles: ["family", "food", "premium"] }),
  resort({ name: "Val Gardena", country: "Italien", region: "Südtirol", lat: 46.556, lon: 11.76, pisteKm: 175, elevationMin: 1236, elevationMax: 2518, lifts: 79, skipass: 72, apres: 0.56, crowd: 0.62, infra: 0.84, huts: 0.88, park: 0.42, beginner: 0.76, advanced: 0.76, styles: ["dolomites", "family", "classic"] }),
];

export function sanitizeResortRow<T extends ResortSignalRow>(row: T): T {
  return {
    ...row,
    slug: repairText(row.slug) || row.slug,
    name: repairText(row.name) || row.name,
    country: repairText(row.country) || row.country,
    region: repairText(row.region) || row.region,
    hero_image_alt: repairText(row.hero_image_alt) || row.hero_image_alt,
    image_source: repairText(row.image_source) || row.image_source,
    image_credit: repairText(row.image_credit) || row.image_credit,
    image_license: repairText(row.image_license) || row.image_license,
  };
}

export function sanitizeResortRows<T extends ResortSignalRow>(rows: T[] | null | undefined): T[] {
  return (rows || []).map((row) => sanitizeResortRow(row));
}

export function mergeWithMvpResorts<T extends ResortSignalRow>(rows: T[] | null | undefined, minimum = 35): ResortSignalRow[] {
  const sanitized = sanitizeResortRows(rows);
  const bySlug = new Set(sanitized.map((row) => row.slug).filter(Boolean));
  const merged: ResortSignalRow[] = [...sanitized];

  for (const demo of MVP_RESORTS) {
    if (merged.length >= minimum) break;
    if (bySlug.has(demo.slug)) continue;
    merged.push(demo);
    bySlug.add(demo.slug);
  }

  return merged;
}

export function getMvpResorts(limit = MVP_RESORTS.length): ResortSignalRow[] {
  return MVP_RESORTS.slice(0, limit);
}

export function findMvpResortBySlug(slug: string) {
  const normalized = slugify(repairText(slug) || slug);
  return MVP_RESORTS.find((resort) => resort.slug === normalized || resort.id === slug) || null;
}

export function getMvpTripResortLookup(slugs: string[]) {
  const lookup: Record<string, TripResortLite> = {};
  for (const slug of slugs) {
    const resort = findMvpResortBySlug(slug);
    if (!resort || !resort.slug) continue;
    lookup[resort.slug] = {
      id: resort.id,
      slug: resort.slug,
      name: resort.name,
      country: resort.country,
      region: resort.region || null,
      imageUrl: resort.hero_image_url || resort.image_url || fallbackImage,
      pisteKm: resort.piste_km_total || resort.piste_km || null,
      elevationMinM: resort.elevation_min_m || null,
      elevationMaxM: resort.elevation_max_m || null,
      verticalM: resort.vertical_m || null,
      skipassPriceFrom: resort.skipass_price_from || null,
      officialUrl: resort.official_url || null,
      lat: typeof resort.lat === "number" ? resort.lat : null,
      lon: typeof resort.lon === "number" ? resort.lon : null,
      matchPct: null,
    };
  }
  return lookup;
}
