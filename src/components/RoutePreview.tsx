"use client";

import { useEffect, useRef, useState } from "react";

type Coordinate = {
  lat: number;
  lon: number;
  label: string;
};

type RouteResponse = {
  durationSeconds: number | null;
  distanceMeters: number | null;
  source: "osrm" | "fallback";
  coordinates: Array<[number, number]>;
};

type RoutePreviewProps = {
  origin: Coordinate;
  destination: Coordinate;
  resortName: string;
};

const number = new Intl.NumberFormat("de-DE");

function formatDuration(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return "-";
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function formatDistance(meters: number | null | undefined) {
  if (typeof meters !== "number" || Number.isNaN(meters)) return "-";
  return `${number.format(Math.round(meters / 1000))} km`;
}

export default function RoutePreview({ origin, destination, resortName }: RoutePreviewProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (!mapElementRef.current || mapRef.current) return;
      const leafletModule = await import("leaflet");
      const L = (leafletModule as unknown as { default: typeof import("leaflet") }).default ?? leafletModule;
      if (!mounted || !mapElementRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapElementRef.current, {
        center: [destination.lat, destination.lon],
        zoom: 8,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors, OSRM",
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
    };

    initMap();

    return () => {
      mounted = false;
      if (layerRef.current) layerRef.current.clearLayers();
      layerRef.current = null;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, [destination.lat, destination.lon]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch("/api/route", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ origin, destination }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Route konnte nicht berechnet werden.");
        return response.json();
      })
      .then((data: RouteResponse) => {
        setRoute(data);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [destination.lat, destination.lon, origin.lat, origin.lon]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer || !route || !route.coordinates.length) return;

    layer.clearLayers();
    const fallbackCoordinates: Array<[number, number]> = [
      [origin.lat, origin.lon],
      [destination.lat, destination.lon],
    ];
    const coordinates: Array<[number, number]> = route.coordinates.length >= 2 ? route.coordinates : fallbackCoordinates;
    const bounds = L.latLngBounds(coordinates);

    L.polyline(coordinates, {
      color: "#38bdf8",
      weight: 5,
      opacity: 0.92,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(layer);

    L.circleMarker([origin.lat, origin.lon], {
      radius: 6,
      color: "#e0f2fe",
      weight: 2,
      fillColor: "#0f172a",
      fillOpacity: 1,
    })
      .bindPopup(origin.label || "Start")
      .addTo(layer);

    L.circleMarker([destination.lat, destination.lon], {
      radius: 7,
      color: "#0f172a",
      weight: 2,
      fillColor: "#38bdf8",
      fillOpacity: 1,
    })
      .bindPopup(resortName)
      .addTo(layer);

    map.fitBounds(bounds.pad(0.18), { animate: false });
  }, [destination.lat, destination.lon, origin.lat, origin.lon, origin.label, resortName, route]);

  return (
    <div className="overflow-hidden rounded-lg border border-sky-200/15 bg-slate-950/75">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 text-xs text-slate-300">
        <div>
          <span className="text-slate-400">Route</span>{" "}
          <span className="font-medium text-white">{origin.label || "Start"} → {resortName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1">
            {loading ? "berechnet..." : formatDuration(route?.durationSeconds)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1">
            {loading ? "Route l?dt" : formatDistance(route?.distanceMeters)}
          </span>
          {route?.source === "fallback" ? (
            <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-2.5 py-1 text-amber-100">
              geschätzt
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative h-[260px]">
        <div ref={mapElementRef} className="h-full w-full" />
        {loading ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/45 text-sm text-slate-200 backdrop-blur-sm">
            Straßenroute wird berechnet...
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-x-4 bottom-4 rounded-lg border border-red-300/25 bg-red-950/80 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
