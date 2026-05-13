"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import ResortDecisionCard from "@/components/ResortDecisionCard";
import Section from "@/components/Section";
import SelectControl from "@/components/SelectControl";
import AppShell from "@/components/premium/AppShell";
import PageHeader from "@/components/premium/PageHeader";
import ResortMatchCard from "@/components/premium/ResortMatchCard";
import TrustPoint from "@/components/premium/TrustPoint";
import { deriveResortDecision, type MatchPreferences, type ResortSignalRow } from "@/lib/resortSignals";
import { getMvpResorts } from "@/lib/mvpResorts";
import type { ResortLoadResult } from "@/lib/resortRepository";
import { premiumMatches } from "@/lib/premiumDemoMatches";

type Resort = ResortSignalRow;

const FILTER_STORAGE_KEY = "alpivo_resorts_filters";
const PAGE_SIZE = 60;

const styleOptions = [
  { value: "all", label: "Alle" },
  { value: "budget", label: "Günstig" },
  { value: "premium", label: "Premium" },
  { value: "apres", label: "Après-Ski" },
  { value: "festival", label: "Festival" },
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
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_18px_54px_rgba(2,6,23,0.22)]">
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
      if (styleFilter === "festival" && !((r.eventBadges?.length ?? 0) > 0 || (r.festivalFitScore ?? 0) >= 0.66)) return false;
      if (styleFilter === "quiet" && (r.crowdScore == null || 1 - r.crowdScore < 0.6)) return false;
      if (styleFilter === "snow" && r.snowReliability < 0.62) return false;
      if (styleFilter === "glacier" && r.summerGlacierScore < 0.58) return false;
      if (!needle) return true;
      const haystack = `${r.name} ${r.country} ${r.region ?? ""} ${r.vibeTags.map((tag) => tag.label).join(" ")} ${(r.eventBadges ?? []).join(" ")} ${(r.events ?? []).map((event) => event.name).join(" ")}`.toLowerCase();
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

  const filteredOutCount = Math.max(0, decisions.length - filtered.length);
  const filteredOutReasons = [
    countryFilter === "all" ? null : "Landfilter",
    styleFilter === "all" ? null : "Stilfilter",
    query.trim() ? "Suchbegriff" : null,
  ]
    .filter(Boolean)
    .join(", ");
  const totalLabel = number.format(totalResorts || resorts.length);

  return (
    <AppShell>
      <div className="alpivo-page-shell min-h-screen px-4 py-8 md:px-8">
        <Section className="max-w-[1420px] space-y-7 py-0">
          <PageHeader
            eyebrow="Resort Übersicht"
            title="Resorts entdecken"
            subtitle="Vergleicht Skigebiete nach Match, Budget, Schnee und Vibe. Die Pilot-Auswahl zeigt den neuen Alpivo-Produktkern."
            actions={
              <>
                <Link className="inline-flex min-h-12 items-center rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10" href="/map">
                  Karte öffnen
                </Link>
                <Link className="button-lift inline-flex min-h-12 items-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400" href="/quiz">
                  Match starten
                </Link>
              </>
            }
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {premiumMatches.slice(0, 3).map((match, index) => (
                <ResortMatchCard key={match.slug} match={match} variant="grid" priority={index === 0} />
              ))}
            </div>
            <aside className="rounded-[1.7rem] border border-white/12 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.3)] backdrop-blur-xl">
              <h2 className="text-xl font-black text-white">Eure Kriterien</h2>
              <div className="mt-5 space-y-4 text-sm text-slate-300">
                <div className="border-b border-white/10 pb-4"><span className="block text-xs uppercase tracking-[0.16em] text-slate-500">Profil</span><strong className="mt-1 block text-white">Après & Events</strong></div>
                <div className="border-b border-white/10 pb-4"><span className="block text-xs uppercase tracking-[0.16em] text-slate-500">Reisezeitraum</span><strong className="mt-1 block text-white">20. - 24. Jan. 2027</strong></div>
                <div className="border-b border-white/10 pb-4"><span className="block text-xs uppercase tracking-[0.16em] text-slate-500">Abfahrt</span><strong className="mt-1 block text-white">München</strong></div>
                <div><span className="block text-xs uppercase tracking-[0.16em] text-slate-500">Prioritäten Top 3</span><ol className="mt-2 space-y-2 font-bold text-white"><li>1. Après-Ski & Events</li><li>2. Pistenvielfalt</li><li>3. Schneesicherheit</li></ol></div>
              </div>
              <Link href="/quiz" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-sky-500 px-4 text-sm font-black text-white hover:bg-sky-400">
                Match anpassen
              </Link>
            </aside>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <TrustPoint icon="shield" title="Unabhängig & objektiv" text="Keine Werbung. Keine Bevorzugung." />
            <TrustPoint icon="data" title="Aktuelle Daten & Bewertungen" text="Aus Skigebietsinfos, Wetter und Community-Signalen." />
            <TrustPoint icon="lock" title="Sicher & transparent" text="Deine Daten bleiben bei dir." />
          </div>

        <GlassCard className="p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Suche</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Wenige Filter, klare Treffer</h2>
              <p className="mt-2 max-w-[19.5rem] text-sm leading-relaxed text-slate-300 sm:max-w-2xl">
                Starte breit. Die besten Treffer stehen oben, weitere Resorts bleiben einklappbar.
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
              {loading ? "Resortdaten werden kuratiert" : `${number.format(filtered.length)} von ${totalLabel} Resorts`}
            </span>
            {!loading && usingFallback ? <span className="text-amber-100"> · Fallback-Daten</span> : null}
            {!loading && filteredOutCount > 0 ? (
              <div className="mt-1 text-xs text-slate-500">
                {number.format(filteredOutCount)} Resorts ausgefiltert durch {filteredOutReasons || "aktive Filter"}.
              </div>
            ) : null}
            {!loading && activeFilterText ? <span className="text-slate-400"> · Filter: {activeFilterText}</span> : null}
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
              <button
                type="button"
                className="rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
                onClick={() => {
                  setQuery("");
                  setCountryFilter("all");
                  setStyleFilter("all");
                }}
              >
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
    </AppShell>
  );
}

