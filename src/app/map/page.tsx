"use client";

import "leaflet/dist/leaflet.css";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { getMvpResorts } from "@/lib/mvpResorts";
import type { ResortLoadResult } from "@/lib/resortRepository";
import type { ResortSignalRow } from "@/lib/resortSignals";

type Resort = Pick<
  ResortSignalRow,
  "id" | "slug" | "name" | "country" | "region" | "lat" | "lon" | "piste_km" | "piste_km_total" | "skipass_price_from"
>;

type PopupLayer = import("leaflet").Layer & { openPopup: () => void };

const DEFAULT_CENTER: [number, number] = [47.4, 11.2];
const DEFAULT_ZOOM = 5;
const number = new Intl.NumberFormat("de-DE");

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/[0.05]" />
      ))}
    </div>
  );
}

export default function MapPage() {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [totalResorts, setTotalResorts] = useState(0);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeResortId, setActiveResortId] = useState<string | null>(null);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const markerIndexRef = useRef<Map<string, import("leaflet").Layer>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapElementRef.current || mapRef.current) return;

      const leafletModule = await import("leaflet");
      const L = (leafletModule as unknown as { default?: typeof import("leaflet") }).default ?? leafletModule;
      if (!isMounted || !mapElementRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapElementRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      markerLayerRef.current = L.layerGroup().addTo(map);
    };

    initMap();

    return () => {
      isMounted = false;
      markerLayerRef.current?.clearLayers();
      markerLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    async function loadResorts() {
      setLoading(true);
      setError("");
      setUsingFallback(false);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 7000);

      try {
        const response = await fetch("/api/resorts", { cache: "no-store", signal: controller.signal });
        const result = (await response.json().catch(() => null)) as ResortLoadResult<ResortSignalRow> | null;
        if (!response.ok || !result) throw new Error(result?.error || "Resorts konnten nicht geladen werden");

        const cleaned = result.resorts.map((row): Resort => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          country: row.country,
          region: row.region ?? null,
          lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
          lon: row.lon === null || row.lon === undefined ? null : Number(row.lon),
          piste_km: row.piste_km === null || row.piste_km === undefined ? row.piste_km_total ?? null : Number(row.piste_km),
          piste_km_total: row.piste_km_total ?? null,
          skipass_price_from: row.skipass_price_from ?? null,
        }));

        setResorts(cleaned);
        setTotalResorts(result.total);
        setUsingFallback(result.usingFallback);
        setError(result.error ?? "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Resorts konnten nicht geladen werden");
        const fallback = getMvpResorts() as Resort[];
        setResorts(fallback);
        setTotalResorts(fallback.length);
        setUsingFallback(true);
      } finally {
        window.clearTimeout(timeout);
        setLoading(false);
      }
    }

    loadResorts();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return resorts;
    return resorts.filter((r) => {
      const haystack = `${r.name} ${r.country} ${r.region ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, resorts]);

  const mappableCount = useMemo(
    () => filtered.filter((resort) => Number.isFinite(resort.lat) && Number.isFinite(resort.lon)).length,
    [filtered]
  );
  const filteredOutCount = Math.max(0, resorts.length - filtered.length);
  const filteredOutReason = query.trim() ? "Suchbegriff" : "";
  const totalLabel = number.format(totalResorts || resorts.length);

  useEffect(() => {
    const layer = markerLayerRef.current;
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!layer || !map || !L) return;

    layer.clearLayers();
    markerIndexRef.current.clear();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    filtered.forEach((resort, index) => {
      if (!Number.isFinite(resort.lat) || !Number.isFinite(resort.lon)) return;

      const marker = L.circleMarker([resort.lat as number, resort.lon as number], {
        radius: 0,
        color: "#0f172a",
        weight: 1,
        fillColor: "#38bdf8",
        fillOpacity: 0.8,
      });

      const region = resort.region ? `, ${escapeHtml(resort.region)}` : "";
      const piste = resort.piste_km ? `<br/>${resort.piste_km} km Pisten` : "";
      const price = resort.skipass_price_from ? `<br/>Skipass grob ab ${resort.skipass_price_from} EUR` : "";
      const detailTarget = encodeURIComponent(resort.slug || resort.id);
      const popupHtml = `<strong>${escapeHtml(resort.name)}</strong><br/>${escapeHtml(
        resort.country
      )}${region}${piste}${price}<br/><a href=\"/resort/${detailTarget}\">Details ansehen</a>`;

      marker.bindPopup(popupHtml);
      marker.on("click", () => setActiveResortId(resort.id));
      marker.addTo(layer);
      markerIndexRef.current.set(resort.id, marker);

      if (reduceMotion) {
        marker.setStyle({ radius: 5 });
      } else {
        window.setTimeout(() => {
          marker.setStyle({ radius: 5 });
        }, 40 + index * 4);
      }
    });
  }, [filtered]);

  const focusResort = (resort: Resort) => {
    if (!Number.isFinite(resort.lat) || !Number.isFinite(resort.lon)) return;
    const map = mapRef.current;
    if (!map) return;

    setActiveResortId(resort.id);
    map.setView([resort.lat as number, resort.lon as number], 10, { animate: true });

    const marker = markerIndexRef.current.get(resort.id) as PopupLayer | undefined;
    marker?.openPopup();
  };

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[280px]" imagePosition="center 52%">
        <div className="mx-auto flex min-h-[250px] w-full max-w-6xl items-end px-4 pb-10 pt-12 md:px-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Map</p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Alpenkarte</h1>
            <p className="mt-3 max-w-[31ch] text-sm leading-6 text-white/78 sm:max-w-2xl">
              Alle Alpen-Resorts auf einer Karte. Suche nach Name oder Region.
            </p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="pt-0">
        <GlassCard className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 basis-64">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Resort Übersicht</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Karte und Liste</h2>
              <p className="mt-2 max-w-[32ch] text-sm leading-6 text-slate-300">
                Marker antippen, Treffer direkt darunter sehen.
              </p>
            </div>
            <div className="nav-scroll flex w-full items-center gap-2 overflow-x-auto text-sm text-slate-300 sm:w-auto sm:flex-wrap sm:overflow-visible">
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                {loading ? "Resorts laden" : `${number.format(filtered.length)} von ${totalLabel} Resorts`}
              </span>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                {number.format(mappableCount)} auf Karte
              </span>
              {usingFallback ? (
                <span className="shrink-0 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-amber-100">
                  Fallback-Daten
                </span>
              ) : null}
              <Link
                className="shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition hover:border-sky-200/25 hover:bg-white/[0.09]"
                href="/resorts"
              >
                Resorts
              </Link>
            </div>
          </div>

          <div className="mt-6 grid min-h-0 gap-4 xl:h-[min(680px,calc(100vh-230px))] xl:min-h-[520px] xl:grid-cols-[1.65fr_0.95fr]">
            <div className="h-[430px] overflow-hidden rounded-lg border border-white/10 bg-slate-950/45 shadow-[0_18px_44px_rgba(2,6,23,0.34)] xl:h-full">
              <div ref={mapElementRef} className="h-full w-full" />
            </div>

            <div className="flex h-[430px] min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950/38 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.28)] xl:h-full">
              <label className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Resortsuche</span>
                    <div className="mt-1 text-sm text-slate-300">Name, Land oder Region</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">
                    {loading ? "Laden" : `${number.format(filtered.length)} Treffer`}
                  </div>
                </div>
                {!loading && filteredOutCount > 0 ? (
                  <div className="mt-2 text-xs text-slate-500">
                    {number.format(filteredOutCount)} Resorts ausgefiltert durch {filteredOutReason || "aktive Filter"}.
                  </div>
                ) : null}
                <input
                  className="mt-4 w-full rounded-lg border border-white/10 bg-slate-950/75 px-4 py-3 text-sm font-medium text-white caret-sky-200 outline-none transition placeholder:text-slate-500 focus:border-sky-200/35 focus:ring-4 focus:ring-sky-200/10"
                  placeholder="Resort, Land oder Region suchen"
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              {error ? (
                <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Live-Daten konnten nicht zuverlässig geladen werden. Die Karte nutzt kuratierte Demo-Resorts. Technischer Hinweis: {error}
                </div>
              ) : null}
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {loading ? (
                  <SidebarSkeleton />
                ) : (
                  filtered.map((resort) => (
                    <button
                      key={resort.id}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                        activeResortId === resort.id
                          ? "border-sky-200/35 bg-sky-200/10 shadow-[0_16px_34px_rgba(56,189,248,0.12)]"
                          : "border-white/10 bg-white/[0.05] hover:border-white/20 hover:bg-white/[0.08]"
                      }`}
                      onClick={() => focusResort(resort)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-white">{resort.name}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-400">
                            {resort.country}
                            {resort.region ? `, ${resort.region}` : ""}
                          </div>
                        </div>
                        {resort.piste_km ? (
                          <span className="shrink-0 rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[11px] text-slate-300">
                            {resort.piste_km} km
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
                {!loading && filtered.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">Keine Resorts gefunden</div>
                    <p className="mt-1 leading-6">Deine Suche passt aktuell zu keinem Resort auf der Karte.</p>
                    <button
                      type="button"
                      className="mt-3 rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
                      onClick={() => setQuery("")}
                    >
                      Filter zurücksetzen
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </GlassCard>
      </Section>
    </div>
  );
}

