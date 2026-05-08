import { NextResponse } from "next/server";
import { fetchOpenMeteo, OpenMeteoError } from "@/lib/openMeteo";

export const runtime = "nodejs";

function parseNumber(value: string | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function paramNumber(searchParams: URLSearchParams, names: string[]) {
  for (const name of names) {
    const parsed = parseNumber(searchParams.get(name));
    if (parsed !== null) return parsed;
  }
  return null;
}

function cleanTimezone(value: string | null) {
  const timezone = (value || "Europe/Berlin").trim();
  if (!timezone || timezone.length > 80 || !/^[A-Za-z0-9_+\-/]+$/.test(timezone)) return "Europe/Berlin";
  return timezone;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseNumber(searchParams.get("lat"));
    const lon = parseNumber(searchParams.get("lon"));
    const baseElevationM = paramNumber(searchParams, ["baseElevation", "base_elevation", "valleyElevationM"]);
    const summitElevationM = paramNumber(searchParams, ["summitElevation", "summit_elevation", "mountainElevationM"]);
    const timezone = cleanTimezone(searchParams.get("timezone"));

    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ ok: false, code: "invalid_coordinates", error: "Invalid lat/lon" }, { status: 400 });
    }

    const data = await fetchOpenMeteo(lat, lon, { baseElevationM, summitElevationM, timezone });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    if (error instanceof OpenMeteoError) {
      console.error("[api/weather] Open-Meteo request failed", {
        status: error.status,
        message: error.message,
        diagnostic: error.diagnostic,
      });
    } else {
      console.error("[api/weather] Unexpected weather error", error);
    }

    return NextResponse.json(
      {
        ok: false,
        code: "weather_unavailable",
        error: "Der Wetterdienst ist temporär nicht erreichbar. Bitte später erneut versuchen.",
      },
      { status: 503 }
    );
  }
}
