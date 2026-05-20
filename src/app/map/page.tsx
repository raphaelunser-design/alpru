"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ScoreRing from "@/components/ScoreRing";
import AppShell from "@/components/premium/AppShell";
import ExternalActionLinks from "@/components/premium/ExternalActionLinks";
import MetricChip from "@/components/premium/MetricChip";
import { getResortActionLinks } from "@/data/resortActionLinks";
import { addTripDraftResort, isFavoriteSlug, setSelectedMapResort, toggleFavoriteSlug } from "@/lib/alpivoLocalState";
import { getAlpivoResortBySlug, getAlpivoTopMatches, type AlpivoResort } from "@/data/resorts";

type Layer = "terrain" | "pisten" | "anreise" | "wetter";

const layers: Array<{ id: Layer; label: string }> = [
  { id: "terrain", label: "Terrain" },
  { id: "pisten", label: "Pisten" },
  { id: "anreise", label: "Anreise" },
  { id: "wetter", label: "Wetter" },
];

const munich = { x: 15, y: 25 };

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SelectedResortPanel({
  resort,
  favorite,
  onFavorite,
  onTripDraft,
  compact = false,
}: {
  resort: AlpivoResort;
  favorite: boolean;
  onFavorite: () => void;
  onTripDraft: () => void;
  compact?: boolean;
}) {
  const actionLinks = getResortActionLinks(resort.slug);

  return (
    <aside className={`${compact ? "" : "h-full"} overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/86 text-white shadow-[0_34px_100px_rgba(2,6,23,0.48)] backdrop-blur-xl`}>
      <div className="relative h-56 overflow-hidden">
        <Image src={resort.image} alt={`${resort.name} Resort-Ansicht`} fill sizes="(min-width: 1280px) 380px, 92vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/8 via-slate-950/28 to-slate-950/92" />
        <div className="absolute left-5 top-5 rounded-full border border-emerald-200/24 bg-emerald-300/16 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-50">
          {resort.rank === 1 ? "Top Match" : `#${resort.rank} Match`}
        </div>
        <div className="absolute bottom-4 left-5 right-28">
          <h2 className="text-4xl font-black leading-none">{resort.name}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-200">{resort.regionLabel}</p>
        </div>
        <div className="absolute bottom-4 right-4">
          <ScoreRing value={resort.score} size="sm" label="Match" />
        </div>
      </div>

      <div className="space-y-5 p-5">
        <p className="text-sm leading-6 text-slate-300">{resort.description}</p>

        <div className="grid grid-cols-2 gap-3">
          <MetricChip icon="cost" value={resort.priceLabel} label="pro Person" variant="glass" />
          <MetricChip icon="time" value={resort.travelTimeFromMunich} label="ab München" variant="glass" />
          <MetricChip icon="snow" value={resort.snowLabel} label="Schneesicherheit" variant="glass" />
          <MetricChip icon="vibe" value={resort.vibeLabel} label="Vibe & Events" variant="glass" />
          <MetricChip icon="piste" value={resort.pisteKm} label="Pistenkilometer" variant="glass" />
          <MetricChip icon="height" value={resort.altitude} label="Höhenlage" variant="glass" />
        </div>

        <div className="rounded-3xl border border-emerald-200/16 bg-emerald-300/[0.075] p-4">
          <h3 className="font-black text-emerald-50">3 Gründe, warum es passt</h3>
          <ul className="mt-3 space-y-2">
            {resort.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm leading-6 text-emerald-50/90">
                <span className="mt-1 text-emerald-300">
                  <CheckIcon />
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-amber-200/22 bg-amber-300/[0.08] p-4">
          <h3 className="font-black text-amber-100">Ein möglicher Nachteil</h3>
          <p className="mt-2 text-sm leading-6 text-amber-50/88">{resort.drawback}</p>
        </div>

        <div className="grid gap-3">
          <Link
            href={`/resort/${encodeURIComponent(resort.slug)}`}
            className="button-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
          >
            Details ansehen
            <ArrowIcon />
          </Link>
          <button type="button" onClick={onTripDraft} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10">
            Zum Trip hinzufügen
          </button>
          <button type="button" onClick={onFavorite} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-200/20 bg-sky-300/[0.08] px-5 text-sm font-extrabold text-sky-50 hover:bg-sky-300/[0.13]">
            {favorite ? "Favorit entfernen" : "Favorit speichern"}
          </button>
        </div>

        <ExternalActionLinks
          links={actionLinks}
          limit={3}
          title="Offiziell prüfen"
          subtitle="Live-Status, Tickets und Details direkt bei der offiziellen Quelle öffnen."
        />
      </div>
    </aside>
  );
}

export default function MapPage() {
  const resorts = useMemo(() => getAlpivoTopMatches(), []);
  const [selectedSlug, setSelectedSlug] = useState("obertauern");
  const [activeLayer, setActiveLayer] = useState<Layer>("terrain");
  const [search, setSearch] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState("");

  const selected = (getAlpivoResortBySlug(selectedSlug) ?? resorts[0]) as AlpivoResort;
  const filteredResorts = resorts.filter((resort) => `${resort.name} ${resort.regionLabel}`.toLowerCase().includes(search.trim().toLowerCase()));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = getAlpivoResortBySlug(params.get("resort"));
    if (fromQuery) {
      setSelectedSlug(fromQuery.slug);
      setSelectedMapResort(fromQuery.slug);
    }
  }, []);

  useEffect(() => {
    setFavorite(isFavoriteSlug(selected.slug));
  }, [selected.slug]);

  const selectResort = (slug: string) => {
    setSelectedSlug(slug);
    setSelectedMapResort(slug);
    setMessage("");
  };

  const handleFavorite = () => {
    const isNowFavorite = toggleFavoriteSlug(selected.slug);
    setFavorite(isNowFavorite);
    setMessage(isNowFavorite ? `${selected.name} ist als Favorit gespeichert.` : `${selected.name} wurde aus Favoriten entfernt.`);
  };

  const handleTripDraft = () => {
    addTripDraftResort(selected.slug);
    setMessage(`${selected.name} wurde deinem lokalen Trip-Entwurf hinzugefügt. Als Gast bleibt er auf diesem Gerät gespeichert.`);
  };

  const routePath = `M ${munich.x} ${munich.y} C 25 ${Math.max(16, selected.mapPosition.y - 24)}, 41 ${selected.mapPosition.y + 8}, ${selected.mapPosition.x} ${selected.mapPosition.y}`;

  return (
    <AppShell className="bg-[#010713]">
      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_42%_18%,rgba(14,165,233,0.2),transparent_34%),linear-gradient(135deg,#020817,#001426_58%,#020817)] text-white">
        <div className="grid min-h-screen gap-0 xl:grid-cols-[minmax(0,1fr)_430px]">
          <section className="relative min-h-[760px] overflow-hidden border-white/10 xl:border-r">
            <Image
              src="/bg/banner-bild-4k.png"
              alt="Dunkle alpine Terrain-Kartenfläche"
              fill
              priority
              sizes="(min-width: 1280px) 70vw, 100vw"
              className="object-cover opacity-70 saturate-[0.82]"
              style={{ objectPosition: "center" }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_46%,rgba(16,185,129,0.22),transparent_12%),radial-gradient(circle_at_15%_23%,rgba(14,165,233,0.2),transparent_10%),linear-gradient(180deg,rgba(1,7,19,0.3),rgba(1,7,19,0.8))]" />
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(186,230,253,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(186,230,253,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(1,7,19,0.65)_92%)]" />

            <div className="relative z-10 flex flex-col gap-4 p-4 md:p-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex min-h-14 max-w-xl flex-1 items-center gap-3 rounded-2xl border border-white/12 bg-slate-950/70 px-4 text-slate-300 shadow-[0_18px_60px_rgba(2,6,23,0.36)] backdrop-blur-xl">
                  <SearchIcon />
                  <span className="sr-only">Resort suchen</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Resort, Region oder Berg suchen..."
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-400"
                  />
                </label>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-white/12 bg-slate-950/70 p-1.5 backdrop-blur-xl">
                  {layers.map((layer) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActiveLayer(layer.id)}
                      className={`min-h-11 rounded-xl px-4 text-sm font-extrabold transition ${
                        activeLayer === layer.id ? "bg-sky-500 text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)]" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
              </div>

              {search ? (
                <div className="max-w-xl rounded-2xl border border-white/12 bg-slate-950/78 p-2 shadow-[0_20px_70px_rgba(2,6,23,0.42)] backdrop-blur-xl">
                  {filteredResorts.length > 0 ? (
                    filteredResorts.map((resort) => (
                      <button
                        key={resort.slug}
                        type="button"
                        onClick={() => selectResort(resort.slug)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-white hover:bg-white/10"
                      >
                        <span>{resort.name}</span>
                        <span className="text-xs text-slate-400">{resort.regionLabel}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-sm text-slate-300">Kein Pilot-Resort gefunden.</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="absolute inset-x-4 top-[150px] bottom-[185px] z-10 md:inset-x-8 md:top-[136px] md:bottom-[170px]">
              <div className="relative h-full min-h-[430px] overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-950/12 shadow-[inset_0_0_90px_rgba(2,6,23,0.35)]">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <filter id="map-glow">
                      <feGaussianBlur stdDeviation="1.35" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="route-gradient" x1="0" x2="1" y1="0" y2="1">
                      <stop stopColor="#7DD3FC" />
                      <stop offset="0.55" stopColor="#38BDF8" />
                      <stop offset="1" stopColor="#86EFAC" />
                    </linearGradient>
                  </defs>
                  <path d="M 14 27 C 28 20, 42 23, 58 18 C 72 15, 84 18, 93 10" stroke="rgba(226,232,240,0.42)" strokeWidth="0.36" strokeDasharray="2 2" fill="none" />
                  <path d="M 20 70 C 34 62, 48 74, 61 61 C 72 50, 80 55, 90 48" stroke="rgba(226,232,240,0.24)" strokeWidth="0.3" strokeDasharray="1.2 1.8" fill="none" />
                  <path d={routePath} stroke="rgba(56,189,248,0.2)" strokeWidth="2.8" fill="none" strokeLinecap="round" filter="url(#map-glow)" />
                  <path d={routePath} stroke="url(#route-gradient)" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeDasharray="2 1.35" />
                </svg>

                <div className="absolute" style={{ left: `${munich.x}%`, top: `${munich.y}%`, transform: "translate(-50%, -50%)" }}>
                  <div className="flex items-center gap-2 rounded-2xl border border-sky-200/24 bg-slate-950/82 px-3 py-2 text-sm font-black shadow-[0_0_36px_rgba(14,165,233,0.32)]">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500">●</span>
                    München
                  </div>
                </div>

                {resorts.map((resort) => {
                  const active = resort.slug === selected.slug;
                  return (
                    <button
                      key={resort.slug}
                      type="button"
                      onClick={() => selectResort(resort.slug)}
                      className={`absolute flex items-center gap-2 rounded-2xl border px-3 py-2 text-left shadow-[0_18px_54px_rgba(2,6,23,0.36)] transition hover:-translate-y-1 ${
                        active ? "border-emerald-200/40 bg-slate-950/90 text-white" : "border-sky-200/18 bg-slate-950/78 text-slate-100"
                      }`}
                      style={{ left: `${resort.mapPosition.x}%`, top: `${resort.mapPosition.y}%`, transform: "translate(-50%, -50%)" }}
                      aria-label={`${resort.name} auswählen`}
                    >
                      <span className={`grid h-12 w-12 place-items-center rounded-full text-lg font-black ${active ? "bg-emerald-300 text-emerald-950 shadow-[0_0_34px_rgba(110,231,183,0.58)]" : "bg-sky-500 text-white"}`}>
                        {resort.score}
                      </span>
                      <span className="hidden sm:block">
                        <span className="block text-base font-black">{resort.name}</span>
                        <span className="block text-xs text-slate-300">{resort.altitude.split(" - ")[0]}</span>
                      </span>
                    </button>
                  );
                })}

                <div className="absolute bottom-5 left-5 hidden rounded-2xl border border-white/12 bg-slate-950/78 p-4 text-xs text-slate-300 backdrop-blur-xl md:block">
                  <div className="grid gap-2">
                    <span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-300" />Top Match</span>
                    <span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-sky-400" />Sehr gute Matches</span>
                    <span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-orange-300" />Pisten-Layer</span>
                    <span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-white/60" />Grenzen & Höhenlinien</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-4 z-20 md:inset-x-8">
              <div className="rounded-[2rem] border border-white/12 bg-slate-950/86 p-4 shadow-[0_26px_90px_rgba(2,6,23,0.52)] backdrop-blur-xl md:p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_1fr_1fr] md:items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-400">Start</div>
                    <div className="mt-1 text-xl font-black">München</div>
                    <div className="text-sm text-slate-300">Deutschland</div>
                  </div>
                  <div className="hidden text-3xl text-sky-200 md:block">→</div>
                  <div>
                    <div className="text-xs font-bold text-slate-400">Ziel</div>
                    <div className="mt-1 text-xl font-black">{selected.name}</div>
                    <div className="text-sm text-slate-300">{selected.regionLabel}</div>
                  </div>
                  <MetricChip icon="route" value={selected.routeSummary.distance} label="Strecke" variant="glass" />
                  <MetricChip icon="time" value={selected.routeSummary.duration} label={`${selected.routeSummary.fuelCost} Sprit`} variant="glass" />
                </div>
                <p className="mt-4 rounded-2xl border border-amber-200/18 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-50/88">{selected.routeSummary.note}</p>
                {message ? <p className="mt-3 rounded-2xl border border-emerald-200/18 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-50">{message}</p> : null}
              </div>
            </div>
          </section>

          <div className="hidden p-5 xl:block">
            <SelectedResortPanel resort={selected} favorite={favorite} onFavorite={handleFavorite} onTripDraft={handleTripDraft} />
          </div>

          <div className="relative z-30 px-4 pb-28 xl:hidden">
            <SelectedResortPanel resort={selected} favorite={favorite} onFavorite={handleFavorite} onTripDraft={handleTripDraft} compact />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
