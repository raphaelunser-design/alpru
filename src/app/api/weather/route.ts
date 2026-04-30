import { NextResponse } from "next/server";
import { fetchOpenMeteo } from "@/lib/openMeteo";

export const runtime = "nodejs";

function parseNumber(value: string | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseNumber(searchParams.get("lat"));
    const lon = parseNumber(searchParams.get("lon"));
    const valleyElevationM = parseNumber(searchParams.get("valleyElevationM"));
    const mountainElevationM = parseNumber(searchParams.get("mountainElevationM"));

    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
    }

    const data = await fetchOpenMeteo(lat, lon, { valleyElevationM, mountainElevationM });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
