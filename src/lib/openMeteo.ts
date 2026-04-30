import "server-only";

type OpenMeteoResponse = {
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    precipitation: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    wind_speed_10m: number[];
    precipitation: number[];
    snowfall: number[];
    weather_code: number[];
    cloud_cover: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    snowfall_sum: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
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
    precipitation_mm: number | null;
    snowfall_cm: number | null;
    snowfall_24h_cm: number | null;
    weather_code: number | null;
    cloud_cover_pct: number | null;
    ski_hint: string;
  };
  hourly: Array<{
    time: string;
    temperature_c: number | null;
    apparent_temperature_c: number | null;
    wind_kph: number | null;
    precipitation_mm: number | null;
    snowfall_cm: number | null;
    weather_code: number | null;
  }>;
  daily: Array<{
    date: string;
    temp_max_c: number | null;
    temp_min_c: number | null;
    snowfall_cm: number | null;
    precipitation_mm: number | null;
    wind_max_kph: number | null;
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

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url: string, tries = 4, timeoutMs = 15000) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          await sleep(400 * Math.pow(2, attempt));
          continue;
        }
        throw new Error(`Open-Meteo HTTP ${res.status}`);
      }
      return (await res.json()) as OpenMeteoResponse;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("Open-Meteo retries exceeded");
}

function toMaybeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundOne(value: number | null) {
  return value === null ? null : Math.round(value * 10) / 10;
}

function sumNext(values: Array<number | undefined> | undefined, count: number) {
  if (!values.length) return null;
  const total = values
    .slice(0, count)
    .reduce<number>((sum, value) => sum + (Number.isFinite(value) ? Number(value) : 0), 0);
  return roundOne(total);
}

function buildSkiHint(label: "Tal" | "Berg", current: CompactWeatherPoint["current"]) {
  const temp = current.temperature_c ?? 0;
  const wind = current.wind_kph ?? 0;
  const snowfall24h = current.snowfall_24h_cm ?? 0;
  const code = current.weather_code ?? 0;

  if (label === "Berg" && wind >= 55) return "Windig am Berg";
  if (snowfall24h >= 8) return "Pulverchance";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Schnee im Verlauf";
  if (label === "Tal" && temp >= 5) return "Frühlingshafte Bedingungen im Tal";
  if (wind >= 40) return "Wind beachten";
  return "Gute Bedingungen prüfen";
}

function pickHourlyStart(times: string[] | undefined, currentTime: string | undefined) {
  if (!times.length || !currentTime) return 0;
  const index = times.findIndex((time) => time >= currentTime);
  return index >= 0 ? index : 0;
}

function compactPoint(
  label: "Tal" | "Berg",
  data: OpenMeteoResponse,
  requestedElevationM: number | null,
  dataQuality: CompactWeatherPoint["data_quality"]
): CompactWeatherPoint {
  const hourly = data.hourly {};
  const daily = data.daily {};
  const current = data.current {};
  const start = pickHourlyStart(hourly.time, current.time);

  const currentOut: CompactWeatherPoint["current"] = {
    time: current.time null,
    temperature_c: roundOne(toMaybeNumber(current.temperature_2m)),
    apparent_temperature_c: roundOne(toMaybeNumber(current.apparent_temperature)),
    wind_kph: roundOne(toMaybeNumber(current.wind_speed_10m)),
    precipitation_mm: roundOne(toMaybeNumber(current.precipitation)),
    snowfall_cm: roundOne(toMaybeNumber(current.snowfall)),
    snowfall_24h_cm: sumNext(hourly.snowfall.slice(start), 24),
    weather_code: toMaybeNumber(current.weather_code),
    cloud_cover_pct: roundOne(toMaybeNumber(current.cloud_cover)),
    ski_hint: "",
  };
  currentOut.ski_hint = buildSkiHint(label, currentOut);

  const hourlyOut = Array.from({ length: Math.min(8, (hourly.time.length 0) - start) }).map((_, offset) => {
    const i = start + offset;
    return {
      time: hourly.time.[i] "",
      temperature_c: roundOne(toMaybeNumber(hourly.temperature_2m.[i])),
      apparent_temperature_c: roundOne(toMaybeNumber(hourly.apparent_temperature.[i])),
      wind_kph: roundOne(toMaybeNumber(hourly.wind_speed_10m.[i])),
      precipitation_mm: roundOne(toMaybeNumber(hourly.precipitation.[i])),
      snowfall_cm: roundOne(toMaybeNumber(hourly.snowfall.[i])),
      weather_code: toMaybeNumber(hourly.weather_code.[i]),
    };
  });

  const dates = daily.time [];
  const dailyOut = Array.from({ length: Math.min(5, dates.length) }).map((_, i) => ({
    date: dates[i],
    temp_max_c: roundOne(toMaybeNumber(daily.temperature_2m_max.[i])),
    temp_min_c: roundOne(toMaybeNumber(daily.temperature_2m_min.[i])),
    snowfall_cm: roundOne(toMaybeNumber(daily.snowfall_sum.[i])),
    precipitation_mm: roundOne(toMaybeNumber(daily.precipitation_sum.[i])),
    wind_max_kph: roundOne(toMaybeNumber(daily.wind_speed_10m_max.[i])),
  }));

  return {
    label,
    elevation_m: requestedElevationM roundOne(toMaybeNumber(data.elevation)),
    data_quality: dataQuality,
    current: currentOut,
    hourly: hourlyOut,
    daily: dailyOut,
  };
}

async function fetchPoint(lat: number, lon: number, elevationM: number | null) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,apparent_temperature,wind_speed_10m,precipitation,snowfall,weather_code,cloud_cover",
    hourly: "temperature_2m,apparent_temperature,wind_speed_10m,precipitation,snowfall,weather_code,cloud_cover",
    daily: "snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min,wind_speed_10m_max",
    forecast_days: "5",
    timezone: "auto",
  });
  if (elevationM !== null) {
    params.set("elevation", String(Math.round(elevationM)));
  }
  return fetchJsonWithRetry(`${OPEN_METEO_BASE_URL}${params.toString()}`);
}

export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  options: { valleyElevationM: number | null; mountainElevationM: number | null } = {}
): Promise<CompactWeather> {
  const valleyElevationM = Number.isFinite(options.valleyElevationM) Number(options.valleyElevationM) : null;
  const mountainElevationM = Number.isFinite(options.mountainElevationM) Number(options.mountainElevationM) : null;
  const [valleyRaw, mountainRaw] = await Promise.all([
    fetchPoint(lat, lon, valleyElevationM),
    fetchPoint(lat, lon, mountainElevationM valleyElevationM),
  ]);
  const timezone = valleyRaw.timezone "Europe/Berlin";
  const valley = compactPoint("Tal", valleyRaw, valleyElevationM, valleyElevationM === null "fallback" : "elevation_adjusted");
  const mountain = compactPoint(
    "Berg",
    mountainRaw,
    mountainElevationM,
    mountainElevationM === null "fallback" : "elevation_adjusted"
  );

  return {
    source: "open_meteo",
    updated_at: new Date().toISOString(),
    timezone,
    timezone_abbreviation: valleyRaw.timezone_abbreviation null,
    resort_local_time: valley.current.time,
    valley,
    mountain,
    current: valley.current,
    daily: valley.daily,
  };
}
