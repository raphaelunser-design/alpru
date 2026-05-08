import { NextResponse } from "next/server";
import { fetchOpenMeteo, OpenMeteoError } from "@/lib/openMeteo";

export const runtime = "nodejs";

const CACHE_TTL_MS = 30 * 60 * 1000;
const DEFAULT_TIMEZONE = "Europe/Berlin";

type ResortWeatherRow = {
  id: string;
  lat: number | string | null;
  lon: number | string | null;
  elevation_min_m: number | string | null;
  elevation_max_m: number | string | null;
};

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseCoordinate(value: string | number | null | undefined, min: number, max: number) {
  const num = parseNumber(value);
  return num !== null && num >= min && num <= max ? num : null;
}

function parseElevation(value: string | number | null | undefined) {
  const num = parseNumber(value);
  return num !== null && num > -500 && num < 9000 ? num : null;
}

function paramNumber(searchParams: URLSearchParams, names: string[]) {
  for (const name of names) {
    const parsed = parseNumber(searchParams.get(name));
    if (parsed !== null) return parsed;
  }
  return null;
}

function cleanTimezone(value: string | null) {
  const timezone = (value || DEFAULT_TIMEZONE).trim();
  if (!timezone || timezone.length > 80 || !/^[A-Za-z0-9_+\-/]+$/.test(timezone)) return DEFAULT_TIMEZONE;
  return timezone;
}

function errorJson(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

async function resolveResort(resortId: string) {
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
  const { data, error } = await supabaseAdmin
    .from("resorts")
    .select("id,lat,lon,elevation_min_m,elevation_max_m")
    .eq("id", resortId)
    .maybeSingle<ResortWeatherRow>();

  if (error) {
    console.error("[weather/resort] Resort lookup failed", { resortId, message: error.message });
    return { row: null, failed: true };
  }

  return { row: data ?? null, failed: false };
}

async function readCache(resortId: string) {
  try {
    const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
    const { data, error } = await supabaseAdmin
      .from("resort_live_cache")
      .select("weather_json,weather_updated_at")
      .eq("resort_id", resortId)
      .maybeSingle();

    if (error) {
      console.warn("[weather/resort] Weather cache read failed", { resortId, message: error.message });
      return null;
    }

    const cachedWeather = data?.weather_json as Record<string, unknown> | null | undefined;
    if (!cachedWeather?.valley || !cachedWeather?.mountain || !data?.weather_updated_at) return null;

    const updatedAt = new Date(data.weather_updated_at).getTime();
    if (!Number.isFinite(updatedAt) || Date.now() - updatedAt >= CACHE_TTL_MS) return null;

    return {
      ...cachedWeather,
      cache: "hit",
      weather_updated_at: data.weather_updated_at,
    };
  } catch (error) {
    console.warn("[weather/resort] Weather cache unavailable", { resortId, message: String(error) });
    return null;
  }
}

async function writeCache(resortId: string, weather: Awaited<ReturnType<typeof fetchOpenMeteo>>) {
  try {
    const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
    const { error } = await supabaseAdmin.from("resort_live_cache").upsert(
      {
        resort_id: resortId,
        weather_json: weather,
        weather_updated_at: weather.updated_at,
        source: weather.source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "resort_id" }
    );

    if (error) {
      console.warn("[weather/resort] Weather cache write failed", { resortId, message: error.message });
    }
  } catch (error) {
    console.warn("[weather/resort] Weather cache write unavailable", { resortId, message: String(error) });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resortId = searchParams.get("resortId")?.trim() || null;
  const timezone = cleanTimezone(searchParams.get("timezone"));

  let lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  let lon = parseCoordinate(searchParams.get("lon"), -180, 180);
  let baseElevation = parseElevation(
    paramNumber(searchParams, ["baseElevation", "base_elevation", "valleyElevationM", "elevation_min_m"])
  );
  let summitElevation = parseElevation(
    paramNumber(searchParams, ["summitElevation", "summit_elevation", "mountainElevationM", "elevation_max_m"])
  );

  if (resortId && (lat === null || lon === null || baseElevation === null || summitElevation === null)) {
    const { row, failed } = await resolveResort(resortId);
    if (failed && (lat === null || lon === null)) {
      return errorJson("weather_unavailable", "Wetterdaten sind gerade nicht erreichbar.", 503);
    }

    if (row) {
      lat = lat ?? parseCoordinate(row.lat, -90, 90);
      lon = lon ?? parseCoordinate(row.lon, -180, 180);
      baseElevation = baseElevation ?? parseElevation(row.elevation_min_m);
      summitElevation = summitElevation ?? parseElevation(row.elevation_max_m);
    }
  }

  if (lat === null || lon === null) {
    return errorJson(
      "missing_coordinates",
      "Für dieses Skigebiet fehlen aktuell noch Wetterkoordinaten.",
      422
    );
  }

  if (resortId) {
    const cached = await readCache(resortId);
    if (cached) return NextResponse.json({ ok: true, ...cached });
  }

  try {
    const weather = await fetchOpenMeteo(lat, lon, {
      baseElevationM: baseElevation,
      summitElevationM: summitElevation,
      timezone,
    });

    if (resortId) {
      await writeCache(resortId, weather);
    }

    return NextResponse.json({
      ok: true,
      ...weather,
      cache: resortId ? "miss" : "none",
      weather_updated_at: weather.updated_at,
    });
  } catch (error) {
    if (error instanceof OpenMeteoError) {
      console.error("[weather/resort] Open-Meteo request failed", {
        status: error.status,
        message: error.message,
        diagnostic: error.diagnostic,
      });
      if (error.status === 400) {
        return errorJson("invalid_coordinates", "Die Wetterkoordinaten für dieses Skigebiet sind ungültig.", 400);
      }
    } else {
      console.error("[weather/resort] Unexpected weather error", error);
    }

    return errorJson(
      "weather_unavailable",
      "Der Wetterdienst ist temporär nicht erreichbar. Bitte später erneut versuchen.",
      503
    );
  }
}
