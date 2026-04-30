"use client";

/* eslint-disable react-hooks/set-state-in-effect */

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
import SelectControl from "@/components/SelectControl";
import TravelConnectionPanel, { type TravelMode } from "@/components/TravelConnectionPanel";
import { deriveResortDecision, type MatchPreferences, type ResortDecision } from "@/lib/resortSignals";
import { getMvpResorts } from "@/lib/mvpResorts";
import { useSiteContent } from "@/lib/useSiteContent";

type Result = ResortDecision;

type SortKey = "match" | "price_low" | "price_high" | "drive_time" | "snow" | "value" | "summer" | "offpiste";

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
  budgetMin: 250,
  budgetMax: 500,
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
  foodSpendLevel: "standard",
  rentalMode: "own",
  travelMode: "car",
};

const BUDGET_MIN = 150;
const BUDGET_MAX = 900;
const BUDGET_STEP = 25;

function createExampleResults() {
  return getMvpResorts(35)
    .map((resort) => deriveResortDecision(resort, EXAMPLE_PREFS))
    .sort((a, b) => b.matchPct - a.matchPct)
    .slice(0, 18);
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
  { value: "glacier", label: "Sommer-Gletscher" },
  { value: "offpiste", label: "Off-Piste" },
];

const sortOptions: Array<{ value: SortKey; label: string; description: string }> = [
  { value: "match", label: "Beste Passung", description: "Score, Pistenprofil und Fit" },
  { value: "price_low", label: "Günstigste Schätzung", description: "niedrigster Kostenrahmen" },
  { value: "price_high", label: "Teuerste Schätzung", description: "höchster Kostenrahmen" },
  { value: "drive_time", label: "Kürzeste Fahrzeit", description: "nach gesetztem Startort" },
  { value: "snow", label: "Beste Schneesicherheit" },
  { value: "value", label: "Bester Value" },
  { value: "summer", label: "Sommer-Gletscher" },
  { value: "offpiste", label: "Off-Piste Potenzial" },
];

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
  const [results, setResults] = useState<Result[]>(() => createExampleResults());
  const [excludedResults, setExcludedResults] = useState<Result[]>([]);

  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("match");
  const [maxDriveHours, setMaxDriveHours] = useState("");
  const [minPisteKm, setMinPisteKm] = useState("");
  const [maxPisteKm, setMaxPisteKm] = useState("");
  const [budgetMin, setBudgetMin] = useState(250);
  const [budgetMax, setBudgetMax] = useState(450);
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

  useEffect(() => {
    const raw = sessionStorage.getItem("ski_results");
    const excluded = localStorage.getItem("alpivo_excluded_results");
    if (excluded) setExcludedResults(JSON.parse(excluded) as Result[]);
    if (raw) {
      setResults(JSON.parse(raw) as Result[]);
      setUsingExampleResults(false);
      return;
    }
    const cached = localStorage.getItem("alpivo_results");
    if (cached) {
      setResults(JSON.parse(cached) as Result[]);
      setUsingExampleResults(false);
      return;
    }

    setResults(createExampleResults());
    setQuery("");
    setCountryFilter("all");
    setRegionFilter("all");
    setBudgetFilter("all");
    setProfileFilter("all");
    setMinPisteKm("");
    setMaxPisteKm("");
    setMaxDriveHours("");
    setBudgetMin(250);
    setBudgetMax(500);
    setUsingExampleResults(true);
  }, []);

  useEffect(() => {
    const rawPrefs = localStorage.getItem("alpivo_quiz_prefs");
    if (rawPrefs) {
      try {
        const saved = JSON.parse(rawPrefs) as {
          budgetMin: number;
          budgetMax: number;
          budget: number;
          peopleCount: number;
          travelMode: string;
          tripStartDate: string | null;
          tripEndDate: string | null;
        };
        if (typeof saved.budgetMin === "number") setBudgetMin(saved.budgetMin);
        if (typeof saved.budgetMax === "number") setBudgetMax(saved.budgetMax);
        if (typeof saved.budget === "number" && typeof saved.budgetMax !== "number") setBudgetMax(saved.budget);
        if (typeof saved.peopleCount === "number") setPeopleCount(saved.peopleCount);
        const travelMode =
          saved.travelMode === "train" || saved.travelMode === "bus" || saved.travelMode === "flight"
            ? saved.travelMode
            : "car";
        setTravelPrefs({
          travelMode,
          tripStartDate: saved.tripStartDate ?? null,
          tripEndDate: saved.tripEndDate ?? null,
        });
      } catch {
        // ignore invalid storage
      }
    }

    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const saved = JSON.parse(raw) as Partial<Record<string, string>>;
      if (saved.query) setQuery(saved.query);
      if (saved.countryFilter) setCountryFilter(saved.countryFilter);
      if (!saved.countryFilter && (saved as { country: string }).country) {
        setCountryFilter((saved as { country: string }).country ?? "all");
      }
      if (saved.regionFilter) setRegionFilter(saved.regionFilter);
      if (saved.budgetFilter) setBudgetFilter(saved.budgetFilter);
      if (saved.profileFilter) setProfileFilter(saved.profileFilter);
      if (saved.sortBy) setSortBy(saved.sortBy === "distance" ? "drive_time" : (saved.sortBy as SortKey));
      if (saved.maxDriveHours) setMaxDriveHours(saved.maxDriveHours);
      if (saved.maxPisteKm !== undefined) setMaxPisteKm(saved.maxPisteKm);
      if (saved.minPisteKm) setMinPisteKm(saved.minPisteKm);
      if (saved.apresMin !== undefined) setAprèsMin(Number(saved.apresMin));
      if (saved.quietMin !== undefined) setQuietMin(Number(saved.quietMin));
      if (saved.budgetMin !== undefined) setBudgetMin(Number(saved.budgetMin));
      if (saved.budgetMax !== undefined) setBudgetMax(Number(saved.budgetMax));
      if (saved.originLat && saved.originLon) {
        setGeo({
          status: "ready",
          error: "",
          location: {
            lat: Number(saved.originLat),
            lon: Number(saved.originLon),
            label: saved.originLabel ?? "Gespeicherter Standort",
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

    const maxBudget = Math.max(budgetMin, budgetMax);

    return enriched.filter((r) => {
      if (countryFilter !== "all" && r.country !== countryFilter) return false;
      if (regionFilter !== "all" && r.region !== regionFilter) return false;
      if (budgetFilter !== "all" && r.budgetStatus !== budgetFilter) return false;
      if (profileFilter === "snow" && (r.fitProfile.snow ?? r.snowReliability ?? 0) < 0.62) return false;
      if (profileFilter === "value" && (r.fitProfile.value ?? r.valueScore ?? 0) < 0.58) return false;
      if (profileFilter === "comfort" && (r.fitProfile.comfort 0) < 0.55) return false;
      if (profileFilter === "sport" && (r.fitProfile.slope 0) < 0.6) return false;
      if (profileFilter === "vibe" && (r.fitProfile.vibe 0) < 0.6) return false;
      if (profileFilter === "glacier" && (r.summerGlacierScore r.fitProfile.summer 0) < 0.58) return false;
      if (profileFilter === "offpiste" && (r.fitProfile.offPiste 0) < 0.58) return false;
      if (needle) {
        const haystack =
          `${r.name} ${r.country} ${r.region ""} ${r.vibeTags.map((tag) => tag.label).join(" ") ""} ${r.bestFor.join(" ") ""}`.toLowerCase();
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
        const quietScore = r.crowdScore == null null : 1 - r.crowdScore;
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
        const pisteA = a.pisteKm 0;
        const pisteB = b.pisteKm 0;
        if (pisteB !== pisteA) return pisteB - pisteA;
        return a.name.localeCompare(b.name, "de-DE");
      }
      if (sortBy === "price_low") return a.cost.totalMax - b.cost.totalMax;
      if (sortBy === "price_high") return b.cost.totalMax - a.cost.totalMax;
      if (sortBy === "snow") return (b.fitProfile.snow b.snowReliability 0) - (a.fitProfile.snow a.snowReliability 0);
      if (sortBy === "value") return (b.fitProfile.value b.valueScore 0) - (a.fitProfile.value a.valueScore 0);
      if (sortBy === "summer") return (b.summerGlacierScore b.fitProfile.summer 0) - (a.summerGlacierScore a.fitProfile.summer 0);
      if (sortBy === "offpiste") return (b.fitProfile.offPiste 0) - (a.fitProfile.offPiste 0);
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

  const visibleResults = useMemo(() => (showAllResults sorted : sorted.slice(0, 12)), [showAllResults, sorted]);

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
          const res = await fetch(`/api/geocode/reverselat=${lat}&lon=${lon}`);
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
    setAprèsMin(0);
    setQuietMin(0);
    setToast("Filter zurückgesetzt");
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
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({
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
        apresMin,
        quietMin,
        originLat: geo.location.lat "",
        originLon: geo.location.lon "",
        originLabel: geo.location.label "",
      })
    );
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
    if (geo.location.label && needle === geo.location.label) {
      setOriginResults([]);
      setOriginLoading(false);
      return;
    }

    let active = true;
    const handle = window.setTimeout(() => {
      setOriginLoading(true);
      fetch(`/api/geocodeq=${encodeURIComponent(needle)}`)
        .then(async (res) => {
          if (!res.ok) return { results: [] };
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          setOriginResults((data.results as GeocodeResult[]) []);
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
  }, [originQuery, geo.location.label]);

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
        for (const route of data.routes []) {
          next[route.id] = route;
        }
        setRouteMetrics(next);
        setRouteStatus("ready");
        setRouteError(data.note "");
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
        <AlpivoCompass results={sorted} totalResults={sorted.length} />

        {usingExampleResults (
          <GlassCard className="border-sky-200/20 bg-sky-200/[0.08] p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Beispiel-Ergebnisse</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Noch kein persönlicher Match berechnet</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-200">
                  Damit die Ergebnisseite nicht leer wirkt, zeigt Alpivo hier einen neutralen Balanced-Match aus kuratierten MVP-Resorts.
                  Starte den Fragebogen, um Budget, Reiseart und Ausschlüsse auf dich anzupassen.
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
                  {showAdvancedFilters "Filter reduzieren" : "Feinfilter öffnen"}
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
                  label: country === "all" "Alle Länder" : country,
                }))}
                onChange={setCountryFilter}
              />
              <SelectControl
                value={regionFilter}
                ariaLabel="Region filtern"
                options={regions.map((region) => ({
                  value: region,
                  label: region === "all" "Alle Regionen" : region,
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

            {showAdvancedFilters (
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
                    {originLoading (
                      <div className="absolute right-3 top-2 text-xs text-slate-400">Suche...</div>
                    ) : null}
                    {originResults.length > 0 (
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
                  {geo.status === "loading" (
                    <div className="mt-2 text-xs text-slate-400">Standort wird geladen...</div>
                  ) : null}
                  {geo.status === "error" <div className="mt-2 text-xs text-red-300">{geo.error}</div> : null}
                  {geo.location <div className="mt-2 text-xs text-slate-300">{geo.location.label}</div> : null}
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
                    {sortOptions.find((option) => option.value === sortBy).label "Beste Passung"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Budget</div>
                  <div className="mt-1 font-semibold text-white">{budgetMin} - {budgetMax} EUR</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Startort</div>
                  <div className="mt-1 font-semibold text-white">{geo.location.label "offen"}</div>
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
                {sorted.length} Resorts nach Filterung. Sortiert nach{" "}
                {sortBy === "match"
                  "bester Passung"
                  : sortBy === "price_low"
                    "günstigster Schätzung"
                    : sortBy === "price_high"
                      "teuerster Schätzung"
                      : sortBy === "snow"
                        "bester Schneesicherheit"
                        : sortBy === "value"
                          "bestem Value"
                          : sortBy === "summer"
                            "Sommer-Gletscher-Potenzial"
                            : sortBy === "offpiste"
                              "Off-Piste-Potenzial"
                          : "kürzester Fahrzeit"}
                .
              </div>
            <div className="mt-1 text-xs text-slate-400">
                Budget: {budgetMin} – {budgetMax} EUR pro Person · Personen: {peopleCount}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {geo.location
                  routeStatus === "loading"
                    "Straßen-Fahrzeiten werden berechnet..."
                    : routeStatus === "error"
                      `Routingfehler: ${routeError}`
                      : routeError || "Fahrzeiten basieren auf berechneten Straßenrouten."
                  : maxDriveHours
                    "Max-Fahrzeit ist gesetzt, wird aber erst angewendet, sobald ein Startort vorhanden ist."
                    : "Fahrzeitfilter und Route werden erst nach gesetztem Standort berechnet."}
              </div>
            </div>
        </GlassCard>

        {sorted[0] (
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
                  {sorted.length === 0 "Keine passenden Resorts" : `${visibleResults.length} von ${sorted.length} Resorts`}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Alpivo zeigt zuerst die stärksten Kandidaten. Weitere Resorts bleiben abrufbar.
                </div>
              </div>
              {sorted.length > 12 (
                <button
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  type="button"
                  onClick={() => setShowAllResults((current) => !current)}
                >
                  {showAllResults "Auf Top 12 reduzieren" : "Alle Ergebnisse zeigen"}
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

            {sorted.length === 0 (
              <GlassCard className="p-6">
                {results.length > 0
                  "Keine Resorts nach den aktuellen Filtern. Bitte Filter lockern oder zurücksetzen."
                  : "Keine Ergebnisse gespeichert. Bitte starte den Match neu."}
                <div className="mt-3 flex flex-wrap gap-3">
                  {results.length > 0 (
                    <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950" onClick={resetFilters}>
                      Filter zurücksetzen
                    </button>
                  ) : null}
                  <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="/quiz">
                    Zum Match
                  </Link>
                </div>
              </GlassCard>
            ) : null}
            {excludedResults.length > 0 (
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

        <AnimatePresence>{toast <Toast message={toast} /> : null}</AnimatePresence>
      </Section>
    </div>
  );
}
