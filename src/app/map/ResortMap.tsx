"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map } from "leaflet";
import { AppHeader, Button, Card } from "@/components/ui";
import TravelConnectionPanel from "@/components/TravelConnectionPanel";
import { useAlpivoGuestState } from "@/hooks/useAlpivoGuestState";

type Location = {
  slug: string;
  name: string;
  region: string | null;
  country: string;
  lat: number;
  lon: number;
};

export default function ResortMap({ locations, initialSlug, usingFallback }: {
  locations: Location[];
  initialSlug?: string;
  usingFallback: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const layers = useRef<{ map: Map; markers: LayerGroup; leaflet: typeof import("leaflet") } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [savedSlug, setSavedSlug] = useState("");
  const { state, hydrated, addTripDraftResort } = useAlpivoGuestState();

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("de");
    return locations.filter((resort) =>
      [resort.name, resort.region, resort.country].some((value) => value?.toLocaleLowerCase("de").includes(search)));
  }, [locations, query]);
  const selected = locations.find((resort) => resort.slug === selectedSlug);
  const selectedLat = selected?.lat;
  const selectedLon = selected?.lon;

  useEffect(() => {
    let active = true;
    import("leaflet").then((leaflet) => {
      if (!active || !element.current) return;
      const map = leaflet.map(element.current, { center: [46.9, 10.2], zoom: 6, scrollWheelZoom: false });
      leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      layers.current = { map, markers: leaflet.layerGroup().addTo(map), leaflet };
      setMapReady(true);
    }).catch(() => { if (active) setMapError(true); });
    return () => {
      active = false;
      layers.current?.map.remove();
      layers.current = null;
    };
  }, []);

  useEffect(() => {
    const group = layers.current;
    if (!mapReady || !group) return;
    group.markers.clearLayers();
    for (const resort of filtered) {
      const active = resort.slug === selectedSlug;
      const label = document.createElement("span");
      label.textContent = resort.name;
      group.leaflet.circleMarker([resort.lat, resort.lon], {
        radius: active ? 9 : 5,
        color: active ? "#102647" : "#2355bf",
        fillColor: active ? "#102647" : "#3779ed",
        fillOpacity: 0.85,
        weight: 2,
      }).bindTooltip(label).on("click", () => setSelectedSlug(resort.slug)).addTo(group.markers);
    }
  }, [filtered, mapReady, selectedSlug]);

  useEffect(() => {
    if (mapReady && selectedLat != null && selectedLon != null) {
      layers.current?.map.setView([selectedLat, selectedLon], 10, { animate: false });
    }
  }, [mapReady, selectedLat, selectedLon, selectedSlug]);

  return (
    <div className="alpivo-ui-root min-h-screen bg-[var(--alpivo-snow-white)] text-[var(--alpivo-deep-navy)]">
      <AppHeader />
      <div className="mx-auto grid max-w-[1480px] gap-5 px-4 py-6 md:px-8">
        <header>
          <h1 className="alpivo-ui-heading text-3xl md:text-5xl">Skigebiete auf der Karte</h1>
          <p className="mt-2 text-sm">Wähle ein Gebiet auf der Karte oder über die Suche.</p>
        </header>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div ref={element} aria-label="Interaktive Karte der Skigebiete" className="isolate z-0 h-[340px] rounded-2xl border border-slate-200 bg-slate-100 md:h-[540px]" />
            {mapError && <p role="status" className="mt-2">Die Karte konnte nicht geladen werden. Die Listensuche ist weiterhin verfügbar.</p>}
          </div>
          <Card className="p-4">
            <label htmlFor="map-search" className="text-sm font-semibold">Skigebiet, Region oder Land suchen</label>
            <input id="map-search" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm" />
            <p className="mt-2 text-xs text-slate-600">{filtered.length} Skigebiete{usingFallback ? " · Beispielkatalog" : ""}</p>
            {filtered.length > 0 ? (
              <ul aria-label="Erste Suchtreffer" className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {filtered.slice(0, 12).map((resort) => (
                  <li key={resort.slug}>
                    <button type="button" aria-pressed={resort.slug === selectedSlug} onClick={() => setSelectedSlug(resort.slug)} className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 aria-pressed:bg-blue-50">
                      <span className="block font-semibold">{resort.name}</span>
                      <span className="text-xs text-slate-600">{[resort.region, resort.country].filter(Boolean).join(", ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm">Keine Skigebiete gefunden.</p>}
            {selected && (
              <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <Button href={`/resort/${encodeURIComponent(selected.slug)}`} className="w-full">Resortdetails ansehen</Button>
                <Button variant="secondary" className="w-full" onClick={() => {
                  addTripDraftResort(selected.slug, undefined, selected.name);
                  setSavedSlug(selected.slug);
                }}>Für Trip vormerken</Button>
                {savedSlug === selected.slug && <Link href="/trips#trip-entwurf" className="block text-sm font-semibold underline">Vorgemerkt · Trip-Entwurf öffnen</Link>}
              </div>
            )}
          </Card>
        </div>
        {selected && hydrated && (
          <TravelConnectionPanel
            key={selected.slug}
            title={`Anreise nach ${selected.name}`}
            resortName={selected.name}
            country={selected.country}
            region={selected.region}
            destinationLat={selected.lat}
            destinationLon={selected.lon}
            origin={null}
            initialOriginQuery={state.preferences.originLabel}
            travelMode={state.preferences.travelMode}
            tripStartDate={state.preferences.tripStartDate}
            tripEndDate={state.preferences.tripEndDate}
            roadDurationHours={null}
            roadDistanceKm={null}
            routeSource={null}
          />
        )}
      </div>
    </div>
  );
}
