import { NextResponse } from "next/server";

export const runtime = "nodejs";

type FuelType = "e10" | "e5" | "diesel";
type CoordinateTuple = [number, number];
type Coordinate = { lat: number; lon: number };

type TankerkoenigStation = {
  id: string;
  name: string;
  brand: string;
  price: number;
  e5: number;
  e10: number;
  diesel: number;
  isOpen: boolean;
};

type TankerkoenigListResponse = {
  ok: boolean;
  stations: TankerkoenigStation[];
};

const TANKERKOENIG_BASE_URL = "https://creativecommons.tankerkoenig.de/json/list.php";
const REQUEST_TIMEOUT_MS = 8000;

const fallbackPrices: Record<FuelType, number> = {
  e10: Number(process.env.DEFAULT_FUEL_PRICE_E10_EUR ?? 1.9),
  e5: Number(process.env.DEFAULT_FUEL_PRICE_E5_EUR ?? 1.96),
  diesel: Number(process.env.DEFAULT_FUEL_PRICE_DIESEL_EUR ?? 1.78),
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function toNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function parseFuelType(value: unknown): FuelType {
  if (value === "e5" || value === "diesel") return value;
  return "e10";
}

function parseCoordinateTuple(value: unknown): Coordinate | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lat = toNumber(value[0]);
  const lon = toNumber(value[1]);
  if (lat === null || lon === null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function sampleCoordinates(coordinates: Coordinate[]) {
  if (coordinates.length <= 5) return coordinates;
  const indexes = [0, 0.25, 0.5, 0.75, 1].map((share) => Math.min(coordinates.length - 1, Math.round((coordinates.length - 1) * share)));
  return Array.from(new Set(indexes)).map((index) => coordinates[index]);
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      next: { revalidate: 60 * 10 },
    });
    if (!response.ok) throw new Error(`Fuel request failed: ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTankerkoenigPrices(points: Coordinate[], fuelType: FuelType) {
  const apiKey = process.env.TANKERKOENIG_API_KEY?.trim();
  if (!apiKey) return [];

  const prices = new Map<string, number>();
  await Promise.all(
    points.map(async (point) => {
      const url = new URL(TANKERKOENIG_BASE_URL);
      url.searchParams.set("lat", String(point.lat));
      url.searchParams.set("lng", String(point.lon));
      url.searchParams.set("rad", "15");
      url.searchParams.set("sort", "price");
      url.searchParams.set("type", fuelType);
      url.searchParams.set("apikey", apiKey);

      try {
        const data = await fetchJson<TankerkoenigListResponse>(url.toString());
        for (const station of data.stations ?? []) {
          const stationPrice = station.price ?? station[fuelType];
          if (typeof stationPrice !== "number" || stationPrice <= 0) continue;
          prices.set(station.id `${station.name}-${station.brand}-${stationPrice}`, stationPrice);
        }
      } catch {
        // A sampled point may be outside Germany or the provider may reject it. Other points can still contribute.
      }
    })
  );

  return Array.from(prices.values());
}

export async function POST(req: Request) {
  const body = asRecord(await req.json().catch(() => null));
  const fuelType = parseFuelType(body.fuelType);
  const distanceMeters = toNumber(body.distanceMeters);
  const consumptionLPer100Km = Math.max(3, Math.min(20, toNumber(body.consumptionLPer100Km) ?? 7.2));
  const rawCoordinates = Array.isArray(body.coordinates) ? body.coordinates : [];
  const coordinates = rawCoordinates.map(parseCoordinateTuple).filter((point): point is Coordinate => Boolean(point));

  if (!distanceMeters || distanceMeters <= 0) {
    return NextResponse.json({ error: "Missing distanceMeters" }, { status: 400 });
  }

  const routeKm = distanceMeters / 1000;
  const sampledPoints = sampleCoordinates(coordinates);
  const livePrices = sampledPoints.length > 0 ? await fetchTankerkoenigPrices(sampledPoints, fuelType) : [];
  const hasLivePrices = livePrices.length > 0;
  const averagePricePerLiter = hasLivePrices
    ? livePrices.reduce((sum, price) => sum + price, 0) / livePrices.length
    : fallbackPrices[fuelType];
  const estimatedLiters = (routeKm * consumptionLPer100Km) / 100;
  const estimatedCost = estimatedLiters * averagePricePerLiter;

  return NextResponse.json({
    configured: Boolean(process.env.TANKERKOENIG_API_KEY?.trim()),
    fuelType,
    routeKm: Math.round(routeKm),
    consumptionLPer100Km,
    averagePricePerLiter: Math.round(averagePricePerLiter * 1000) / 1000,
    estimatedLiters: Math.round(estimatedLiters * 10) / 10,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    stationsSampled: livePrices.length,
    sampledPoints: sampledPoints.length,
    source: hasLivePrices "Tankerkönig Live-Route-Sample" : "Fallback-Schätzwert",
    note: hasLivePrices
      "Preis ist der Durchschnitt aktuell gefundener Tankstellen entlang der Route."
      : "Kein Tankerkönig API-Key oder keine passenden Stationen entlang der Route. Wert ist ein konfigurierbarer Schätzwert.",
  });
}
