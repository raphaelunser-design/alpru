import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchOpenMeteo } from "@/lib/openMeteo";

export const runtime = "nodejs";

const CACHE_TTL_MS = 30 * 60 * 1000;

function safeSlug(value: string) {
  return value.replace(/"/g, '\\"');
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

    if (slugError) return NextResponse.json({ error: slugError.message }, { status: 500 });

    let resort = resortBySlug ?? null;
    if (!resort && isUuid(rawSlug)) {
      const { data: resortById, error: idError } = await supabaseAdmin
        .from("resorts")
        .select("id,slug,lat,lon,elevation_min_m,elevation_max_m")
        .eq("id", rawSlug)
        .maybeSingle();

      if (idError) return NextResponse.json({ error: idError.message }, { status: 500 });
      resort = resortById ?? null;
    }

    if (!resort || resort.lat === null || resort.lon === null) {
      return NextResponse.json({ error: "Resort not found or missing coordinates" }, { status: 404 });
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
          ...cachedWeather,
          cache: "hit",
          weather_updated_at: cache.weather_updated_at,
        });
      }
    }

    const weather = await fetchOpenMeteo(Number(resort.lat), Number(resort.lon), {
      valleyElevationM: typeof resort.elevation_min_m === "number" ? resort.elevation_min_m : null,
      mountainElevationM: typeof resort.elevation_max_m === "number" ? resort.elevation_max_m : null,
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
      ...weather,
      cache: "miss",
      weather_updated_at: weather.updated_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
