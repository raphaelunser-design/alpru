"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import ResortDecisionCard from "@/components/ResortDecisionCard";
import Section from "@/components/Section";
import SelectControl from "@/components/SelectControl";
import { getMvpResorts } from "@/lib/mvpResorts";
import type { ResortLoadResult } from "@/lib/resortRepository";
import { deriveResortDecision, type MatchPreferences, type ResortSignalRow } from "@/lib/resortSignals";
import { useSiteContent } from "@/lib/useSiteContent";

type Resort = ResortSignalRow;

const FILTER_STORAGE_KEY = "alpivo_resorts_filters";
const PAGE_SIZE = 60;

const styleOptions = [
  { value: "all", label: "Alle" },
  { value: "budget", label: "Preis-Leistung" },
  { value: "premium", label: "Premium" },
  { value: "apres", label: "Après-Ski" },
  { value: "festival", label: "Events" },
  { value: "quiet", label: "Ruhig" },
  { value: "snow", label: "Schneesicher" },
  { value: "glacier", label: "Gletscher" },
];

const viewOptions = [
  { label: "Empfohlen", href: "/resorts", active: true },
  { label: "Karte", href: "/map", active: false },
  { label: "Vergleichen", href: "/trips/demo-trip-crew/compare", active: false },
];

const libraryPrefs: MatchPreferences = {
  tripStyle: "balanced",
  tripStartDate: null,
  tripEndDate: null,
  budgetMin: 0,
  budgetMax: 450,
  budget: 450,
  peopleCount: 2,
  apres: 3,
  emptySlopes: 3,
  infrastructure: 4,
  huts: 3,
  snowpark: 1,
  easyRuns: 3,
  challenging: 3,
  snowReliability: 3,
  valueForMoney: 3,
  family: 0,
  panorama: 3,
  summerGlacier: 0,
  offPiste: 0,
  partyPreference: "indifferent",
  musicPreference: "any",
  foodSpendLevel: "standard",
  needRental: false,
  rentalMode: "own",
  travelMode: "car",
  excludeCountries: [],
  excludeGlacier: false,
  excludePremium: false,
  excludeFamilyOnly: false,
};

const number = new Intl.NumberFormat("de-DE");

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950/58 shadow-[0_22px_70px_rgba(2,6,23,0.26)]">
      <div className="h-[230px] animate-pulse bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-24 animate-pulse rounded-2xl bg-white/10" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 animate-pulse rounded-xl bg-white/10" />
          <div className="h-14 animate-pulse rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function ResortsPage() {
  const reduceMotion = useReducedMotion();
  const { value: heroContent } = useSiteContent("resorts", {
    title: "Resorts, die wirklich zu deinem Trip passen",
    subtitle: "Vergleiche Skiorte nach Schnee, Terrain, Anreise, Budget und Vibe.",
    heroImage: "/bg/banner-bild-4k.png",
  });
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [totalResorts, setTotalResorts] = useState(0);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { query: string; countryFilter: string; styleFilter: string };
      if (saved.query) setQuery(saved.query);
      if (saved.countryFilter) setCountryFilter(saved.countryFilter);
      if (saved.styleFilter) setStyleFilter(saved.styleFilter);
    } catch {
      // ignore invalid storage
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      setUsingFallback(false);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 7000);

      try {
        const response = await fetch("/api/resorts", { cache: "no-store", signal: controller.signal });
        const result = (await response.json().catch(() => null)) as ResortLoadResult<Resort> | null;
        if (!response.ok || !result) throw new Error(result?.error || "Resorts konnten nicht geladen werden.");

        setResorts(result.resorts);
        setTotalResorts(result.total);
        setUsingFallback(result.usingFallback);
        setError(result.error ?? "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Resorts konnten nicht geladen werden.");
        const fallback = getMvpResorts() as Resort[];
        setResorts(fallback);
        setTotalResorts(fallback.length);
        setUsingFallback(true);
      } finally {
        window.clearTimeout(timeout);
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({
        query,
        countryFilter,
        styleFilter,
      })
    );
  }, [query, countryFilter, styleFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, countryFilter, styleFilter]);

  const countries = useMemo(() => {
    const unique = new Set<string>();
    resorts.forEach((resort) => {
      if (resort.country) unique.add(resort.country);
    });
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b, "de-DE"))];
  }, [resorts]);

  const decisions = useMemo(
    () =>
      resorts
        .map((resort) => deriveResortDecision(resort, libraryPrefs))
        .sort((a, b) => b.matchPct - a.matchPct || a.name.localeCompare(b.name, "de-DE")),
    [resorts]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return decisions.filter((resort) => {
      if (countryFilter !== "all" && resort.country !== countryFilter) return false;
      if (styleFilter === "budget" && resort.budgetClass !== "budget") return false;
      if (styleFilter === "premium" && resort.budgetClass !== "premium") return false;
      if (styleFilter === "apres" && (resort.apresScore ?? 0) < 0.65) return false;
      if (styleFilter === "festival" && !((resort.eventBadges?.length ?? 0) > 0 || (resort.festivalFitScore ?? 0) >= 0.66)) return false;
      if (styleFilter === "quiet" && (resort.crowdScore == null || 1 - resort.crowdScore < 0.6)) return false;
      if (styleFilter === "snow" && resort.snowReliability < 0.62) return false;
      if (styleFilter === "glacier" && resort.summerGlacierScore < 0.58) return false;
      if (!needle) return true;

      const haystack = `${resort.name} ${resort.country} ${resort.region ?? ""} ${resort.vibeTags
        .map((tag) => tag.label)
        .join(" ")} ${(resort.eventBadges ?? []).join(" ")} ${(resort.events ?? []).map((event) => event.name).join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [decisions, query, countryFilter, styleFilter]);

  const visibleResorts = filtered.slice(0, visibleCount);
  const selectedStyle = styleOptions.find((option) => option.value === styleFilter)?.label ?? "Alle";
  const activeFilterChips = [
    countryFilter === "all" ? null : { key: "country", label: countryFilter },
    styleFilter === "all" ? null : { key: "style", label: selectedStyle },
    query.trim() ? { key: "query", label: query.trim() } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));
  const filteredOutCount = Math.max(0, decisions.length - filtered.length);
  const filteredOutReasons = [
    countryFilter === "all" ? null : "Landfilter",
    styleFilter === "all" ? null : "Stilfilter",
    query.trim() ? "Suchbegriff" : null,
  ]
    .filter(Boolean)
    .join(", ");
  const totalLabel = number.format(totalResorts || resorts.length);
  const resetFilters = () => {
    setQuery("");
    setCountryFilter("all");
    setStyleFilter("all");
  };

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc={heroContent.heroImage} heightClass="min-h-[460px]" imagePosition="center 48%">
        <motion.div
          className="mx-auto grid min-h-[430px] w-full max-w-6xl items-end gap-6 px-4 pb-10 pt-16 md:px-6 lg:grid-cols-[1fr_0.72fr]"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-100/74">Resort View</p>
            <h1 className="mt-4 max-w-[14ch] break-words text-4xl font-extrabold leading-tight text-white sm:max-w-3xl md:text-6xl">
              {heroContent.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-white/82 md:text-lg">{heroContent.subtitle}</p>
          </div>
          <div className="rounded-[1.35rem] border border-white/16 bg-slate-950/56 p-4 text-sm text-slate-200 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100/70">Aktueller Index</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/[0.07] p-3">
                <div className="text-2xl font-extrabold text-white">{loading ? "..." : number.format(filtered.length)}</div>
                <div className="mt-1 text-xs text-slate-400">Treffer</div>
              </div>
              <div className="rounded-2xl bg-white/[0.07] p-3">
                <div className="text-2xl font-extrabold text-white">8</div>
                <div className="mt-1 text-xs text-slate-400">Signale</div>
              </div>
              <div className="rounded-2xl bg-white/[0.07] p-3">
                <div className="text-2xl font-extrabold text-white">3</div>
                <div className="mt-1 text-xs text-slate-400">Ansichten</div>
              </div>
            </div>
          </div>
        </motion.div>
      </BackgroundHero>

      <Section className="space-y-6">
        <GlassCard className="p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-100/62">Best Matches</p>
              <h2 className="mt-2 text-2xl font-extrabold text-white md:text-3xl">Empfohlene Resorts</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Sortiert nach Alpivo-Fit. Jede Karte zeigt Gründe, Haken und die wichtigsten Fakten zuerst.
              </p>
            </div>

            <nav className="inline-flex w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.05] p-1 sm:w-auto" aria-label="Resort Ansicht wechseln">
              {viewOptions.map((option) =>
                option.active ? (
                  <span key={option.label} className="flex-1 rounded-xl bg-sky-200 px-4 py-2 text-center text-sm font-extrabold text-slate-950 sm:flex-none">
                    {option.label}
                  </span>
                ) : (
                  <Link
                    key={option.label}
                    href={option.href}
                    className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white sm:flex-none"
                  >
                    {option.label}
                  </Link>
                )
              )}
            </nav>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span className="font-semibold text-white">
              {loading ? "Resortdaten werden kuratiert" : `${number.format(filtered.length)} von ${totalLabel} Resorts`}
            </span>
            {!loading && usingFallback ? <span className="rounded-full border border-amber-200/22 bg-amber-200/10 px-2.5 py-1 text-xs text-amber-50">Fallback-Daten</span> : null}
            {activeFilterChips.length > 0 ? (
              <>
                {activeFilterChips.map((chip) => (
                  <span key={chip.key} className="rounded-full border border-white/12 bg-white/[0.07] px-2.5 py-1 text-xs text-slate-100">
                    {chip.label}
                  </span>
                ))}
                <button type="button" onClick={resetFilters} className="rounded-full px-2.5 py-1 text-xs font-semibold text-sky-100 hover:bg-sky-200/10">
                  Zurücksetzen
                </button>
              </>
            ) : (
              <span className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-xs text-slate-400">Keine aktiven Filter</span>
            )}
          </div>
        </GlassCard>

        <GlassCard className="z-20 p-4 md:p-5 lg:sticky lg:top-24">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(180px,0.55fr)]">
            <label className="block">
              <span className="sr-only">Resort, Region, Land oder Stimmung suchen</span>
              <input
                className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-950/42 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-slate-500 focus:border-sky-200/45 focus:ring-2 focus:ring-sky-200/20"
                placeholder="Resort, Region, Land oder Stimmung suchen"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <SelectControl
              value={countryFilter}
              ariaLabel="Land filtern"
              options={countries.map((country) => ({
                value: country,
                label: country === "all" ? "Alle Länder" : country,
              }))}
              onChange={setCountryFilter}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Stil filtern">
            {styleOptions.map((option) => {
              const active = styleFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-sky-200 bg-sky-200 text-slate-950"
                      : "border-white/12 bg-white/[0.045] text-slate-200 hover:border-sky-200/30 hover:bg-sky-200/10"
                  }`}
                  onClick={() => setStyleFilter(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {!loading && filteredOutCount > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-slate-300">
            {number.format(filteredOutCount)} Resorts ausgefiltert durch {filteredOutReasons || "aktive Filter"}.
          </div>
        ) : null}

        {error ? (
          <GlassCard className="p-5 text-sm leading-6 text-amber-100">
            Live-Daten konnten nicht zuverlässig geladen werden. Alpivo zeigt deshalb kuratierte Demo-Resorts. Technischer Hinweis: {error}
          </GlassCard>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`skeleton-${index}`} />)
            : visibleResorts.map((resort) => <ResortDecisionCard key={resort.id} resort={resort} compact />)}
        </div>

        {!loading && filtered.length > visibleResorts.length ? (
          <div className="flex justify-center">
            <button
              type="button"
              className="button-lift rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            >
              Weitere {number.format(Math.min(PAGE_SIZE, filtered.length - visibleResorts.length))} Resorts anzeigen
            </button>
          </div>
        ) : null}

        {!loading && filtered.length === 0 && !error ? (
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white">Keine Resorts gefunden</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Zu deiner Suche passen aktuell keine Resorts. Setze Filter zurück oder starte einen Match mit neutralem Profil.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" onClick={resetFilters}>
                Filter zurücksetzen
              </button>
              <Link className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href="/quiz">
                Match starten
              </Link>
            </div>
          </GlassCard>
        ) : null}
      </Section>
    </div>
  );
}
