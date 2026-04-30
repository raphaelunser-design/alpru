import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type ResortRow = {
  id: string | number;
  lat: number;
  lon: number;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    snowfall?: number;
    snow_depth?: number;
  };
  hourly?: {
    snowfall?: number[];
    snow_depth?: number[];
    temperature_2m?: number[];
  };
  model?: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPEN_METEO_BASE_URL =
  Deno.env.get("OPEN_METEO_BASE_URL") ?? "https://api.open-meteo.com/v1/forecast";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const MAX_BATCH = 40;
const STALE_MINUTES = 30;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, tries = 4) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const res = await fetch(url);
    if (res.ok) return res;

    if (res.status === 429 || res.status >= 500) {
      const delay = 500 * Math.pow(2, attempt);
      await sleep(delay);
      continue;
    }

    throw new Error(`Open-Meteo HTTP ${res.status}`);
  }
  throw new Error("Open-Meteo retries exceeded");
}

function buildUrl(batch: ResortRow[]) {
  const latList = batch.map((r) => r.lat).join(",");
  const lonList = batch.map((r) => r.lon).join(",");
  const params = new URLSearchParams({
    latitude: latList,
    longitude: lonList,
    current: "temperature_2m,weather_code,wind_speed_10m,snowfall,snow_depth",
    hourly: "snowfall,snow_depth,temperature_2m",
    forecast_days: "7",
    timezone: "auto",
  });
  return `${OPEN_METEO_BASE_URL}?${params.toString()}`;
}

function sumNext24(values: number[] | undefined) {
  if (!Array.isArray(values)) return null;
  const slice = values.slice(0, 24);
  if (!slice.length) return null;
  const total = slice.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
  return Math.round(total * 10) / 10;
}

function toCm(meters: number | undefined) {
  if (!Number.isFinite(meters)) return null;
  return Math.round((meters as number) * 100 * 10) / 10;
}

async function fetchBatch(batch: ResortRow[]): Promise<OpenMeteoResponse[]> {
  const url = buildUrl(batch);
  const res = await fetchWithRetry(url);
  const data = await res.json();
  if (Array.isArray(data)) return data as OpenMeteoResponse[];
  return [data as OpenMeteoResponse];
}

async function fetchBatchWithSplit(batch: ResortRow[]): Promise<OpenMeteoResponse[]> {
  try {
    return await fetchBatch(batch);
  } catch (err) {
    if (batch.length <= 1) throw err;
    const mid = Math.ceil(batch.length / 2);
    const left = await fetchBatchWithSplit(batch.slice(0, mid));
    const right = await fetchBatchWithSplit(batch.slice(mid));
    return [...left, ...right];
  }
}

serve(async (req) => {
  try {
    const body = req.headers.get("content-type")?.includes("application/json")
      ? await req.json().catch(() => ({}))
      : {};
    const force = Boolean(body?.force);
    const resortId = body?.resort_id ?? null;

    let resortQuery = supabase
      .from("resorts")
      .select("id,lat,lon")
      .not("lat", "is", null)
      .not("lon", "is", null);

    if (resortId) {
      resortQuery = resortQuery.eq("id", resortId);
    }

    const { data: resorts, error: resortError } = await resortQuery;
    if (resortError) {
      return new Response(JSON.stringify({ error: resortError.message }), { status: 500 });
    }

    if (!resorts || resorts.length === 0) {
      return new Response(JSON.stringify({ updated: 0, message: "No resorts found" }), { status: 200 });
    }

    const lastById = new Map<string, number>();
    for (let i = 0; i < resorts.length; i += MAX_BATCH) {
      const batchIds = resorts.slice(i, i + MAX_BATCH).map((r) => r.id);
      const { data: existing, error: existingError } = await supabase
        .from("resort_conditions")
        .select("resort_id,fetched_at")
        .in("resort_id", batchIds);

      if (existingError) {
        return new Response(JSON.stringify({ error: existingError.message }), { status: 500 });
      }

      (existing ?? []).forEach((row) => {
        const time = new Date(row.fetched_at).getTime();
        if (Number.isFinite(time)) lastById.set(String(row.resort_id), time);
      });
    }

    const now = Date.now();
    const staleMs = STALE_MINUTES * 60 * 1000;
    const targets = resorts.filter((r) => {
      if (force) return true;
      const last = lastById.get(String(r.id));
      if (!last) return true;
      return now - last > staleMs;
    }) as ResortRow[];

    if (targets.length === 0) {
      return new Response(JSON.stringify({ updated: 0, message: "All resorts up to date" }), { status: 200 });
    }

    let updated = 0;

    for (let i = 0; i < targets.length; i += MAX_BATCH) {
      const batch = targets.slice(i, i + MAX_BATCH);
      const responses = await fetchBatchWithSplit(batch);

      const rows = batch.map((resort, index) => {
        const response = responses[index];
        const current = response?.current ?? {};
        const snowfallNext24 = sumNext24(response?.hourly?.snowfall);
        const snowDepthCm = toCm(current?.snow_depth);
        const snowfall1h = Number.isFinite(current?.snowfall) ? current?.snowfall : null;

        return {
          resort_id: typeof resort.id === "string" && /^\d+$/.test(resort.id) ? Number(resort.id) : resort.id,
          fetched_at: new Date().toISOString(),
          source: "open_meteo",
          model: response?.model ?? null,
          temperature_c: Number.isFinite(current?.temperature_2m) ? current?.temperature_2m : null,
          wind_kph: Number.isFinite(current?.wind_speed_10m) ? current?.wind_speed_10m : null,
          weather_code: Number.isFinite(current?.weather_code) ? current?.weather_code : null,
          snowfall_1h_cm: snowfall1h,
          snow_depth_cm: snowDepthCm,
          snowfall_next_24h_cm: snowfallNext24,
          raw: response ?? null,
        };
      });

      const { error: upsertError } = await supabase.from("resort_conditions").upsert(rows, {
        onConflict: "resort_id",
      });

      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
      }

      updated += rows.length;
      await sleep(150);
    }

    return new Response(JSON.stringify({ updated }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
