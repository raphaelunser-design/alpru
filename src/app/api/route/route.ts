import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Coordinate = {
  lat: number;
  lon: number;
};

type OsrmRouteResponse = {
  code: string;
  message: string;
  routes: Array<{
    duration: number;
    distance: number;
    geometry: {
      type: string;
      coordinates: Array<[number, number]>;
    };
  }>;
};

const OSRM_BASE_URL = (process.env.OSRM_BASE_URL || "https://router.project-osrm.org").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 14000;

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

function fallbackRoute(origin: Coordinate, destination: Coordinate) {
  const distanceMeters = Math.round(haversineKm(origin, destination) * 1.24 * 1000);
  const durationSeconds = Math.round((distanceMeters / 1000 / 68) * 3600);
  return {
    durationSeconds,
    distanceMeters,
    source: "fallback" as const,
    coordinates: [
      [origin.lat, origin.lon],
      [destination.lat, destination.lon],
    ],
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

export async function POST(req: Request) {
  const body = asRecord(await req.json().catch(() => null));
  const origin = parseCoordinate(body.origin);
  const destination = parseCoordinate(body.destination);

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }

  const coordinates = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}overview=full&geometries=geojson&steps=false&alternatives=false`;

  try {
    const data = await fetchJson<OsrmRouteResponse>(url);
    if (data.code && data.code !== "Ok") throw new Error(data.message || data.code);
    const route = data.routes?.[0];
    if (!route.geometry.coordinates.length) throw new Error("Missing route geometry");

    return NextResponse.json({
      durationSeconds: typeof route.duration === "number" ? route.duration : null,
      distanceMeters: typeof route.distance === "number" ? route.distance : null,
      source: "osrm",
      coordinates: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    });
  } catch {
    return NextResponse.json(fallbackRoute(origin, destination));
  }
}
