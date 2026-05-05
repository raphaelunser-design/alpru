import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Coordinate = {
  lat: number;
  lon: number;
};

type Destination = Coordinate & {
  id: string;
};

type RouteMetric = {
  id: string;
  durationSeconds: number | null;
  distanceMeters: number | null;
  source: "osrm" | "fallback";
};

type OsrmTableResponse = {
  code: string;
  message: string;
  durations: Array<Array<number | null>>;
  distances: Array<Array<number | null>>;
};

const OSRM_BASE_URL = (process.env.OSRM_BASE_URL || "https://router.project-osrm.org").replace(/\/$/, "");
const BATCH_SIZE = 75;
const REQUEST_TIMEOUT_MS = 12000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function toNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function parseCoordinate(value: unknown): Coordinate | null {
  const record = asRecord(value);
  if (!record) return null;
  const lat = toNumber(record.lat);
  const lon = toNumber(record.lon);
  if (lat === null || lon === null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function parseDestination(value: unknown): Destination | null {
  const record = asRecord(value);
  if (!record) return null;
  const coordinate = parseCoordinate(record);
  const id = String(record.id ?? "").trim();
  if (!coordinate || !id) return null;
  return { id, ...coordinate };
}

function haversineKm(a: Coordinate, b: Coordinate) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function fallbackMetric(origin: Coordinate, destination: Destination): RouteMetric {
  const distanceMeters = Math.round(haversineKm(origin, destination) * 1.24 * 1000);
  const durationSeconds = Math.round((distanceMeters / 1000 / 68) * 3600);
  return {
    id: destination.id,
    durationSeconds,
    distanceMeters,
    source: "fallback",
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) throw new Error(`Routing request failed: ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBatch(origin: Coordinate, destinations: Destination[]): Promise<RouteMetric[]> {
  const coordinates = [origin, ...destinations].map((point) => `${point.lon},${point.lat}`).join(";");
  const destinationIndexes = destinations.map((_, index) => index + 1).join(";");
  const url = `${OSRM_BASE_URL}/table/v1/driving/${coordinates}sources=0&destinations=${destinationIndexes}&annotations=duration,distance`;

  try {
    const data = await fetchJson<OsrmTableResponse>(url);
    if (data.code && data.code !== "Ok") throw new Error(data.message || data.code);

    const durations = data.durations?.[0] ?? [];
    const distances = data.distances?.[0] ?? [];

    return destinations.map((destination, index) => ({
      id: destination.id,
      durationSeconds: typeof durations[index] === "number" ? durations[index] : null,
      distanceMeters: typeof distances[index] === "number" ? distances[index] : null,
      source: "osrm",
    }));
  } catch {
    return destinations.map((destination) => fallbackMetric(origin, destination));
  }
}

export async function POST(req: Request) {
  const body = asRecord(await req.json().catch(() => null)) ?? {};
  const origin = parseCoordinate(body.origin);
  const rawDestinations = Array.isArray(body.destinations) ? body.destinations : [];
  const destinations = rawDestinations.map(parseDestination).filter((item): item is Destination => Boolean(item));

  if (!origin) {
    return NextResponse.json({ error: "Missing origin" }, { status: 400 });
  }

  if (destinations.length === 0) {
    return NextResponse.json({ routes: [] });
  }

  const chunks: Destination[][] = [];
  for (let index = 0; index < destinations.length; index += BATCH_SIZE) {
    chunks.push(destinations.slice(index, index + BATCH_SIZE));
  }

  const batches = await Promise.all(chunks.map((chunk) => fetchBatch(origin, chunk)));
  const routes = batches.flat();
  const usedFallback = routes.some((route) => route.source === "fallback");

  return NextResponse.json({
    routes,
    provider: usedFallback ? "fallback" : "osrm",
    note: usedFallback ? "Ein Teil der Routingdaten wurde approximiert, weil der Routingdienst nicht erreichbar war." : null,
  });
}
