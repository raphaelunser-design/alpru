import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

function buildLabel(result: {
  name: string;
  admin1: string;
  country_code: string;
  postcodes: string[];
}) {
  const base = result.postcodes.length ? `${result.postcodes[0]} ${result.name}` : result.name;
  const rest = [result.admin1, result.country_code].filter(Boolean).join(", ");
  return rest ? `${base}, ${rest}` : base;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiUrl = new URL(GEOCODE_URL);
  apiUrl.searchParams.set("name", query);
  apiUrl.searchParams.set("count", "6");
  apiUrl.searchParams.set("language", "de");
  apiUrl.searchParams.set("format", "json");

  const res = await fetch(apiUrl.toString(), { headers: { accept: "application/json" } });
  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const data = (await res.json()) as { results: Array<Record<string, unknown>> };
  const results = (data.results ?? []).map((item) => {
    const result = item as {
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      country: string;
      country_code: string;
      admin1: string;
      postcodes: string[];
    };
    return {
      id: result.id ?? `${result.latitude}-${result.longitude}`,
      name: result.name,
      lat: result.latitude,
      lon: result.longitude,
      country: result.country ?? result.country_code ?? "",
      admin1: result.admin1 ?? "",
      label: buildLabel(result),
    };
  });

  return NextResponse.json({ results });
}
