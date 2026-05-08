import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchOpenMeteo, OpenMeteoError } from "@/lib/openMeteo";

export const runtime = "nodejs";

const CACHE_TTL_MS = 30 * 60 * 1000;

function safeSlug(value: string) {
  return value.replace(/"/g, '\\"');
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && Number.isFinite(num) ? num : null;
}

function parseCoordinate(value: unknown, min: number, max: number) {
  const num = parseNumber(value);
  return num !== null && num >= min && num <= max ? num : null;
}

function parseElevation(value: unknown) {
  const num = parseNumber(value);
  return num !== null && num > -500 && num < 9000 ? num : null;
}

function errorJson(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const rawSlug = decodeURIComponent(slug);
    if (!rawSlug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const { data: resortBySlug, error: slugError } = await supabaseAdmin
      .from("resorts")
      .select("id,slug,lat,lon,elevation_min_m,elevation_max_m")
      .eq("slug", safeSlug(rawSlug))
      .maybeSingle();

    if (slugError) {
      console.error("[resort/weather] Resort lookup by slug failed", { slug: rawSlug, message: slugError.message });
      return errorJson("weather_unavailable", "Wetterdaten sind gerade nicht erreichbar.", 503);
    }

    let resort = resortBySlug ?? null;
    if (!resort && isUuid(rawSlug)) {
      const { data: resortById, error: idError } = await supabaseAdmin
        .from("resorts")
        .select("id,slug,lat,lon,elevation_min_m,elevation_max_m")
        .eq("id", rawSlug)
        .maybeSingle();

      if (idError) {
        console.error("[resort/weather] Resort lookup by id failed", { id: rawSlug, message: idError.message });
        return errorJson("weather_unavailable", "Wetterdaten sind gerade nicht erreichbar.", 503);
      }
      resort = resortById ?? null;
    }

    if (!resort) {
      return errorJson("not_found", "Skigebiet nicht gefunden.", 404);
    }

    const lat = parseCoordinate(resort.lat, -90, 90);
    const lon = parseCoordinate(resort.lon, -180, 180);
    if (lat === null || lon === null) {
      return errorJson(
        "missing_coordinates",
        "Für dieses Skigebiet fehlen aktuell noch Wetterkoordinaten.",
        422
      );
    }

    const { data: cache } = await supabaseAdmin
      .from("resort_live_cache")
      .select("weather_json,weather_updated_at")
      .eq("resort_id", resort.id)
      .maybeSingle();

    const cachedWeather = cache?.weather_json as Record<string, unknown> | null | undefined;
    if (cachedWeather?.valley && cachedWeather?.mountain && cache?.weather_updated_at) {
      const updatedAt = new Date(cache.weather_updated_at).getTime();
      if (Number.isFinite(updatedAt) && Date.now() - updatedAt < CACHE_TTL_MS) {
        return NextResponse.json({
          ok: true,
          ...cachedWeather,
          cache: "hit",
          weather_updated_at: cache.weather_updated_at,
        });
      }
    }

    const weather = await fetchOpenMeteo(lat, lon, {
      baseElevationM: parseElevation(resort.elevation_min_m),
      summitElevationM: parseElevation(resort.elevation_max_m),
      timezone: "Europe/Berlin",
    });
    await supabaseAdmin.from("resort_live_cache").upsert(
      {
        resort_id: resort.id,
        weather_json: weather,
        weather_updated_at: weather.updated_at,
        source: weather.source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "resort_id" }
    );

    return NextResponse.json({
      ok: true,
      ...weather,
      cache: "miss",
      weather_updated_at: weather.updated_at,
    });
  } catch (error) {
    if (error instanceof OpenMeteoError) {
      console.error("[resort/weather] Open-Meteo request failed", {
        status: error.status,
        message: error.message,
        diagnostic: error.diagnostic,
      });
      if (error.status === 400) {
        return errorJson("invalid_coordinates", "Die Wetterkoordinaten für dieses Skigebiet sind ungültig.", 400);
      }
    } else {
      console.error("[resort/weather] Unexpected weather error", error);
    }

    return errorJson(
      "weather_unavailable",
      "Der Wetterdienst ist temporär nicht erreichbar. Bitte später erneut versuchen.",
      503
    );
  }
}
