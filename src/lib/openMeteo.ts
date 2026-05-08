import "server-only";

type OpenMeteoCurrent = {
  time?: string;
  temperature_2m?: number;
  apparent_temperature?: number;
  wind_speed_10m?: number;
  wind_gusts_10m?: number;
  precipitation?: number;
  rain?: number;
  snowfall?: number;
  snow_depth?: number;
  weather_code?: number;
  cloud_cover?: number;
};

type OpenMeteoHourly = {
  time?: string[];
  temperature_2m?: number[];
  apparent_temperature?: number[];
  wind_speed_10m?: number[];
  wind_gusts_10m?: number[];
  precipitation?: number[];
  rain?: number[];
  snowfall?: number[];
  snow_depth?: number[];
  weather_code?: number[];
  cloud_cover?: number[];
};

type OpenMeteoDaily = {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  snowfall_sum?: number[];
  precipitation_sum?: number[];
  rain_sum?: number[];
  wind_speed_10m_max?: number[];
  wind_gusts_10m_max?: number[];
};

type OpenMeteoResponse = {
  elevation?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
  daily?: OpenMeteoDaily;
  error?: boolean;
  reason?: string;
};

export type CompactWeatherPoint = {
  label: "Tal" | "Berg";
  elevation_m: number | null;
  data_quality: "elevation_adjusted" | "fallback";
  current: {
    time: string | null;
    temperature_c: number | null;
    apparent_temperature_c: number | null;
    wind_kph: number | null;
    wind_gust_kph: number | null;
    precipitation_mm: number | null;
    rain_mm: number | null;
    snowfall_cm: number | null;
    snowfall_24h_cm: number | null;
    snow_depth_cm: number | null;
    weather_code: number | null;
    cloud_cover_pct: number | null;
    ski_hint: string;
  };
  hourly: Array<{
    time: string;
    temperature_c: number | null;
    apparent_temperature_c: number | null;
    wind_kph: number | null;
    wind_gust_kph: number | null;
    precipitation_mm: number | null;
    rain_mm: number | null;
    snowfall_cm: number | null;
    snow_depth_cm: number | null;
    weather_code: number | null;
  }>;
  daily: Array<{
    date: string;
    temp_max_c: number | null;
    temp_min_c: number | null;
    snowfall_cm: number | null;
    precipitation_mm: number | null;
    rain_mm: number | null;
    wind_max_kph: number | null;
    wind_gust_max_kph: number | null;
  }>;
};

export type CompactWeather = {
  source: "open_meteo";
  updated_at: string;
  timezone: string;
  timezone_abbreviation: string | null;
  resort_local_time: string | null;
  valley: CompactWeatherPoint;
  mountain: CompactWeatherPoint;
  current: CompactWeatherPoint["current"];
  daily: CompactWeatherPoint["daily"];
};

type FetchOpenMeteoOptions = {
  valleyElevationM?: number | null;
  mountainElevationM?: number | null;
  baseElevationM?: number | null;
  summitElevationM?: number | null;
  timezone?: string | null;
};

export class OpenMeteoError extends Error {
  status: number;
  diagnostic: string | null;

  constructor(message: string, status = 503, diagnostic: string | null = null) {
    super(message);
    this.name = "OpenMeteoError";
    this.status = status;
    this.diagnostic = diagnostic;
  }
}

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const DEFAULT_TIMEZONE = "Europe/Berlin";
const CURRENT_VARIABLES = [
  "temperature_2m",
  "apparent_temperature",
  "snowfall",
  "rain",
  "precipitation",
  "cloud_cover",
  "wind_speed_10m",
  "wind_gusts_10m",
  "weather_code",
  "snow_depth",
].join(",");
const HOURLY_VARIABLES = CURRENT_VARIABLES;
const DAILY_VARIABLES = [
  "temperature_2m_max",
  "temperature_2m_min",
  "snowfall_sum",
  "precipitation_sum",
  "rain_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
].join(",");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function diagnosticFrom(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function fetchJsonWithRetry(url: string, tries = 3, timeoutMs = 10000) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < tries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const error = new OpenMeteoError(
          `Open-Meteo HTTP ${res.status}`,
          res.status,
          body.slice(0, 300) || null
        );

        if ((res.status === 429 || res.status >= 500) && attempt < tries - 1) {
          lastError = error;
          await sleep(350 * Math.pow(2, attempt));
          continue;
        }

        throw error;
      }

      const data = (await res.json()) as OpenMeteoResponse;
      if (data.error) {
        throw new OpenMeteoError("Open-Meteo returned an API error", 502, data.reason ?? null);
      }

      return data;
    } catch (error) {
      lastError = error;
      if (error instanceof OpenMeteoError && error.status < 500 && error.status !== 429) {
        throw error;
      }
      if (attempt < tries - 1) {
        await sleep(350 * Math.pow(2, attempt));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new OpenMeteoError("Open-Meteo request failed", 503, diagnosticFrom(lastError));
}

function toMaybeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toValidCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function toElevation(value: unknown) {
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && Number.isFinite(num) && num > -500 && num < 9000 ? num : null;
}

function toSnowDepthCm(value: unknown) {
  const meters = toMaybeNumber(value);
  return meters === null ? null : roundOne(meters * 100);
}

function roundOne(value: number | null) {
  return value === null ? null : Math.round(value * 10) / 10;
}

function normalizeTimezone(value: string | null | undefined) {
  const timezone = (value || DEFAULT_TIMEZONE).trim();
  if (!timezone || timezone.length > 80 || !/^[A-Za-z0-9_+\-/]+$/.test(timezone)) return DEFAULT_TIMEZONE;
  return timezone;
}

function valueAt(values: number[] | undefined, index: number) {
  return Array.isArray(values) ? values[index] : undefined;
}

function sumNext(values: number[] | undefined, start: number, count: number) {
  if (!Array.isArray(values) || !values.length) return null;
  const total = values
    .slice(start, start + count)
    .reduce<number>((sum, value) => sum + (Number.isFinite(value) ? Number(value) : 0), 0);
  return roundOne(total);
}

function buildSkiHint(label: "Tal" | "Berg", current: CompactWeatherPoint["current"]) {
  const temp = current.temperature_c ?? 0;
  const wind = current.wind_kph ?? 0;
  const gust = current.wind_gust_kph ?? 0;
  const snowfall24h = current.snowfall_24h_cm ?? 0;
  const snowDepth = current.snow_depth_cm ?? 0;
  const code = current.weather_code ?? 0;

  if (label === "Berg" && Math.max(wind, gust) >= 55) return "Windig am Berg";
  if (snowfall24h >= 8) return "Pulverchance";
  if (snowDepth >= 80 && label === "Berg") return "Solide Schneelage";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Schnee im Verlauf";
  if (label === "Tal" && temp >= 5) return "Frühlingshafte Bedingungen im Tal";
  if (Math.max(wind, gust) >= 40) return "Wind beachten";
  return "Gute Bedingungen prüfen";
}

function pickHourlyStart(times: string[] | undefined, currentTime: string | undefined) {
  if (!times || !times.length || !currentTime) return 0;
  const index = times.findIndex((time) => time >= currentTime);
  return index >= 0 ? index : 0;
}

function compactPoint(
  label: "Tal" | "Berg",
  data: OpenMeteoResponse,
  requestedElevationM: number | null,
  dataQuality: CompactWeatherPoint["data_quality"]
): CompactWeatherPoint {
  const hourly = data.hourly ?? {};
  const daily = data.daily ?? {};
  const current = data.current ?? {};
  const start = pickHourlyStart(hourly.time, current.time);

  const currentOut: CompactWeatherPoint["current"] = {
    time: current.time ?? null,
    temperature_c: roundOne(toMaybeNumber(current.temperature_2m)),
    apparent_temperature_c: roundOne(toMaybeNumber(current.apparent_temperature)),
    wind_kph: roundOne(toMaybeNumber(current.wind_speed_10m)),
    wind_gust_kph: roundOne(toMaybeNumber(current.wind_gusts_10m)),
    precipitation_mm: roundOne(toMaybeNumber(current.precipitation)),
    rain_mm: roundOne(toMaybeNumber(current.rain)),
    snowfall_cm: roundOne(toMaybeNumber(current.snowfall)),
    snowfall_24h_cm: sumNext(hourly.snowfall, start, 24),
    snow_depth_cm: toSnowDepthCm(current.snow_depth),
    weather_code: toMaybeNumber(current.weather_code),
    cloud_cover_pct: roundOne(toMaybeNumber(current.cloud_cover)),
    ski_hint: "",
  };
  currentOut.ski_hint = buildSkiHint(label, currentOut);

  const hours = hourly.time ?? [];
  const hourlyOut = Array.from({ length: Math.max(0, Math.min(8, hours.length - start)) }).map((_, offset) => {
    const i = start + offset;
    return {
      time: hours[i] ?? "",
      temperature_c: roundOne(toMaybeNumber(valueAt(hourly.temperature_2m, i))),
      apparent_temperature_c: roundOne(toMaybeNumber(valueAt(hourly.apparent_temperature, i))),
      wind_kph: roundOne(toMaybeNumber(valueAt(hourly.wind_speed_10m, i))),
      wind_gust_kph: roundOne(toMaybeNumber(valueAt(hourly.wind_gusts_10m, i))),
      precipitation_mm: roundOne(toMaybeNumber(valueAt(hourly.precipitation, i))),
      rain_mm: roundOne(toMaybeNumber(valueAt(hourly.rain, i))),
      snowfall_cm: roundOne(toMaybeNumber(valueAt(hourly.snowfall, i))),
      snow_depth_cm: toSnowDepthCm(valueAt(hourly.snow_depth, i)),
      weather_code: toMaybeNumber(valueAt(hourly.weather_code, i)),
    };
  });

  const dates = daily.time ?? [];
  const dailyOut = Array.from({ length: Math.min(5, dates.length) }).map((_, i) => ({
    date: dates[i] ?? "",
    temp_max_c: roundOne(toMaybeNumber(valueAt(daily.temperature_2m_max, i))),
    temp_min_c: roundOne(toMaybeNumber(valueAt(daily.temperature_2m_min, i))),
    snowfall_cm: roundOne(toMaybeNumber(valueAt(daily.snowfall_sum, i))),
    precipitation_mm: roundOne(toMaybeNumber(valueAt(daily.precipitation_sum, i))),
    rain_mm: roundOne(toMaybeNumber(valueAt(daily.rain_sum, i))),
    wind_max_kph: roundOne(toMaybeNumber(valueAt(daily.wind_speed_10m_max, i))),
    wind_gust_max_kph: roundOne(toMaybeNumber(valueAt(daily.wind_gusts_10m_max, i))),
  }));

  return {
    label,
    elevation_m: requestedElevationM ?? roundOne(toMaybeNumber(data.elevation)),
    data_quality: dataQuality,
    current: currentOut,
    hourly: hourlyOut,
    daily: dailyOut,
  };
}

async function fetchPoint(lat: number, lon: number, elevationM: number | null, timezone: string) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: CURRENT_VARIABLES,
    hourly: HOURLY_VARIABLES,
    daily: DAILY_VARIABLES,
    forecast_days: "5",
    timezone,
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  if (elevationM !== null) {
    params.set("elevation", String(Math.round(elevationM)));
  }

  return fetchJsonWithRetry(`${OPEN_METEO_BASE_URL}?${params.toString()}`);
}

export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  options: FetchOpenMeteoOptions = {}
): Promise<CompactWeather> {
  const validLat = toValidCoordinate(lat, -90, 90);
  const validLon = toValidCoordinate(lon, -180, 180);
  if (validLat === null || validLon === null) {
    throw new OpenMeteoError("Invalid coordinates", 400);
  }

  const timezone = normalizeTimezone(options.timezone);
  const valleyElevationM = toElevation(options.baseElevationM ?? options.valleyElevationM);
  const explicitMountainElevationM = toElevation(options.summitElevationM ?? options.mountainElevationM);
  const mountainRequestElevationM = explicitMountainElevationM ?? valleyElevationM;

  const [valleyRaw, mountainRaw] = await Promise.all([
    fetchPoint(validLat, validLon, valleyElevationM, timezone),
    fetchPoint(validLat, validLon, mountainRequestElevationM, timezone),
  ]);

  const responseTimezone = valleyRaw.timezone ?? timezone;
  const valley = compactPoint(
    "Tal",
    valleyRaw,
    valleyElevationM,
    valleyElevationM === null ? "fallback" : "elevation_adjusted"
  );
  const mountain = compactPoint(
    "Berg",
    mountainRaw,
    mountainRequestElevationM,
    explicitMountainElevationM === null ? "fallback" : "elevation_adjusted"
  );

  return {
    source: "open_meteo",
    updated_at: new Date().toISOString(),
    timezone: responseTimezone,
    timezone_abbreviation: valleyRaw.timezone_abbreviation ?? null,
    resort_local_time: valley.current.time,
    valley,
    mountain,
    current: valley.current,
    daily: valley.daily,
  };
}
