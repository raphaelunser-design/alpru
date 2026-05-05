"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import ResortDecisionCard from "@/components/ResortDecisionCard";
import Section from "@/components/Section";
import SelectControl from "@/components/SelectControl";
import { supabase } from "@/lib/supabase";
import { deriveResortDecision, resortSignalSelect, type MatchPreferences, type ResortSignalRow } from "@/lib/resortSignals";
import { getMvpResorts, mergeWithMvpResorts } from "@/lib/mvpResorts";
import { useSiteContent } from "@/lib/useSiteContent";

type Resort = ResortSignalRow;

const FILTER_STORAGE_KEY = "alpivo_resorts_filters";
const INITIAL_VISIBLE_COUNT = 18;

const styleOptions = [
  { value: "all", label: "Alle" },
  { value: "budget", label: "Günstig" },
  { value: "premium", label: "Premium" },
  { value: "apres", label: "Après-Ski" },
  { value: "quiet", label: "Ruhig" },
  { value: "snow", label: "Schneesicher" },
  { value: "glacier", label: "Gletscher" },
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
    <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/55 shadow-sm">
      <div className="h-[168px] animate-pulse bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-20 animate-pulse rounded-lg bg-white/10" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 animate-pulse rounded-lg bg-white/10" />
          <div className="h-14 animate-pulse rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function ResortsPage() {
  const { value: heroContent } = useSiteContent("resorts", {
    title: "Alpen-Resorts ruhig vergleichen",
    subtitle: "Finde Skigebiete nach Stil, Schneesicherheit, Kostenlogik und echten Entscheidungsgründen.",
    heroImage: "/bg/banner-bild-4k.png",
  });
  const [resorts, setResorts] = useState<Resort[]>(() => getMvpResorts(35) as Resort[]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(true);

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
      setLoading(false);
      setError("");
      setUsingFallback(false);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 7000);

      try {
        const { data, error } = await supabase
          .from("resorts")
          .select(resortSignalSelect)
          .order("name", { ascending: true })
          .abortSignal(controller.signal)
          .returns<Resort[]>();

        if (error) throw error;

        const next = mergeWithMvpResorts(data, 35) as Resort[];
        setResorts(next.length ? next : (getMvpResorts(35) as Resort[]));
        setUsingFallback((data ?? []).length === 0);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Resorts konnten nicht geladen werden.");
        setResorts(getMvpResorts(35) as Resort[]);
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
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [query, countryFilter, styleFilter]);

  const countries = useMemo(() => {
    const unique = new Set<string>();
    resorts.forEach((r) => {
      if (r.country) unique.add(r.country);
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
    return decisions.filter((r) => {
      if (countryFilter !== "all" && r.country !== countryFilter) return false;
      if (styleFilter === "budget" && r.budgetClass !== "budget") return false;
      if (styleFilter === "premium" && r.budgetClass !== "premium") return false;
      if (styleFilter === "apres" && (r.apresScore ?? 0) < 0.65) return false;
      if (styleFilter === "quiet" && (r.crowdScore == null || 1 - r.crowdScore < 0.6)) return false;
      if (styleFilter === "snow" && r.snowReliability < 0.62) return false;
      if (styleFilter === "glacier" && r.summerGlacierScore < 0.58) return false;
      if (!needle) return true;
      const haystack = `${r.name} ${r.country} ${r.region ?? ""} ${r.vibeTags.map((tag) => tag.label).join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [decisions, query, countryFilter, styleFilter]);

  const visibleResorts = filtered.slice(0, visibleCount);
  const selectedStyle = styleOptions.find((option) => option.value === styleFilter)?.label ?? "Alle";
  const activeFilterText = [
    countryFilter === "all" ? null : countryFilter,
    styleFilter === "all" ? null : selectedStyle,
    query.trim() ? `"${query.trim()}"` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc={heroContent.heroImage} heightClass="min-h-[340px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[320px] w-full max-w-6xl items-end px-4 pb-10 pt-12 md:px-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Resort-Bibliothek</p>
            <h1 className="mt-4 max-w-[13ch] break-words text-3xl font-semibold leading-tight text-white sm:max-w-2xl md:text-5xl">
              {heroContent.title}
            </h1>
            <p className="mt-3 max-w-[36rem] text-sm leading-relaxed text-white/78 md:text-base">{heroContent.subtitle}</p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <GlassCard className="p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Suche</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Wenige Filter, klare Treffer</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Starte breit und verfeinere nur bei Bedarf. Die besten Treffer stehen oben, weitere Resorts bleiben
                bewusst eingeklappt.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href="/map">
                Karte öffnen
              </Link>
              <Link className="rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" href="/quiz">
                Match starten
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(180px,0.7fr)]">
            <input
              className="rounded-lg border border-white/10 bg-slate-950/42 px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-slate-500 focus:border-sky-200/45 focus:ring-2 focus:ring-sky-200/20"
              placeholder="Resort, Region, Land oder Stimmung suchen"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <SelectControl
              value={countryFilter}
              ariaLabel="Land filtern"
              options={countries.map((country) => ({
                value: country,
                label: country === "all" ? "Alle L?nder" : country,
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
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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

        <div className="flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-slate-300 md:flex-row md:items-center">
          <div>
            <span className="font-semibold text-white">
              {loading ? "Resorts werden geladen" : `${number.format(filtered.length)} Treffer`}
            </span>
            {!loading && activeFilterText ? <span className="text-slate-400"> ? Filter: {activeFilterText}</span> : null}
            {!loading && usingFallback ? <span className="text-slate-400"> ? kuratierter MVP-Fallback</span> : null}
          </div>
          {!loading && filtered.length > 0 ? (
            <div className="text-slate-400">
              Zeige {number.format(visibleResorts.length)} von {number.format(filtered.length)}
            </div>
          ) : null}
        </div>

        {error ? (
          <GlassCard className="p-6 text-sm text-amber-100">
            Live-Daten konnten nicht zuverlässig geladen werden. Alpivo zeigt deshalb kuratierte Demo-Resorts. Technischer Hinweis: {error}
          </GlassCard>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
            : visibleResorts.map((resort) => <ResortDecisionCard key={resort.id} resort={resort} compact />)}
        </div>

        {!loading && filtered.length > visibleResorts.length ? (
          <div className="flex justify-center">
            <button
              type="button"
              className="button-lift rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE_COUNT)}
            >
              Weitere {number.format(Math.min(INITIAL_VISIBLE_COUNT, filtered.length - visibleResorts.length))} Resorts anzeigen
            </button>
          </div>
        ) : null}

        {!loading && filtered.length === 0 && !error ? (
          <GlassCard className="p-6 text-sm text-slate-200">
            Keine Alpen-Resorts zu diesen Filtern gefunden. Suche lockern oder direkt mit einem neutralen Match starten.
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => {
                  setQuery("");
                  setCountryFilter("all");
                  setStyleFilter("all");
                }}
              >
                Filter zurücksetzen
              </button>
              <Link className="rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" href="/quiz">
                Match starten
              </Link>
            </div>
          </GlassCard>
        ) : null}
      </Section>
    </div>
  );
}
