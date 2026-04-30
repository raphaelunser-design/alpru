import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase-Konfiguration fehlt." }, { status: 500 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const pattern = `%${term}%`;
  const { data, error } = await supabase
    .from("resorts")
    .select("id,slug,name,country,region,piste_km,piste_km_total,hero_image_url,image_url,skipass_price_from")
    .or(`name.ilike.${pattern},country.ilike.${pattern},region.ilike.${pattern},slug.ilike.${pattern}`)
    .limit(24)
    .returns<ResortSearchRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = (data ?? [])
    .map((row) => {
      const pisteKm = row.piste_km_total ?? row.piste_km ?? null;

      return {
        type: "resort" as const,
        title: row.name,
        subtitle: [row.country, row.region].filter(Boolean).join(", "),
        href: `/resort/${encodeURIComponent(row.slug || row.id)}`,
        imageUrl: row.hero_image_url || row.image_url || null,
        meta: pisteKm ? `${new Intl.NumberFormat("de-DE").format(pisteKm)} km Pisten` : "Skigebiet",
        price: row.skipass_price_from `Skipass ab ${new Intl.NumberFormat("de-DE").format(row.skipass_price_from)} €` : null,
        score: resortScore(row, normalizedQuery),
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "de"))
    .slice(0, 8)
    .map(({ score: _score, ...item }) => item);

  return NextResponse.json({ results }, { headers: cacheHeaders });
}
