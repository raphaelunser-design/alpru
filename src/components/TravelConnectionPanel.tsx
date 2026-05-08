"use client";

import { useEffect, useMemo, useState } from "react";
import RoutePreview from "@/components/RoutePreview";

export type TravelMode = "car" | "train" | "bus" | "flight";

type TravelOrigin = {
  lat: number;
  lon: number;
  label: string;
} | null;

type TravelConnectionPanelProps = {
  title: string;
  resortName: string;
  country: string | null;
  region: string | null;
  destinationLat: number | null;
  destinationLon: number | null;
  origin: TravelOrigin;
  travelMode: TravelMode;
  tripStartDate: string | null;
  tripEndDate: string | null;
  roadDurationHours: number | null;
  roadDistanceKm: number | null;
  routeSource: "osrm" | "fallback" | null;
  compact?: boolean;
};

type ProviderId = "db" | "omio" | "trainline";

type ProviderConfig = {
  id: ProviderId;
  label: string;
  eyebrow: string;
  description: string;
  baseUrl: string;
  modes: TravelMode[];
};

type ProviderApiState = {
  id: ProviderId;
  label: string;
  status: "ready" | "link-only" | "not-applicable";
  capability: string;
};

type TravelConnectionOffer = {
  id: string;
  provider: ProviderId;
  mode: TravelMode;
  title: string;
  departureTime: string | null;
  arrivalTime: string | null;
  durationMinutes: number | null;
  changes: number | null;
  price: number | null;
  currency: string;
  bookingUrl: string | null;
  source: "provider-api" | "search-link";
};

type TravelConnectionApiResponse = {
  configured: boolean;
  providers: ProviderApiState[];
  connections: TravelConnectionOffer[];
  cheapest: TravelConnectionOffer | null;
  requestedDate: string | null;
  note: string;
};

type ApiState = {
  status: "idle" | "loading" | "ready" | "error";
  data: TravelConnectionApiResponse | null;
  error: string;
};

type GeocodeResult = {
  id: string | number;
  label: string;
  country: string;
  lat: number;
  lon: number;
};

type RouteResponse = {
  durationSeconds: number | null;
  distanceMeters: number | null;
  source: "osrm" | "fallback";
  coordinates: Array<[number, number]>;
};

type RouteState = {
  status: "idle" | "loading" | "ready" | "error";
  data: RouteResponse | null;
  error: string;
};

type FuelType = "e10" | "e5" | "diesel";

type FuelEstimate = {
  configured: boolean;
  fuelType: FuelType;
  routeKm: number;
  consumptionLPer100Km: number;
  averagePricePerLiter: number;
  estimatedLiters: number;
  estimatedCost: number;
  stationsSampled: number;
  sampledPoints: number;
  source: string;
  note: string;
};

type FuelState = {
  status: "idle" | "loading" | "ready" | "error";
  data: FuelEstimate | null;
  error: string;
};

const number = new Intl.NumberFormat("de-DE");
const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const providerConfig: ProviderConfig[] = [
  {
    id: "db",
    label: "DB",
    eyebrow: "Bahn",
    description: "Direkt zur Bahnsuche. Gut für Deutschland, Österreich und Schweiz.",
    baseUrl: process.env.NEXT_PUBLIC_DB_TRAVEL_URL || "https://www.bahn.de/buchung/start",
    modes: ["train"],
  },
  {
    id: "omio",
    label: "Omio",
    eyebrow: "Bahn & Bus",
    description: "Vergleich für Bahn- und Busverbindungen, später ideal für Partnerlinks.",
    baseUrl: process.env.NEXT_PUBLIC_OMIO_TRAVEL_URL || "https://www.omio.de/",
    modes: ["train", "bus", "flight"],
  },
  {
    id: "trainline",
    label: "Trainline",
    eyebrow: "International",
    description: "Alternative Suche für internationale Bahnstrecken.",
    baseUrl: process.env.NEXT_PUBLIC_TRAINLINE_TRAVEL_URL || "https://www.thetrainline.com/de",
    modes: ["train"],
  },
];

function isValidCoordinate(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value);
}

function modeLabel(mode: TravelMode | undefined) {
  if (mode === "train") return "Bahn";
  if (mode === "bus") return "Bus";
  if (mode === "flight") return "Flug + Transfer";
  return "Auto";
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
}

function formatTripDates(start: string | null | undefined, end: string | null | undefined) {
  const from = formatDate(start);
  const to = formatDate(end);
  if (from && to && from !== to) return `${from} - ${to}`;
  if (from) return from;
  return "Reisedatum offen";
}

function formatDriveHours(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  const totalMinutes = Math.max(1, Math.round(value * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function formatDistance(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `${number.format(Math.round(value))} km`;
}

function formatDurationMinutes(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function formatConnectionTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function persistOrigin(origin: NonNullable<TravelOrigin>) {
  if (!isValidCoordinate(origin.lat) || !isValidCoordinate(origin.lon)) return;
  try {
    const raw = localStorage.getItem("alpivo_results_filters");
    const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(
      "alpivo_results_filters",
      JSON.stringify({
        ...current,
        originLat: String(origin.lat),
        originLon: String(origin.lon),
        originLabel: origin.label || "Startort",
      })
    );
  } catch {
    // local storage is optional for this panel
  }
}

function buildDestinationLabel(resortName: string, region: string | null, country: string | null) {
  return [resortName, region, country].filter(Boolean).join(", ");
}

function buildProviderUrl(provider: ProviderConfig, originLabel: string | null, destinationLabel: string, tripStartDate: string | null) {
  try {
    const url = new URL(provider.baseUrl);
    url.searchParams.set("utm_source", "alpivo");
    url.searchParams.set("utm_medium", "partner_slot");
    url.searchParams.set("utm_campaign", "travel_connection");

    if (provider.id === "db") {
      if (originLabel) url.searchParams.set("S", originLabel);
      url.searchParams.set("Z", destinationLabel);
      if (tripStartDate) url.searchParams.set("date", tripStartDate);
    } else {
      if (originLabel) url.searchParams.set("from", originLabel);
      url.searchParams.set("to", destinationLabel);
      if (tripStartDate) url.searchParams.set("date", tripStartDate);
    }

    return url.toString();
  } catch {
    return provider.baseUrl;
  }
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="M5 10h9m0 0-4-4m4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M6.5 17.5c3.5-6.8 7.5-4.2 11-11m0 0h-4m4 0v4M6 18.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm16-13a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function TravelConnectionPanel({
  title = "Anreise planen",
  resortName,
  country,
  region,
  destinationLat,
  destinationLon,
  origin,
  travelMode = "car",
  tripStartDate,
  tripEndDate,
  roadDurationHours,
  roadDistanceKm,
  routeSource,
  compact = false,
}: TravelConnectionPanelProps) {
  const [showRoute, setShowRoute] = useState(false);
  const [apiState, setApiState] = useState<ApiState>({ status: "idle", data: null, error: "" });
  const [activeOrigin, setActiveOrigin] = useState<TravelOrigin>(origin || null);
  const [originQuery, setOriginQuery] = useState(origin ? origin.label : "");
  const [originResults, setOriginResults] = useState<GeocodeResult[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [originError, setOriginError] = useState("");
  const [routeState, setRouteState] = useState<RouteState>({ status: "idle", data: null, error: "" });
  const [fuelType, setFuelType] = useState<FuelType>("e10");
  const [consumptionLPer100Km, setConsumptionLPer100Km] = useState(7.2);
  const [fuelState, setFuelState] = useState<FuelState>({ status: "idle", data: null, error: "" });
  const destinationLabel = useMemo(
    () => buildDestinationLabel(resortName, region, country),
    [country, region, resortName]
  );
  const originLabel = activeOrigin ? activeOrigin.label.trim() || null : null;
  const activeProviders = providerConfig.filter((provider) => provider.modes.includes(travelMode) || travelMode === "car");
  const canShowRoute = Boolean(
    activeOrigin &&
      isValidCoordinate(activeOrigin.lat) &&
      isValidCoordinate(activeOrigin.lon) &&
      isValidCoordinate(destinationLat) &&
      isValidCoordinate(destinationLon)
  );
  const routeDurationHours =
    routeState.data && typeof routeState.data.durationSeconds === "number" ? routeState.data.durationSeconds / 3600 : roadDurationHours;
  const routeDistanceKm =
    routeState.data && typeof routeState.data.distanceMeters === "number" ? routeState.data.distanceMeters / 1000 : roadDistanceKm;
  const effectiveRouteSource = routeState.data ? routeState.data.source : routeSource;
  const driveLabel = routeState.status === "loading" ? "Route wird berechnet..." : formatDriveHours(routeDurationHours);
  const distanceLabel = formatDistance(routeDistanceKm);
  const isPublicTransport = travelMode === "train" || travelMode === "bus";
  const providerStateById = useMemo(() => {
    return new Map(((apiState.data && apiState.data.providers) || []).map((provider) => [provider.id, provider]));
  }, [apiState.data]);
  const cheapestConnection = apiState.data && apiState.data.cheapest ? apiState.data.cheapest : null;

  useEffect(() => {
    setActiveOrigin(origin || null);
    setOriginQuery(origin ? origin.label : "");
  }, [origin?.lat, origin?.lon, origin?.label]);

  useEffect(() => {
    const needle = originQuery.trim();
    if (!needle || needle.length < 2 || needle === originLabel) {
      setOriginResults([]);
      setOriginLoading(false);
      return;
    }

    let active = true;
    const handle = window.setTimeout(() => {
      setOriginLoading(true);
      setOriginError("");
      fetch(`/api/geocode?q=${encodeURIComponent(needle)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Startort konnte nicht gesucht werden.");
          return response.json();
        })
        .then((data) => {
          if (!active) return;
          setOriginResults((data.results as GeocodeResult[]) || []);
        })
        .catch((err: Error) => {
          if (!active) return;
          setOriginResults([]);
          setOriginError(err.message);
        })
        .finally(() => {
          if (!active) return;
          setOriginLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [originLabel, originQuery]);

  useEffect(() => {
    if (!canShowRoute || !activeOrigin) {
      setRouteState({ status: "idle", data: null, error: "" });
      return;
    }

    const controller = new AbortController();
    setRouteState({ status: "loading", data: null, error: "" });

    fetch("/api/route", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        origin: { lat: activeOrigin.lat, lon: activeOrigin.lon, label: activeOrigin.label },
        destination: { lat: destinationLat, lon: destinationLon, label: destinationLabel },
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Route konnte nicht berechnet werden.");
        return response.json();
      })
      .then((data: RouteResponse) => {
        if (controller.signal.aborted) return;
        setRouteState({ status: "ready", data, error: "" });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setRouteState({ status: "error", data: null, error: err.message });
      });

    return () => controller.abort();
  }, [activeOrigin, canShowRoute, destinationLabel, destinationLat, destinationLon]);

  const selectOrigin = (result: GeocodeResult) => {
    const next = { lat: result.lat, lon: result.lon, label: result.label };
    setActiveOrigin(next);
    setOriginQuery(result.label);
    setOriginResults([]);
    setOriginError("");
    persistOrigin(next);
  };

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setOriginError("Dein Browser unterstützt keine Standortfreigabe.");
      return;
    }

    setOriginLoading(true);
    setOriginError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        let label = "Aktueller Standort";
        try {
          const response = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
          if (response.ok) {
            const data = (await response.json()) as { label: string };
            if (data.label) label = data.label;
          }
        } catch {
          // reverse lookup is optional
        }
        const next = { lat, lon, label };
        setActiveOrigin(next);
        setOriginQuery(label);
        setOriginResults([]);
        setOriginLoading(false);
        persistOrigin(next);
      },
      (error) => {
        setOriginLoading(false);
        setOriginError(error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    setApiState((prev) => ({ ...prev, status: "loading", error: "" }));

    fetch("/api/travel/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        origin: activeOrigin
          ? {
              lat: activeOrigin.lat,
              lon: activeOrigin.lon,
              label: originLabel,
            }
          : null,
        destination: {
          lat: destinationLat,
          lon: destinationLon,
          label: destinationLabel,
        },
        travelMode,
        tripStartDate,
        tripEndDate,
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Travel-Providerstatus konnte nicht geladen werden.");
        return response.json();
      })
      .then((data: TravelConnectionApiResponse) => {
        if (controller.signal.aborted) return;
        setApiState({ status: "ready", data, error: "" });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setApiState({ status: "error", data: null, error: err.message });
      });

    return () => controller.abort();
  }, [
    destinationLabel,
    destinationLat,
    destinationLon,
    activeOrigin ? activeOrigin.lat : null,
    activeOrigin ? activeOrigin.lon : null,
    originLabel,
    travelMode,
    tripEndDate,
    tripStartDate,
  ]);

  useEffect(() => {
    const distanceMeters =
      routeState.data && typeof routeState.data.distanceMeters === "number"
        ? routeState.data.distanceMeters
        : typeof roadDistanceKm === "number"
          ? roadDistanceKm * 1000
          : null;

    if (!distanceMeters || distanceMeters <= 0) {
      setFuelState({ status: "idle", data: null, error: "" });
      return;
    }

    const controller = new AbortController();
    setFuelState({ status: "loading", data: null, error: "" });

    fetch("/api/travel/fuel-estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        distanceMeters,
        coordinates: routeState.data ? routeState.data.coordinates || [] : [],
        fuelType,
        consumptionLPer100Km,
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Spritkosten konnten nicht berechnet werden.");
        return response.json();
      })
      .then((data: FuelEstimate) => {
        if (controller.signal.aborted) return;
        setFuelState({ status: "ready", data, error: "" });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setFuelState({ status: "error", data: null, error: err.message });
      });

    return () => controller.abort();
  }, [consumptionLPer100Km, fuelType, roadDistanceKm, routeState.data]);

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/62 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_1.4fr]">
        <div className="border-b border-white/10 bg-white/[0.045] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-sky-200/20 bg-sky-200/10 text-sky-100">
              <RouteIcon />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Anreise</p>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-sm text-slate-300">
            <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Start</div>
              <div className="relative mt-2">
                <input
                  className="w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 pr-24 text-sm text-white placeholder:text-slate-500"
                  placeholder="Startort eingeben"
                  value={originQuery}
                  onChange={(event) => {
                    const next = event.target.value;
                    setOriginQuery(next);
                    if (activeOrigin && activeOrigin.label && next !== activeOrigin.label) setActiveOrigin(null);
                  }}
                />
                <button
                  className="absolute right-1.5 top-1.5 rounded-md border border-white/10 bg-white/[0.07] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/12"
                  type="button"
                  onClick={requestCurrentLocation}
                >
                  Standort
                </button>
                {originLoading ? <div className="mt-1 text-[11px] text-slate-400">Startort wird gesucht...</div> : null}
                {originResults.length > 0 ? (
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-white/10 bg-slate-950/96 shadow-[0_18px_45px_rgba(2,6,23,0.55)]">
                    {originResults.map((result) => (
                      <button
                        key={result.id}
                        className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                        type="button"
                        onClick={() => selectOrigin(result)}
                      >
                        <div className="font-medium text-white">{result.label}</div>
                        <div className="text-[11px] text-slate-500">{result.country}</div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {originError ? <div className="mt-1 text-[11px] text-red-300">{originError}</div> : null}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Ziel</div>
              <div className="mt-1 font-medium text-white">{destinationLabel}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Modus</div>
                <div className="mt-1 font-medium text-white">{modeLabel(travelMode)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Zeitraum</div>
                <div className="mt-1 font-medium text-white">{formatTripDates(tripStartDate, tripEndDate)}</div>
              </div>
            </div>
          </div>

          {canShowRoute ? (
            <div className="mt-4 rounded-lg border border-sky-200/15 bg-sky-200/[0.07] p-3 text-sm text-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-white">
                  {driveLabel || "Straßenroute verfügbar"}
                  {distanceLabel ? ` · ${distanceLabel}` : ""}
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                  onClick={() => setShowRoute((prev) => !prev)}
                >
                  {showRoute ? "Route schließen" : "Route anzeigen"}
                </button>
              </div>
              {routeState.status === "error" ? <div className="mt-2 text-[11px] text-red-200">{routeState.error}</div> : null}
              {effectiveRouteSource === "fallback" ? (
                <div className="mt-2 text-[11px] text-amber-100">Fahrzeit ist geschätzt, weil der Router keine exakte Route geliefert hat.</div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200/20 bg-amber-200/10 p-3 text-xs text-amber-50">
              Für genaue Straßenrouten und vorausgefüllte Verbindungen bitte einen Startort setzen.
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Verbindungen</p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {isPublicTransport ? "Bahn- und Busoptionen vorbereiten" : "Auto plus alternative Buchungswege"}
              </h3>
            </div>
            <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-slate-300">
              provider-neutral
            </span>
          </div>

          {!compact ? (
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Live-Verbindungen mit Dauer, Umstiegen und Preisen sind als nächste API-Stufe vorbereitet. Bis dahin öffnen die
              Buttons die jeweiligen Suchanbieter mit Start, Ziel und Reisedatum, soweit der Anbieter diese Parameter übernimmt.
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Günstigste Verbindung</div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {cheapestConnection && cheapestConnection.price != null
                      ? currency.format(cheapestConnection.price)
                      : isPublicTransport
                        ? "Provider-API fehlt"
                        : "Nicht für Auto relevant"}
                  </div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-300">
                  {tripStartDate ? formatTripDates(tripStartDate, tripEndDate) : "Datum offen"}
                </span>
              </div>
              {cheapestConnection ? (
                <div className="mt-3 text-sm text-slate-300">
                  <div className="font-medium text-white">{cheapestConnection.title}</div>
                  <div className="mt-1">
                    {formatConnectionTime(cheapestConnection.departureTime)} - {formatConnectionTime(cheapestConnection.arrivalTime)} ·{" "}
                    {formatDurationMinutes(cheapestConnection.durationMinutes)} ? {typeof cheapestConnection.changes === "number" ? cheapestConnection.changes : "-"} Umstiege
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Für echte Bahn-/Buspreise braucht Alpivo einen Omio-, Trainline- oder vergleichbaren Partnerzugang. Das Datum wird
                  bereits an die Suchlinks übergeben; echte Preislisten werden nicht geraten.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Auto-Spritkosten</div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {fuelState.status === "loading"
                      ? "wird berechnet..."
                      : fuelState.data
                        ? currency.format(fuelState.data.estimatedCost)
                        : "Startort setzen"}
                  </div>
                </div>
                <div className="flex overflow-hidden rounded-md border border-white/10 bg-slate-950/45">
                  {[
                    { value: "e10", label: "E10" },
                    { value: "e5", label: "E5" },
                    { value: "diesel", label: "Diesel" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`px-2.5 py-1 text-[11px] font-semibold transition ${
                        fuelType === option.value
                          ? "bg-sky-200 text-slate-950"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                      type="button"
                      onClick={() => setFuelType(option.value as FuelType)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span>Verbrauch</span>
                <input
                  className="w-24 rounded-md border border-white/10 bg-slate-950/55 px-2 py-1 text-xs text-white"
                  type="number"
                  min={3}
                  max={20}
                  step={0.1}
                  value={consumptionLPer100Km}
                  onChange={(event) => setConsumptionLPer100Km(Number(event.target.value))}
                />
                <span>l/100 km</span>
              </div>
              {fuelState.data ? (
                <div className="mt-3 text-xs leading-relaxed text-slate-400">
                  {fuelState.data.estimatedLiters} l · {currency.format(fuelState.data.averagePricePerLiter)}/l ·{" "}
                  {fuelState.data.source}
                  {fuelState.data.stationsSampled > 0 ? ` · ${fuelState.data.stationsSampled} Stationen` : ""}
                  <div className="mt-1">{fuelState.data.note}</div>
                </div>
              ) : fuelState.error ? (
                <div className="mt-3 text-xs text-red-300">{fuelState.error}</div>
              ) : (
                <div className="mt-3 text-xs leading-relaxed text-slate-400">
                  Sobald eine Route berechnet ist, wird die Spritkosten-Schätzung auf Basis der Routendistanz berechnet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {activeProviders.map((provider) => {
              const href = buildProviderUrl(provider, originLabel, destinationLabel, tripStartDate);
              const providerState = providerStateById.get(provider.id);
              const providerBadge = providerState && providerState.status === "ready" ? "API bereit" : "Suchlink";
              return (
                <a
                  key={provider.id}
                  className="group rounded-lg border border-white/10 bg-white/[0.055] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-sky-200/25 hover:bg-white/[0.085]"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">{provider.eyebrow}</div>
                      <div className="mt-1 text-base font-semibold text-white">{provider.label}</div>
                    </div>
                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-950/40 text-slate-200 transition group-hover:text-sky-100">
                      <ArrowIcon />
                    </span>
                  </div>
                  <p className="mt-3 min-h-[52px] text-xs leading-relaxed text-slate-300">{provider.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-sky-100">Verbindung öffnen</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-slate-300">
                      {providerBadge}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              {apiState.status === "loading"
                ? "Travel-Providerstatus wird geprüft..."
                : apiState.status === "error"
                  ? apiState.error
                  : (apiState.data && apiState.data.note ? apiState.data.note : "API-Slot: Live-Fahrplan, Dauer, Umstiege, Preis und Buchungslink können später pro Provider ergänzt werden.")}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              Partnerlink möglich, wenn ein Anbieter Provision zahlt. Der Nutzerpreis soll gleich bleiben; keine Bannerwerbung.
            </div>
          </div>
        </div>
      </div>

      {showRoute && canShowRoute ? (
        <div className="border-t border-white/10 p-4">
          <RoutePreview
            origin={{ lat: activeOrigin!.lat as number, lon: activeOrigin!.lon as number, label: originLabel || "Start" }}
            destination={{ lat: destinationLat as number, lon: destinationLon as number, label: resortName }}
            resortName={resortName}
          />
        </div>
      ) : null}
    </section>
  );
}
