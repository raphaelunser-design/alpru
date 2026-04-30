import { NextResponse } from "next/server";

export const runtime = "nodejs";

const REVERSE_URL = "https://geocoding-api.open-meteo.com/v1/reverse";

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
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const apiUrl = new URL(REVERSE_URL);
  apiUrl.searchParams.set("latitude", lat.toString());
  apiUrl.searchParams.set("longitude", lon.toString());
  apiUrl.searchParams.set("language", "de");
  apiUrl.searchParams.set("format", "json");

  const res = await fetch(apiUrl.toString(), { headers: { accept: "application/json" } });
  if (!res.ok) {
    return NextResponse.json({ label: "Aktueller Standort" }, { status: 200 });
  }

  const data = (await res.json()) as { results: Array<Record<string, unknown>> };
  const result = data.results?.[0] as
    | {
        name: string;
        latitude: number;
        longitude: number;
        country: string;
        country_code: string;
        admin1: string;
        postcodes: string[];
      }
    | undefined;

  if (!result) {
    return NextResponse.json({ label: "Aktueller Standort" }, { status: 200 });
  }

  return NextResponse.json({
    label: buildLabel(result),
    lat: result.latitude,
    lon: result.longitude,
    country: result.country ?? result.country_code ?? "",
    admin1: result.admin1 ?? "",
  });
}
