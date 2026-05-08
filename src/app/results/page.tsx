"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Toast from "@/components/Toast";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import RangeSlider from "@/components/RangeSlider";
import AlpivoCompass from "@/components/AlpivoCompass";
import ResortDecisionCard from "@/components/ResortDecisionCard";
import ScoreRing from "@/components/ScoreRing";
import SelectControl from "@/components/SelectControl";
import TravelConnectionPanel, { type TravelMode } from "@/components/TravelConnectionPanel";
import { deriveResortDecision, type MatchPreferences, type ResortDecision, type ResortSignalRow } from "@/lib/resortSignals";
import { getMvpResorts } from "@/lib/mvpResorts";
import {
  RESULT_BUDGET_MAX,
  RESULT_BUDGET_MIN,
  buildMatchPayload,
  buildResortQuery,
  getLatestMatchSnapshot,
  type MatchResultError,
  type MatchResultMeta,
} from "@/lib/matching/matchPayload";
import type { ResortLoadResult } from "@/lib/resortRepository";
import { useSiteContent } from "@/lib/useSiteContent";

type Result = ResortDecision;
type PremiumResult = Result & { driveHours?: number | null };

type SortKey = "match" | "price_low" | "price_high" | "drive_time" | "snow" | "value" | "festival" | "summer" | "offpiste";

type RouteMetric = {
  id: string;
  durationSeconds: number | null;
  distanceMeters: number | null;
  source: "osrm" | "fallback";
};

type RouteStatus = "idle" | "loading" | "ready" | "error";

type GeoState = {
  status: "idle" | "loading" | "ready" | "error";
  error: string;
  location: { lat: number; lon: number; label: string } | null;
};

type TravelPrefs = {
  travelMode: TravelMode;
  tripStartDate: string | null;
  tripEndDate: string | null;
};

type GeocodeResult = {
  id: string | number;
  name: string;
  lat: number;
  lon: number;
  country: string;
  admin1: string;
  label: string;
};

const FILTER_STORAGE_KEY = "alpivo_results_filters";
const EXAMPLE_PREFS: MatchPreferences = {
  tripStyle: "balanced",
  tripStartDate: null,
  tripEndDate: null,
  budgetMin: 250,
  budgetMax: 500,
  budget: 500,
  peopleCount: 2,
  apres: 3,
  emptySlopes: 3,
  infrastructure: 4,
  huts: 3,
  snowpark: 2,
  easyRuns: 3,
  challenging: 3,
  snowReliability: 4,
  valueForMoney: 4,
  family: 2,
  panorama: 3,
  summerGlacier: 1,
  offPiste: 1,
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

const BUDGET_MIN = RESULT_BUDGET_MIN;
const BUDGET_MAX = RESULT_BUDGET_MAX;
const BUDGET_STEP = 25;
const number = new Intl.NumberFormat("de-DE");
const fallbackResultImage = "/bg/site-hero.jpg";

function formatEuro(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "offen";
  return `€ ${number.format(Math.round(value))}`;
}

function formatDrive(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "offen";
  const minutes = Math.max(1, Math.round(value * 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest} min`;
  return rest ? `${hours}:${String(rest).padStart(2, "0")} h` : `${hours}:00 h`;
}

function resultCost(resort: Result) {
  const algorithm = resort.estimatedCosts || resort.alpivoScore?.estimatedCosts;
  if (algorithm?.totalPerPerson) return algorithm.totalPerPerson;
  return resort.cost?.totalMin ?? null;
}

function resultImage(resort: Result) {
  return (resort.imageUrl || "").trim() || fallbackResultImage;
}

function resultLocation(resort: Result) {
  return [resort.region, resort.country].filter(Boolean).join(", ");
}

function resultReason(resort: Result) {
  return resort.reasons?.[0] || "Starker Mix aus Budget, Anreise, Schnee und Vibe.";
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PremiumResultsMoment({ resorts }: { resorts: PremiumResult[] }) {
  const top = resorts[0];
  if (!top) return null;
  const alternatives = resorts.slice(1, 3);

  return (
    <section className="rounded-[1.65rem] border border-slate-200 bg-white p-4 text-slate-950 shadow-[0_30px_95px_rgba(15,23,42,0.16)] md:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-700">Basierend auf euren Präferenzen</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.01em] text-slate-950">Eure Top Matches</h2>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-sky-700 transition hover:border-sky-200 hover:bg-sky-50" href="/quiz">
          Match anpassen
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_0.72fr]">
        <article className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)]">
          <div className="relative h-80 overflow-hidden">
            <Image src={resultImage(top)} alt={`${top.name} Top-Match Bild`} fill sizes="(min-width: 1024px) 680px, 92vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/0 via-slate-950/8 to-slate-950/74" />
            <span className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-xl bg-emerald-300 text-xl font-extrabold text-emerald-950">1</span>
            <span className="absolute right-4 top-4 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-950">
              Top Match
            </span>
            <div className="absolute bottom-5 left-5 right-28">
              <h3 className="text-3xl font-extrabold text-white">{top.name}</h3>
              <p className="mt-1 text-sm font-semibold text-white/86">{resultLocation(top)}</p>
            </div>
            <div className="absolute bottom-4 right-4">
              <ScoreRing value={Math.round(top.matchPct || 0)} size="sm" label="Match" />
            </div>
          </div>
          <div className="grid divide-y divide-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              [formatEuro(resultCost(top)), "pro Person"],
              [formatDrive(top.driveHours), "Fahrzeit"],
              ["Schneesicher", top.snowReliability && top.snowReliability > 0.7 ? "sehr gut" : "solide"],
              ["Vibe & Events", top.festivalFitScore && top.festivalFitScore > 0.55 ? "lebendig" : "passend"],
            ].map(([value, label]) => (
              <div key={`${value}-${label}`} className="px-4 py-4">
                <div className="text-sm font-extrabold text-slate-950">{value}</div>
                <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-[1fr_0.85fr]">
            <div>
              <h4 className="text-sm font-extrabold text-slate-950">Warum dieses Skigebiet zu euch passt</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{resultReason(top)}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h4 className="text-sm font-extrabold text-amber-950">Das könnte weniger ideal sein</h4>
              <p className="mt-2 text-sm leading-6 text-amber-900">{top.drawbacks?.[0] || "Details vor Buchung prüfen."}</p>
            </div>
          </div>
          <div className="border-t border-slate-200 p-5">
            <Link href={`/resort/${encodeURIComponent(top.slug)}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-extrabold text-white transition hover:bg-sky-500">
              Details ansehen
              <ArrowIcon />
            </Link>
          </div>
        </article>

        <div className="grid gap-4">
          {alternatives.map((resort, index) => (
            <article key={resort.id} className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="relative h-44 overflow-hidden">
                <Image src={resultImage(resort)} alt={`${resort.name} Match-Bild`} fill sizes="(min-width: 1024px) 420px, 92vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/0 to-slate-950/64" />
                <span className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-lg bg-sky-600 text-base font-extrabold text-white">{index + 2}</span>
                <div className="absolute bottom-4 left-4 right-20">
                  <h3 className="text-xl font-extrabold text-white">{resort.name}</h3>
                  <p className="text-xs font-semibold text-white/78">{resultLocation(resort)}</p>
                </div>
                <div className="absolute bottom-4 right-4 rounded-full border border-white/35 bg-slate-950/42 px-3 py-2 text-center text-white backdrop-blur">
                  <div className="text-xl font-extrabold">{Math.round(resort.matchPct || 0)}</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em]">Match</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 text-xs">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <strong className="block text-slate-950">{formatEuro(resultCost(resort))}</strong>
                  <span className="text-slate-500">pro Person</span>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <strong className="block text-slate-950">{formatDrive(resort.driveHours)}</strong>
                  <span className="text-slate-500">Fahrzeit</span>
                </div>
                <Link href={`/resort/${encodeURIComponent(resort.slug)}`} className="col-span-2 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-extrabold text-sky-700 transition hover:border-sky-200 hover:bg-sky-50">
                  Details ansehen
                  <ArrowIcon />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function createExampleResults(resorts: ResortSignalRow[]) {
  return resorts
    .map((resort) => deriveResortDecision(resort, EXAMPLE_PREFS))
    .sort((a, b) => b.matchPct - a.matchPct || a.name.localeCompare(b.name, "de-DE"));
}

const budgetOptions = [
  { value: "all", label: "Alle Budgets" },
  { value: "green", label: "Im Budget" },
  { value: "yellow", label: "Leicht darüber" },
  { value: "red", label: "Darüber" },
];

const profileOptions = [
  { value: "all", label: "Alle Fits" },
  { value: "snow", label: "Schnee-Fit" },
  { value: "value", label: "Value-Fit" },
  { value: "comfort", label: "Komfort-Fit" },
  { value: "sport", label: "Sport-Fit" },
  { value: "vibe", label: "Vibe-Fit" },
  { value: "festival", label: "Vibe & Events" },
  { value: "glacier", label: "Sommer-Gletscher" },
  { value: "offpiste", label: "Off-Piste" },
];

const sortOptions: Array<{ value: SortKey; label: string; description?: string }> = [
  { value: "match", label: "Beste Passung", description: "Score, Pistenprofil und Fit" },
  { value: "price_low", label: "Günstigste Schätzung", description: "niedrigster Kostenrahmen" },
  { value: "price_high", label: "Teuerste Schätzung", description: "höchster Kostenrahmen" },
  { value: "drive_time", label: "Kürzeste Fahrzeit", description: "nach gesetztem Startort" },
  { value: "snow", label: "Beste Schneesicherheit" },
  { value: "value", label: "Bester Value" },
  { value: "festival", label: "Vibe & Events" },
  { value: "summer", label: "Sommer-Gletscher" },
  { value: "offpiste", label: "Off-Piste Potenzial" },
];

const demoProfiles = [
  {
    title: "Smart Budget",
    text: "Value-starke Resorts mit kontrollierbaren Kosten und kurzer Entscheidungslogik.",
    tags: ["Budget", "Value", "kurz"],
  },
  {
    title: "Après & Crew",
    text: "Gruppen-Vibe, Hütten, Pistenbreite und ein realistisches Kostenfenster.",
    tags: ["Après", "Crew", "Wochenende"],
  },
  {
    title: "Family Calm",
    text: "Einfachere Pisten, ruhigere Orte und planbare Kosten für mehrere Personen.",
    tags: ["Familie", "Ruhe", "Easy"],
  },
];

function ResultsSkeletonCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-[0_18px_54px_rgba(2,6,23,0.22)]">
          <div className="h-32 animate-pulse rounded-xl bg-white/10" />
          <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-12 animate-pulse rounded-lg bg-white/10" />
            <div className="h-12 animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
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

export default function ResultsPage() {
  const { value: heroContent } = useSiteContent("results", {
    title: "Deine besten Ergebnisse",
    subtitle: "Sortiert nach bester Passung. Filtere nach Land, Region, Fahrzeit oder Preis.",
    heroImage: "/bg/banner-bild-4k.png",
  });
  const [results, setResults] = useState<Result[]>([]);
  const [excludedResults, setExcludedResults] = useState<Result[]>([]);
  const [totalResortCount, setTotalResortCount] = useState(0);
  const [loadingResults, setLoadingResults] = useState(true);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [dataSourceError, setDataSourceError] = useState("");
  const [matchError, setMatchError] = useState<MatchResultError | null>(null);
  const [resultMeta, setResultMeta] = useState<MatchResultMeta | null>(null);

  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("match");
  const [maxDriveHours, setMaxDriveHours] = useState("");
  const [minPisteKm, setMinPisteKm] = useState("");
  const [maxPisteKm, setMaxPisteKm] = useState("");
  const [budgetMin, setBudgetMin] = useState(BUDGET_MIN);
  const [budgetMax, setBudgetMax] = useState(BUDGET_MAX);
  const [budgetFilterActive, setBudgetFilterActive] = useState(false);
  const [apresMin, setAprèsMin] = useState(0);
  const [quietMin, setQuietMin] = useState(0);
  const [toast, setToast] = useState("");
  const [originQuery, setOriginQuery] = useState("");
  const [originResults, setOriginResults] = useState<GeocodeResult[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [geo, setGeo] = useState<GeoState>({
    status: "idle",
    error: "",
    location: null,
  });
  const [routeMetrics, setRouteMetrics] = useState<Record<string, RouteMetric>>({});
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");
  const [routeError, setRouteError] = useState("");
  const [peopleCount, setPeopleCount] = useState(2);
  const [travelPrefs, setTravelPrefs] = useState<TravelPrefs>({
    travelMode: "car",
    tripStartDate: null,
    tripEndDate: null,
  });
  const [hydrated, setHydrated] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [usingExampleResults, setUsingExampleResults] = useState(true);
  const [showDemoResults, setShowDemoResults] = useState(false);

  const resetResultFilters = () => {
    setQuery("");
    setCountryFilter("all");
    setRegionFilter("all");
    setBudgetFilter("all");
    setProfileFilter("all");
    setSortBy("match");
    setMaxDriveHours("");
    setMinPisteKm("");
    setMaxPisteKm("");
    setBudgetMin(BUDGET_MIN);
    setBudgetMax(BUDGET_MAX);
    setBudgetFilterActive(false);
    setAprèsMin(0);
    setQuietMin(0);
  };

  useEffect(() => {
    let active = true;

    async function hydrateResults() {
      setLoadingResults(true);
      setDataSourceError("");
      setMatchError(null);

      const applyLoadedResults = (nextResults: Result[], nextExcluded: Result[], meta?: MatchResultMeta | null) => {
        setResults(nextResults);
        setExcludedResults(nextExcluded);
        setResultMeta(meta ?? null);
        setTotalResortCount(meta?.total ?? nextResults.length);
        setUsingExampleResults(false);
        setShowDemoResults(false);
        setUsingFallbackData(Boolean(meta?.usingFallback));
        setDataSourceError("");
        setLoadingResults(false);
      };

      const finishNoStoredResults = (message = "") => {
        resetResultFilters();
        setUsingExampleResults(true);
        setShowDemoResults(false);
        setResults([]);
        setExcludedResults([]);
        setTotalResortCount(0);
        setResultMeta(null);
        setUsingFallbackData(false);
        setDataSourceError(message);
        setLoadingResults(false);
      };

      // Mobile browsers can lose the quiz -> results Web Storage handoff; refetch keeps /results non-empty.
      const refetchMatchResults = async () => {
        let storedPrefs: unknown = {};
        let storedFilters: unknown = {};

        try {
          const rawPrefs = localStorage.getItem("alpivo_quiz_prefs");
          if (rawPrefs) storedPrefs = JSON.parse(rawPrefs);
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[alpivo-results] stored match preferences could not be read before refetch", { error });
          }
        }

        try {
          const rawFilters = localStorage.getItem(FILTER_STORAGE_KEY);
          if (rawFilters) storedFilters = JSON.parse(rawFilters);
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[alpivo-results] stored result filters could not be read before refetch", { error });
          }
        }

        const prefs = buildMatchPayload(storedPrefs);
        const filters = buildResortQuery({
          ...buildResortQuery(storedFilters),
          budgetMin: prefs.budgetMin,
          budgetMax: prefs.budgetMax,
        });
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch("/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prefs),
            cache: "no-store",
            signal: controller.signal,
          });
          const payload = (await response.json().catch(() => null)) as {
            results?: Result[];
            excluded?: Result[];
            source?: string;
            usingFallback?: boolean;
            total?: number;
            loaded?: number;
          } | null;

          if (!response.ok || !payload || !Array.isArray(payload.results)) {
            throw new Error(`Match-Refetch failed with status ${response.status}`);
          }

          const nextResults = payload.results;
          const nextExcluded = Array.isArray(payload.excluded) ? payload.excluded : [];
          if (nextResults.length === 0) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("[alpivo-results] match refetch returned no results", { params: prefs, filters, payload });
            }
            return false;
          }

          const meta: MatchResultMeta = {
            createdAt: new Date().toISOString(),
            source: payload.source ?? "api-refetch",
            usingFallback: Boolean(payload.usingFallback),
            total: Number.isFinite(Number(payload.total)) ? Number(payload.total) : nextResults.length,
            loaded: Number.isFinite(Number(payload.loaded)) ? Number(payload.loaded) : nextResults.length,
            resultCount: nextResults.length,
            excludedCount: nextExcluded.length,
            prefs,
            filters,
          };

          if (!active) return true;
          applyLoadedResults(nextResults, nextExcluded, meta);

          try {
            sessionStorage.setItem("ski_results", JSON.stringify(nextResults));
            localStorage.setItem("alpivo_results", JSON.stringify(nextResults));
            localStorage.setItem("alpivo_excluded_results", JSON.stringify(nextExcluded));
            localStorage.setItem("alpivo_results_meta", JSON.stringify(meta));
            localStorage.removeItem("alpivo_results_error");
          } catch {
            // Storage may be blocked on mobile/private browsers; visible results already came from the refetch.
          }

          return true;
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[alpivo-results] match refetch failed", { params: prefs, filters, error });
          }
          return false;
        } finally {
          window.clearTimeout(timeout);
        }
      };

      const memorySnapshot = getLatestMatchSnapshot();
      if (memorySnapshot?.error) {
        if (!active) return;
        setMatchError(memorySnapshot.error);
        setResultMeta(null);
        setResults([]);
        setExcludedResults([]);
        setTotalResortCount(0);
        setUsingExampleResults(false);
        setShowDemoResults(false);
        setUsingFallbackData(false);
        setLoadingResults(false);
        return;
      }

      if (memorySnapshot?.results?.length) {
        if (!active) return;
        applyLoadedResults(memorySnapshot.results as Result[], (memorySnapshot.excluded ?? []) as Result[], memorySnapshot.meta ?? null);
        return;
      }

      try {
        const excluded = localStorage.getItem("alpivo_excluded_results");
        if (excluded) setExcludedResults(JSON.parse(excluded) as Result[]);
      } catch {
        setExcludedResults([]);
      }

      try {
        const storedError = localStorage.getItem("alpivo_results_error");
        if (storedError) {
          const parsedError = JSON.parse(storedError) as MatchResultError;
          if (!active) return;
          setMatchError(parsedError);
          setResultMeta(null);
          setResults([]);
          setTotalResortCount(0);
          setUsingExampleResults(false);
          setShowDemoResults(false);
          setUsingFallbackData(false);
          setLoadingResults(false);
          return;
        }

        const rawMeta = localStorage.getItem("alpivo_results_meta");
        const parsedMeta = rawMeta ? (JSON.parse(rawMeta) as MatchResultMeta) : null;
        const rawExcluded = localStorage.getItem("alpivo_excluded_results");
        const parsedExcluded = rawExcluded ? (JSON.parse(rawExcluded) as Result[]) : [];

        const raw = sessionStorage.getItem("ski_results");
        if (raw) {
          const parsed = JSON.parse(raw) as Result[];
          if (!active) return;
          if (parsed.length > 0) {
            applyLoadedResults(parsed, parsedExcluded, parsedMeta);
            return;
          }
        }

        const cached = localStorage.getItem("alpivo_results");
        if (cached) {
          const parsed = JSON.parse(cached) as Result[];
          if (!active) return;
          if (parsed.length > 0) {
            applyLoadedResults(parsed, parsedExcluded, parsedMeta);
            return;
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[alpivo-results] stored match data could not be read", { error });
        }
        // continue with the explicit no-match state if stored client data is invalid
      }

      if (!active) return;
      const refetched = await refetchMatchResults();
      if (!active || refetched) return;
      finishNoStoredResults("Kein gespeicherter Match gefunden. Starte den Match erneut oder lade die Demo.");
    }

    hydrateResults();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loadingResults) return;
    const timeout = window.setTimeout(() => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[alpivo-results] results hydration timed out", {
          resultCount: results.length,
          hasMatchError: Boolean(matchError),
          resultMeta,
        });
      }
      if (results.length === 0 && !matchError) {
        setUsingExampleResults(true);
        setShowDemoResults(false);
        setDataSourceError("Der Match konnte nicht rechtzeitig geladen werden. Starte die Suche erneut oder lade die Demo.");
      }
      setLoadingResults(false);
    }, 12000);

    return () => window.clearTimeout(timeout);
  }, [loadingResults, matchError, resultMeta, results.length]);

  useEffect(() => {
    try {
      const rawPrefs = localStorage.getItem("alpivo_quiz_prefs");
      if (rawPrefs) {
        const saved = buildMatchPayload(JSON.parse(rawPrefs));
        setBudgetMin(saved.budgetMin);
        setBudgetMax(saved.budgetMax);
        setPeopleCount(saved.peopleCount);
        setTravelPrefs({
          travelMode: saved.travelMode,
          tripStartDate: saved.tripStartDate,
          tripEndDate: saved.tripEndDate,
        });
      }
    } catch {
      // ignore invalid storage
    }

    try {
      const raw = localStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const saved = buildResortQuery(JSON.parse(raw));
      setQuery(saved.query);
      setCountryFilter(saved.countryFilter);
      setRegionFilter(saved.regionFilter);
      setBudgetFilter(saved.budgetFilter);
      setProfileFilter(saved.profileFilter);
      setSortBy(saved.sortBy as SortKey);
      setMaxDriveHours(saved.maxDriveHours);
      setMaxPisteKm(saved.maxPisteKm);
      setMinPisteKm(saved.minPisteKm);
      if (saved.apresMin !== undefined) setAprèsMin(Number(saved.apresMin));
      if (saved.quietMin !== undefined) setQuietMin(Number(saved.quietMin));
      setBudgetMin(saved.budgetMin);
      setBudgetMax(saved.budgetMax);
      setBudgetFilterActive(saved.budgetFilterActive);
      if (saved.originLat !== null && saved.originLon !== null) {
        setGeo({
          status: "ready",
          error: "",
          location: {
            lat: saved.originLat,
            lon: saved.originLon,
            label: saved.originLabel || "Gespeicherter Standort",
          },
        });
        if (saved.originLabel) setOriginQuery(saved.originLabel);
      }
    } catch {
      // ignore invalid storage
    }
    setHydrated(true);
  }, []);

  const countries = useMemo(() => {
    const unique = new Set<string>();
    results.forEach((r) => {
      if (r.country) unique.add(r.country);
    });
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b, "de-DE"))];
  }, [results]);

  const regions = useMemo(() => {
    const unique = new Set<string>();
    results.forEach((r) => {
      if (r.region) unique.add(r.region);
    });
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b, "de-DE"))];
  }, [results]);

  const enriched = useMemo(() => {
    return results.map((r) => {
      const hasCoords = geo.location && Number.isFinite(r.lat) && Number.isFinite(r.lon);
      const straightDistanceKm = hasCoords
        ? haversineKm(geo.location!, { lat: r.lat as number, lon: r.lon as number })
        : null;
      const metric = routeMetrics[r.id];
      const distanceKm = typeof metric?.distanceMeters === "number" ? metric.distanceMeters / 1000 : null;
      const routeDurationSeconds = typeof metric?.durationSeconds === "number" ? metric.durationSeconds : null;
      const driveHours = routeDurationSeconds ? Math.round((routeDurationSeconds / 3600) * 10) / 10 : null;
      return {
        ...r,
        straightDistanceKm,
        distanceKm,
        routeDurationSeconds,
        routeSource: metric?.source ?? null,
        driveHours,
      };
    });
  }, [results, geo.location, routeMetrics]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const driveCapHours = Number(maxDriveHours);
    const pisteMin = Number(minPisteKm);
    const pisteMax = Number(maxPisteKm);
    const apresThreshold = apresMin / 100;
    const quietThreshold = quietMin / 100;

    const maxBudget = budgetFilterActive ? Math.max(budgetMin, budgetMax) : 0;

    return enriched.filter((r) => {
      if (countryFilter !== "all" && r.country !== countryFilter) return false;
      if (regionFilter !== "all" && r.region !== regionFilter) return false;
      if (budgetFilter !== "all" && r.budgetStatus !== budgetFilter) return false;
      if (profileFilter === "snow" && (r.fitProfile.snow ?? r.snowReliability ?? 0) < 0.62) return false;
      if (profileFilter === "value" && (r.fitProfile.value ?? r.valueScore ?? 0) < 0.58) return false;
      if (profileFilter === "comfort" && (r.fitProfile.comfort ?? 0) < 0.55) return false;
      if (profileFilter === "sport" && (r.fitProfile.slope ?? 0) < 0.6) return false;
      if (profileFilter === "vibe" && (r.fitProfile.vibe ?? 0) < 0.6) return false;
      if (profileFilter === "festival" && !((r.eventBadges?.length ?? 0) > 0 || (r.festivalFitScore ?? 0) >= 0.66)) return false;
      if (profileFilter === "glacier" && (r.summerGlacierScore ?? r.fitProfile.summer ?? 0) < 0.58) return false;
      if (profileFilter === "offpiste" && (r.fitProfile.offPiste ?? 0) < 0.58) return false;
      if (needle) {
        const haystack =
          `${r.name} ${r.country} ${r.region ?? ""} ${r.vibeTags.map((tag) => tag.label).join(" ") ?? ""} ${(r.eventBadges ?? []).join(" ")} ${(r.events ?? []).map((event) => event.name).join(" ")} ${r.bestFor.join(" ") ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (Number.isFinite(driveCapHours) && driveCapHours > 0) {
        if (!geo.location) return true;
        if (routeStatus === "loading") return true;
        if (routeStatus === "error") return true;
        if (r.routeDurationSeconds === null || r.routeDurationSeconds === undefined) return true;
        if (r.routeDurationSeconds > driveCapHours * 3600) return false;
      }
      if (Number.isFinite(pisteMin) && pisteMin > 0) {
        if (r.pisteKm === null || r.pisteKm < pisteMin) return false;
      }
      if (Number.isFinite(pisteMax) && pisteMax > 0) {
        if (r.pisteKm === null || r.pisteKm > pisteMax) return false;
      }
      if (Number.isFinite(maxBudget) && maxBudget > 0) {
        if (r.cost.totalMin > maxBudget) return false;
      }
      if (apresThreshold > 0) {
        if (r.apresScore == null || r.apresScore < apresThreshold) return false;
      }
      if (quietThreshold > 0) {
        const quietScore = r.crowdScore == null ? null : 1 - r.crowdScore;
        if (quietScore == null || quietScore < quietThreshold) return false;
      }
      return true;
    });
  }, [
    enriched,
    query,
    countryFilter,
    regionFilter,
    budgetFilter,
    profileFilter,
    maxDriveHours,
    geo.location,
    routeStatus,
    minPisteKm,
    maxPisteKm,
    budgetMin,
    budgetMax,
    budgetFilterActive,
    apresMin,
    quietMin,
  ]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sortBy === "match") {
        const aMatch = a.matchPct -1;
        const bMatch = b.matchPct -1;
        if (bMatch !== aMatch) return bMatch - aMatch;
        const pisteA = a.pisteKm ?? 0;
        const pisteB = b.pisteKm ?? 0;
        if (pisteB !== pisteA) return pisteB - pisteA;
        return a.name.localeCompare(b.name, "de-DE");
      }
      if (sortBy === "price_low") return a.cost.totalMax - b.cost.totalMax;
      if (sortBy === "price_high") return b.cost.totalMax - a.cost.totalMax;
      if (sortBy === "snow") return (b.fitProfile.snow ?? b.snowReliability ?? 0) - (a.fitProfile.snow ?? a.snowReliability ?? 0);
      if (sortBy === "value") return ((b.fitProfile.value ?? b.valueScore ?? 0) - (a.fitProfile.value ?? a.valueScore ?? 0));
      if (sortBy === "festival") return (b.festivalFitScore ?? b.fitProfile.festival ?? 0) - (a.festivalFitScore ?? a.fitProfile.festival ?? 0);
      if (sortBy === "summer") return (b.summerGlacierScore ?? b.fitProfile.summer ?? 0) - (a.summerGlacierScore ?? a.fitProfile.summer ?? 0);
      if (sortBy === "offpiste") return (b.fitProfile.offPiste ?? 0) - (a.fitProfile.offPiste ?? 0);
      if (sortBy === "drive_time") {
        if (a.routeDurationSeconds === null && b.routeDurationSeconds === null) return 0;
        if (a.routeDurationSeconds === null) return 1;
        if (b.routeDurationSeconds === null) return -1;
        return a.routeDurationSeconds - b.routeDurationSeconds;
      }
      return 0;
    });
    return list;
  }, [filtered, sortBy]);

  const visibleResults = useMemo(() => (showAllResults ? sorted : sorted.slice(0, 12)), [showAllResults, sorted]);
  const filteredOutCount = Math.max(0, results.length - filtered.length);
  const activeFilterReasons = [
    query.trim() ? "Suchbegriff" : null,
    countryFilter !== "all" ? "Landfilter" : null,
    regionFilter !== "all" ? "Regionsfilter" : null,
    budgetFilter !== "all" ? "Budgetfilter" : null,
    profileFilter !== "all" ? "Fit-Filter" : null,
    maxDriveHours ? "Fahrzeitfilter" : null,
    minPisteKm || maxPisteKm ? "Pistenfilter" : null,
    budgetFilterActive ? "Budgetrahmen" : null,
    apresMin > 0 ? "Apres-Filter" : null,
    quietMin > 0 ? "Ruhe-Filter" : null,
  ]
    .filter(Boolean)
    .join(", ");
  const totalBasisCount = resultMeta?.total || totalResortCount || results.length;
  const showNoMatchEmptyState = !loadingResults && usingExampleResults && !showDemoResults;
  const showMatchErrorState = !loadingResults && Boolean(matchError) && results.length === 0;

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || loadingResults || results.length === 0 || sorted.length > 0) return;
    console.warn("[alpivo-results] all stored match results are hidden by client filters", {
      resultCount: results.length,
      filters: {
        query,
        countryFilter,
        regionFilter,
        budgetFilter,
        profileFilter,
        sortBy,
        maxDriveHours,
        minPisteKm,
        maxPisteKm,
        budgetMin,
        budgetMax,
        budgetFilterActive,
        apresMin,
        quietMin,
      },
      routeStatus,
      origin: geo.location,
    });
  }, [
    loadingResults,
    results.length,
    sorted.length,
    query,
    countryFilter,
    regionFilter,
    budgetFilter,
    profileFilter,
    sortBy,
    maxDriveHours,
    minPisteKm,
    maxPisteKm,
    budgetMin,
    budgetMax,
    budgetFilterActive,
    apresMin,
    quietMin,
    routeStatus,
    geo.location,
  ]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeo({ status: "error", error: "Geolocation wird vom Browser nicht unterstützt.", location: null });
      return;
    }
    setGeo((prev) => ({ ...prev, status: "loading", error: "" }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let label = "Aktueller Standort";
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = (await res.json()) as { label: string };
            if (data.label) label = data.label;
          }
        } catch {
          // ignore reverse lookup errors
        }

        setGeo({
          status: "ready",
          error: "",
          location: { lat, lon, label },
        });
        setOriginQuery(label);
        setOriginResults([]);
        setToast("Standort gesetzt");
      },
      (err) => {
        setGeo({ status: "error", error: err.message, location: null });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearLocation = () => {
    setGeo({ status: "idle", error: "", location: null });
    setToast("Standort entfernt");
    setOriginQuery("");
    setOriginResults([]);
  };

  const resetFilters = () => {
    setQuery("");
    setCountryFilter("all");
    setRegionFilter("all");
    setBudgetFilter("all");
    setProfileFilter("all");
    setSortBy("match");
    setMaxDriveHours("");
    setMinPisteKm("");
    setMaxPisteKm("");
    setBudgetMin(BUDGET_MIN);
    setBudgetMax(BUDGET_MAX);
    setBudgetFilterActive(false);
    setAprèsMin(0);
    setQuietMin(0);
    setToast("Filter zurückgesetzt");
  };

  const loadDemoResults = async () => {
    setShowDemoResults(true);
    setUsingExampleResults(true);
    setLoadingResults(true);
    setDataSourceError("");
    setMatchError(null);
    setResultMeta(null);
    resetResultFilters();
    try {
      localStorage.removeItem("alpivo_results_error");
    } catch {
      // ignore unavailable storage
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch("/api/resorts", { cache: "no-store", signal: controller.signal });
      const result = (await response.json().catch(() => null)) as ResortLoadResult<ResortSignalRow> | null;
      if (!response.ok || !result) throw new Error(result?.error || "Resorts konnten nicht geladen werden.");
      setResults(createExampleResults(result.resorts));
      setTotalResortCount(result.total);
      setUsingFallbackData(result.usingFallback);
      setDataSourceError(result.error ?? "");
    } catch (error) {
      const fallback = getMvpResorts();
      setResults(createExampleResults(fallback));
      setTotalResortCount(fallback.length);
      setUsingFallbackData(true);
      setDataSourceError(error instanceof Error ? error.message : "Resorts konnten nicht geladen werden.");
    } finally {
      window.clearTimeout(timeout);
      setLoadingResults(false);
    }
  };

  const applyFilters = () => {
    setToast("Filter angewendet");
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(
          buildResortQuery({
            query,
            countryFilter,
            regionFilter,
            budgetFilter,
            profileFilter,
            sortBy,
            maxDriveHours,
            minPisteKm,
            maxPisteKm,
            budgetMin,
            budgetMax,
            budgetFilterActive,
            apresMin,
            quietMin,
            originLat: geo.location?.lat ?? "",
            originLon: geo.location?.lon ?? "",
            originLabel: geo.location?.label ?? "",
          })
        )
      );
    } catch {
      // ignore unavailable client storage
    }
  }, [
    hydrated,
    query,
    countryFilter,
    regionFilter,
    budgetFilter,
    profileFilter,
    sortBy,
    maxDriveHours,
    minPisteKm,
    maxPisteKm,
    budgetMin,
    budgetMax,
    budgetFilterActive,
    apresMin,
    quietMin,
    geo.location,
  ]);

  useEffect(() => {
    const needle = originQuery.trim();
    if (!needle || needle.length < 2) {
      setOriginResults([]);
      setOriginLoading(false);
      return;
    }
    if (geo.location?.label && needle === geo.location.label) {
      setOriginResults([]);
      setOriginLoading(false);
      return;
    }

    let active = true;
    const handle = window.setTimeout(() => {
      setOriginLoading(true);
      fetch(`/api/geocode?q=${encodeURIComponent(needle)}`)
        .then(async (res) => {
          if (!res.ok) return { results: [] };
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          setOriginResults((data.results as GeocodeResult[]) ?? []);
        })
        .catch(() => {
          if (!active) return;
          setOriginResults([]);
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
  }, [originQuery, geo.location?.label]);

  useEffect(() => {
    const origin = geo.location;
    if (!origin) {
      setRouteMetrics({});
      setRouteStatus("idle");
      setRouteError("");
      return;
    }

    const destinations = results
      .filter((resort) => Number.isFinite(resort.lat) && Number.isFinite(resort.lon))
      .map((resort) => ({
        id: resort.id,
        lat: resort.lat as number,
        lon: resort.lon as number,
      }));

    if (destinations.length === 0) {
      setRouteMetrics({});
      setRouteStatus("ready");
      setRouteError("");
      return;
    }

    const controller = new AbortController();
    setRouteMetrics({});
    setRouteStatus("loading");
    setRouteError("");

    fetch("/api/routes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        origin: { lat: origin.lat, lon: origin.lon },
        destinations,
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Fahrzeiten konnten nicht berechnet werden.");
        return response.json();
      })
      .then((data: { routes: RouteMetric[]; note: string | null }) => {
        const next: Record<string, RouteMetric> = {};
        for (const route of data.routes ?? []) {
          next[route.id] = route;
        }
        setRouteMetrics(next);
        setRouteStatus("ready");
        setRouteError(data.note ?? "");
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setRouteMetrics({});
        setRouteStatus("error");
        setRouteError(err.message);
      });

    return () => controller.abort();
  }, [geo.location, results]);

  const selectOrigin = (result: GeocodeResult) => {
    setGeo({
      status: "ready",
      error: "",
      location: { lat: result.lat, lon: result.lon, label: result.label },
    });
    setOriginQuery(result.label);
    setOriginResults([]);
    setToast("Standort gesetzt");
  };

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc={heroContent.heroImage} heightClass="min-h-[320px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[300px] w-full max-w-6xl items-end px-4 pb-10 pt-12 md:px-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Matches</p>
            <h1 className="mt-4 max-w-[13ch] break-words text-3xl font-semibold leading-tight text-white sm:max-w-2xl md:text-4xl">
              {heroContent.title}
            </h1>
            <p className="mt-2 max-w-[30ch] text-sm text-white/75 sm:max-w-2xl">{heroContent.subtitle}</p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        {loadingResults ? (
          <GlassCard className="space-y-5 p-6 md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">Empfehlungen</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Resorts und Empfehlungen werden geladen ...</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Alpivo prüft gespeicherte Matches und bereitet passende Resortkarten vor.
              </p>
            </div>
            <ResultsSkeletonCards />
          </GlassCard>
        ) : showMatchErrorState ? (
          <GlassCard className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">Match konnte nicht geladen werden</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Die Ergebnisseite bleibt sichtbar, aber der letzte Match ist fehlgeschlagen.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {matchError?.message || "Der Match konnte gerade nicht berechnet werden."}
              {matchError?.status ? ` Status: ${matchError.status}.` : ""}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" href="/quiz">
                Erneut suchen
              </Link>
              <button
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                type="button"
                onClick={loadDemoResults}
              >
                Demo ansehen
              </button>
            </div>
          </GlassCard>
        ) : showNoMatchEmptyState ? (
          <>
            <GlassCard className="overflow-hidden p-0">
              <div className="grid gap-0 lg:grid-cols-[1fr_0.82fr]">
                <div className="p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">Persönlicher Match</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">Noch kein persönlicher Match vorhanden</h2>
                  <p className="mt-4 max-w-[19.5rem] break-words text-sm leading-7 text-slate-300 sm:max-w-2xl md:text-base">
                    Starte den Alpivo Match und erhalte passende Skigebiete inklusive Kosten, Anreise und Begründung.
                  </p>
                  {dataSourceError ? (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-100">{dataSourceError}</p>
                  ) : null}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-200 px-5 text-sm font-bold text-slate-950 hover:bg-white"
                      href="/quiz"
                    >
                      Match starten
                    </Link>
                    <button
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-5 text-sm font-semibold text-white hover:bg-white/10"
                      type="button"
                      onClick={loadDemoResults}
                    >
                      Demo ansehen
                    </button>
                  </div>
                </div>
                <div className="border-t border-white/10 bg-slate-950/34 p-6 lg:border-l lg:border-t-0 md:p-8">
                  <div className="rounded-2xl border border-sky-200/18 bg-sky-200/[0.08] p-5">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Beispiel</div>
                        <div className="mt-2 text-xl font-semibold text-white">Saalbach-Hinterglemm</div>
                        <div className="mt-1 text-sm text-slate-300">87% Fit · ca. 830 EUR p. P.</div>
                      </div>
                      <div className="rounded-2xl bg-sky-200 px-4 py-3 text-center text-slate-950">
                        <div className="text-2xl font-bold">87</div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.12em]">Score</div>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-200">
                      <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">Kurze Anreise</div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">Starkes Après-Ski</div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">Gute Schneesicherheit</div>
                    </div>
                    <div className="mt-3 rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-sm text-amber-50">
                      Warnhinweis: höhere Kosten in der Hauptsaison.
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid gap-4 md:grid-cols-3">
              {demoProfiles.map((profile) => (
                <article key={profile.title} className="rounded-2xl border border-white/10 bg-white/[0.065] p-5 shadow-[0_18px_54px_rgba(2,6,23,0.22)]">
                  <h3 className="text-lg font-semibold text-white">{profile.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{profile.text}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-sky-200/18 bg-sky-200/[0.08] px-2.5 py-1 text-xs text-sky-50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
        {sorted.length > 0 ? <PremiumResultsMoment resorts={sorted} /> : null}

        {sorted.length > 0 ? <AlpivoCompass results={sorted} totalResults={sorted.length} /> : null}

        {usingExampleResults ? (
          <GlassCard className="border-sky-200/20 bg-sky-200/[0.08] p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Demo-Modus</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Demo-Ergebnisse aktiv</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-200">
                  Diese Beispiel-Ergebnisse zeigen die Resortlogik mit neutralem Profil. Starte den Match für persönliche Empfehlungen.
                  {usingFallbackData ? " Fallback-Daten aktiv." : ""}
                </p>
              </div>
              <Link className="rounded-lg bg-sky-200 px-4 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-white" href="/quiz">
                Match personalisieren
              </Link>
            </div>
          </GlassCard>
        ) : null}

        <GlassCard className="interactive-card p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ergebnissteuerung</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Erst lesen, dann feinfiltern</h2>
                <p className="mt-2 max-w-[30ch] text-sm text-slate-300 sm:max-w-none">
                  Die Liste ist bereits sortiert. Nutze die Filter nur, wenn du eine klare Grenze setzen willst.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <button
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  type="button"
                  onClick={() => setShowAdvancedFilters((current) => !current)}
                >
                  {showAdvancedFilters ? "Filter reduzieren" : "Feinfilter öffnen"}
                </button>
                <Link className="rounded-xl border border-white/15 px-4 py-2 text-center text-sm text-white hover:bg-white/10" href="/quiz">
                  Match anpassen
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 sm:col-span-2 lg:col-span-1"
                placeholder="Ort, Region oder Resort suchen"
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
              <SelectControl
                value={regionFilter}
                ariaLabel="Region filtern"
                options={regions.map((region) => ({
                  value: region,
                  label: region === "all" ? "Alle Regionen" : region,
                }))}
                onChange={setRegionFilter}
              />
              <SelectControl
                value={budgetFilter}
                ariaLabel="Budget filtern"
                options={budgetOptions}
                onChange={setBudgetFilter}
              />
              <SelectControl
                value={profileFilter}
                ariaLabel="Fit filtern"
                options={profileOptions}
                onChange={setProfileFilter}
              />
            </div>

            {showAdvancedFilters ? (
              <>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <label className="text-xs text-slate-400">Sortierung</label>
                <SelectControl
                  className="mt-2"
                  compact
                  ariaLabel="Sortierung auswählen"
                  value={sortBy}
                  options={sortOptions}
                  onChange={(value) => setSortBy(value as SortKey)}
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <label className="text-xs text-slate-400">Max Fahrzeit (h)</label>
                <input
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  type="number"
                  step="0.25"
                  min="0"
                  value={maxDriveHours}
                  placeholder="z. B. 3.5"
                  onChange={(event) => setMaxDriveHours(event.target.value)}
                />
                <div className="mt-2 text-xs text-slate-400">Wird per Straßenroute nach gesetztem Standort berechnet.</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <label className="text-xs text-slate-400">Pistenkilometer min</label>
                <input
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  type="number"
                  placeholder="z. B. 40"
                  value={minPisteKm}
                  onChange={(event) => setMinPisteKm(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <label className="text-xs text-slate-400">Pistenkilometer max</label>
                <input
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  type="number"
                  placeholder="z. B. 200"
                  value={maxPisteKm}
                  onChange={(event) => setMaxPisteKm(event.target.value)}
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm md:col-span-2">
                <div className="text-xs text-slate-400">Budget pro Person</div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{budgetMin} EUR</span>
                  <span>{budgetMax} EUR</span>
                </div>
                <div className="mt-3">
                  <RangeSlider
                    min={BUDGET_MIN}
                    max={BUDGET_MAX}
                    step={BUDGET_STEP}
                    valueMin={budgetMin}
                    valueMax={budgetMax}
                    onChange={(nextMin, nextMax) => {
                      setBudgetMin(nextMin);
                      setBudgetMax(nextMax);
                      setBudgetFilterActive(true);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <label className="text-xs text-slate-400">Standort</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
                    onClick={requestLocation}
                  >
                    Standort nutzen
                  </button>
                  <button
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
                    onClick={applyFilters}
                  >
                    Filter anwenden
                  </button>
                  <button
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
                    onClick={clearLocation}
                  >
                    Zurücksetzen
                  </button>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                      placeholder="Ort oder Postleitzahl eingeben"
                      value={originQuery}
                      onChange={(event) => {
                        const next = event.target.value;
                        setOriginQuery(next);
                        if (geo.location && next !== geo.location.label) {
                          setGeo({ status: "idle", error: "", location: null });
                        }
                      }}
                    />
                    {originLoading ? (
                      <div className="absolute right-3 top-2 text-xs text-slate-400">Suche...</div>
                    ) : null}
                    {originResults.length > 0 ? (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950 text-sm shadow-lg">
                        {originResults.map((result) => (
                          <button
                            key={result.id}
                            className="block w-full px-3 py-2 text-left text-slate-200 hover:bg-white/10"
                            onClick={() => selectOrigin(result)}
                          >
                            <div className="font-medium text-white">{result.label}</div>
                            <div className="text-xs text-slate-400">{result.country}</div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {geo.status === "loading" ? (
                    <div className="mt-2 text-xs text-slate-400">Standort wird geladen...</div>
                  ) : null}
                  {geo.status === "error" ? <div className="mt-2 text-xs text-red-300">{geo.error}</div> : null}
                  {geo.location ? <div className="mt-2 text-xs text-slate-300">{geo.location.label}</div> : null}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Après-Ski</span>
                  <span>{apresMin}%</span>
                </div>
                <input
                  className="mt-2 w-full"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={apresMin}
                  onChange={(event) => setAprèsMin(Number(event.target.value))}
                />
                <div className="mt-2 text-xs text-slate-400">0 = egal, 100 = sehr wichtig</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Ruhe / wenig Andrang</span>
                  <span>{quietMin}%</span>
                </div>
                <input
                  className="mt-2 w-full"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={quietMin}
                  onChange={(event) => setQuietMin(Number(event.target.value))}
                />
                <div className="mt-2 text-xs text-slate-400">0 = egal, 100 = sehr wichtig</div>
              </div>
            </div>
              </>
            ) : (
              <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-4 text-sm text-slate-300 md:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Sortierung</div>
                  <div className="mt-1 font-semibold text-white">
                    {sortOptions.find((option) => option.value === sortBy)?.label ?? "Beste Passung"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Budget</div>
                  <div className="mt-1 font-semibold text-white">
                    {budgetFilterActive ? `${budgetMin} - ${budgetMax} EUR` : "kein harter Filter"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Startort</div>
                  <div className="mt-1 font-semibold text-white">{geo.location?.label ?? "offen"}</div>
                </div>
                <div className="flex items-center md:justify-end">
                  <button
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                    type="button"
                    onClick={() => setShowAdvancedFilters(true)}
                  >
                    Mehr steuern
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="text-xs text-slate-400">Ergebnisse</div>
              <div className="mt-2 text-sm text-slate-200">
                {number.format(sorted.length)} von {number.format(totalBasisCount)} Resorts nach Filterung. Sortiert nach{" "}
                {sortBy === "match"
                  ? "bester Passung"
                  : sortBy === "price_low"
                    ? "günstigster Schätzung"
                    : sortBy === "price_high"
                      ? "teuerster Schätzung"
                      : sortBy === "snow"
                        ? "bester Schneesicherheit"
                        : sortBy === "value"
                          ? "bestem Value"
                          : sortBy === "festival"
                            ? "Vibe & Events"
                          : sortBy === "summer"
                            ? "Sommer-Gletscher-Potenzial"
                            : sortBy === "offpiste"
                              ? "Off-Piste-Potenzial"
                          : "kürzester Fahrzeit"}
                .
              </div>
            <div className="mt-1 text-xs text-slate-400">
                Budget: {budgetMin} – {budgetMax} EUR pro Person · Personen: {peopleCount}
              </div>
              {!loadingResults && filteredOutCount > 0 ? (
                <div className="mt-1 text-xs text-slate-500">
                  {number.format(filteredOutCount)} Resorts ausgefiltert durch {activeFilterReasons || "aktive Filter"}.
                </div>
              ) : null}
              {usingFallbackData ? <div className="mt-1 text-xs text-amber-100">Fallback-Daten aktiv.</div> : null}
              {dataSourceError ? <div className="mt-1 text-xs text-amber-100">Datenhinweis: {dataSourceError}</div> : null}
              <div className="mt-1 text-xs text-slate-400">
                {geo.location
                  ? routeStatus === "loading"
                    ? "Straßen-Fahrzeiten werden berechnet..."
                    : routeStatus === "error"
                      ? `Routingfehler: ${routeError}`
                      : routeError || "Fahrzeiten basieren auf berechneten Straßenrouten."
                  : maxDriveHours
                    ? "Max-Fahrzeit ist gesetzt, wird aber erst angewendet, sobald ein Startort vorhanden ist."
                    : "Fahrzeitfilter und Route werden erst nach gesetztem Standort berechnet."}
              </div>
            </div>
        </GlassCard>

        {sorted[0] ? (
          <TravelConnectionPanel
            title="Anreise zum Top-Match"
            resortName={sorted[0].name}
            country={sorted[0].country}
            region={sorted[0].region}
            destinationLat={sorted[0].lat}
            destinationLon={sorted[0].lon}
            origin={geo.location}
            travelMode={travelPrefs.travelMode}
            tripStartDate={travelPrefs.tripStartDate}
            tripEndDate={travelPrefs.tripEndDate}
            roadDurationHours={sorted[0].driveHours}
            roadDistanceKm={sorted[0].distanceKm}
            routeSource={sorted[0].routeSource}
            compact
          />
        ) : null}

        <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-4 md:flex-row md:items-center">
              <div>
                <div className="text-sm font-semibold text-white">
                  {sorted.length === 0
                    ? "Keine passenden Resorts"
                    : `${number.format(visibleResults.length)} von ${number.format(sorted.length)} Resorts`}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Alpivo zeigt zuerst die stärksten Kandidaten. Weitere Resorts bleiben abrufbar.
                </div>
              </div>
              {sorted.length > 12 ? (
                <button
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  type="button"
                  onClick={() => setShowAllResults((current) => !current)}
                >
                  {showAllResults ? "Auf Top 12 reduzieren" : "Alle Ergebnisse zeigen"}
                </button>
              ) : null}
            </div>

            {visibleResults.map((r) => (
              <ResortDecisionCard
                key={r.id}
                resort={r}
                peopleCount={peopleCount}
                distanceKm={r.distanceKm}
                driveHours={r.driveHours}
                routeSource={r.routeSource}
                origin={geo.location}
              />
            ))}

            {sorted.length === 0 ? (
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold text-white">
                  {results.length > 0 ? "Keine Treffer mit diesen Filtern" : "Demo-Ergebnisse nicht verfügbar"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {results.length > 0
                    ? "Lockere Suche, Budget oder Fit-Filter, damit Alpivo wieder passende Resorts anzeigen kann."
                    : "Die Demo-Daten konnten gerade nicht vorbereitet werden. Starte den Match oder versuche die Demo erneut."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {results.length > 0 ? (
                    <button className="rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" onClick={resetFilters}>
                      Filter zurücksetzen
                    </button>
                  ) : (
                    <button className="rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" onClick={loadDemoResults}>
                      Demo erneut laden
                    </button>
                  )}
                  <Link className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href="/quiz">
                    Match starten
                  </Link>
                </div>
              </GlassCard>
            ) : null}
            {excludedResults.length > 0 ? (
              <GlassCard className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Harte Ausschlüsse</p>
                    <h2 className="mt-2 text-lg font-semibold text-white">
                      {excludedResults.length} Resorts bewusst ausgeblendet
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-slate-300">
                      Diese Gebiete passen eventuell vom Score, wurden aber durch deine Ausschlusskriterien aus der Hauptliste entfernt.
                    </p>
                  </div>
                  <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="/quiz">
                    Ausschlüsse ändern
                  </Link>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {excludedResults.slice(0, 6).map((resort) => (
                    <div key={resort.id} className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-sm">
                      <div className="font-semibold text-white">{resort.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{resort.country}</div>
                      <div className="mt-2 text-xs text-red-100">
                        Ausgeschlossen wegen: {resort.exclusionReasons.join(" / ") || "Ausschlusskriterium"}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ) : null}
        </div>
          </>
        )}

        <AnimatePresence>{toast ? <Toast message={toast} /> : null}</AnimatePresence>
      </Section>
    </div>
  );
}
