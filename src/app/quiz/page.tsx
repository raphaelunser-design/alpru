"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { brand } from "@/config/brand";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import RangeSlider from "@/components/RangeSlider";
import SelectControl from "@/components/SelectControl";
import { alpivoDayPickerClassNames, alpivoDayPickerLocale } from "@/lib/alpivoDayPicker";
import { supabase } from "@/lib/supabase";
import type { TripStyle } from "@/lib/resortSignals";
import { useSiteContent } from "@/lib/useSiteContent";

type Prefs = {
  tripStyle: TripStyle;
  tripStartDate: string | null;
  tripEndDate: string | null;
  budgetMin: number;
  budgetMax: number;
  peopleCount: number;
  apres: number;
  emptySlopes: number;
  infrastructure: number;
  huts: number;
  snowpark: number;
  easyRuns: number;
  challenging: number;
  snowReliability: number;
  valueForMoney: number;
  family: number;
  panorama: number;
  summerGlacier: number;
  offPiste: number;
  foodSpendLevel: "budget" | "standard" | "comfort";
  rentalMode: "own" | "rent";
  travelMode: "car" | "train" | "bus" | "flight";
  excludeCountries: string[];
  excludeGlacier: boolean;
  excludePremium: boolean;
  excludeFamilyOnly: boolean;
};

type Prefilters = {
  countryFilter: string;
  minPisteKm: string;
  maxDriveHours: string;
};

const STORAGE_KEY = "alpivo_quiz_prefs";
const FILTER_STORAGE_KEY = "alpivo_results_filters";
const RESULTS_STORAGE_KEY = "alpivo_results";

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

const ALPINE_COUNTRIES_DE = [
  "all",
  "Österreich",
  "Schweiz",
  "Deutschland",
  "Frankreich",
  "Italien",
  "Liechtenstein",
  "Monaco",
  "Slowenien",
];

const countryOptions = ALPINE_COUNTRIES_DE.map((country) => ({
  value: country,
  label: country === "all" ? "Alle Länder" : country,
}));

const defaultPrefs: Prefs = {
  tripStyle: "balanced",
  tripStartDate: null,
  tripEndDate: null,
  budgetMin: 250,
  budgetMax: 450,
  peopleCount: 2,
  apres: 3,
  emptySlopes: 3,
  infrastructure: 3,
  huts: 3,
  snowpark: 2,
  easyRuns: 3,
  challenging: 2,
  snowReliability: 3,
  valueForMoney: 3,
  family: 2,
  panorama: 3,
  summerGlacier: 0,
  offPiste: 0,
  foodSpendLevel: "standard",
  rentalMode: "own",
  travelMode: "car",
  excludeCountries: [],
  excludeGlacier: false,
  excludePremium: false,
  excludeFamilyOnly: false,
};

const BUDGET_MIN = 150;
const BUDGET_MAX = 900;
const BUDGET_STEP = 25;
const exclusionCountryOptions = ["Frankreich", "Schweiz", "Österreich", "Italien", "Deutschland"];

const tripProfiles: Array<{
  id: TripStyle;
  title: string;
  subtitle: string;
  tags: string[];
  prefs: Partial<Prefs>;
  filters: Partial<Prefilters>;
}> = [
  {
    id: "budget",
    title: "Smart Budget",
    subtitle: "Viel Skitag pro Euro, gute Value-Signale, kein Luxus-Fokus.",
    tags: ["Value", "kurz", "clever"],
    prefs: {
      budgetMin: 150,
      budgetMax: 320,
      apres: 2,
      emptySlopes: 3,
      infrastructure: 3,
      huts: 2,
      easyRuns: 3,
      challenging: 2,
      snowReliability: 3,
      valueForMoney: 5,
      family: 2,
      panorama: 2,
    },
    filters: { minPisteKm: "10" },
  },
  {
    id: "apres",
    title: "Après & Crew",
    subtitle: "Energie, Hütten, Gruppen-Vibe und genug Pisten für ein Wochenende.",
    tags: ["Party", "Gruppe", "Hütten"],
    prefs: {
      budgetMin: 250,
      budgetMax: 550,
      apres: 5,
      emptySlopes: 1,
      infrastructure: 4,
      huts: 5,
      easyRuns: 2,
      challenging: 3,
      snowReliability: 3,
      valueForMoney: 2,
      family: 1,
      panorama: 3,
    },
    filters: { minPisteKm: "35" },
  },
  {
    id: "family",
    title: "Family Calm",
    subtitle: "Einfachere Pisten, weniger Stress, gute Infrastruktur und planbare Kosten.",
    tags: ["Familie", "easy", "ruhiger"],
    prefs: {
      budgetMin: 220,
      budgetMax: 480,
      apres: 1,
      emptySlopes: 5,
      infrastructure: 4,
      huts: 3,
      snowpark: 1,
      easyRuns: 5,
      challenging: 1,
      snowReliability: 3,
      valueForMoney: 4,
      family: 5,
      panorama: 3,
    },
    filters: { minPisteKm: "8" },
  },
  {
    id: "sport",
    title: "Big Mountain",
    subtitle: "Mehr Pisten, sportliches Profil, moderne Lifte und Höhenlage.",
    tags: ["sportlich", "groß", "schnell"],
    prefs: {
      budgetMin: 320,
      budgetMax: 750,
      apres: 2,
      emptySlopes: 3,
      infrastructure: 5,
      huts: 3,
      snowpark: 3,
      easyRuns: 2,
      challenging: 5,
      snowReliability: 5,
      valueForMoney: 3,
      family: 1,
      panorama: 4,
    },
    filters: { minPisteKm: "80" },
  },
  {
    id: "premium",
    title: "Premium Alpine",
    subtitle: "Panorama, starke Infrastruktur, Hütten und schneesichere Höhenlage.",
    tags: ["premium", "panorama", "komfort"],
    prefs: {
      budgetMin: 450,
      budgetMax: 900,
      apres: 3,
      emptySlopes: 3,
      infrastructure: 5,
      huts: 5,
      snowpark: 2,
      easyRuns: 3,
      challenging: 4,
      snowReliability: 5,
      valueForMoney: 1,
      family: 2,
      panorama: 5,
    },
    filters: { minPisteKm: "50" },
  },
  {
    id: "quiet",
    title: "Quiet Escape",
    subtitle: "Ruhiger Alpen-Vibe, schöne Lage und weniger Trubel.",
    tags: ["ruhig", "paar", "natur"],
    prefs: {
      budgetMin: 220,
      budgetMax: 520,
      apres: 0,
      emptySlopes: 5,
      infrastructure: 3,
      huts: 4,
      snowpark: 0,
      easyRuns: 4,
      challenging: 2,
      snowReliability: 4,
      valueForMoney: 3,
      family: 3,
      panorama: 5,
    },
    filters: { minPisteKm: "8" },
  },
  {
    id: "glacier",
    title: "Summer Glacier",
    subtitle: "Hohe Lage, Gletscher-Signale und Resorts, bei denen Sommer-Ski realistischer ist.",
    tags: ["Gletscher", "Sommer", "Schnee"],
    prefs: {
      budgetMin: 280,
      budgetMax: 760,
      apres: 1,
      emptySlopes: 3,
      infrastructure: 4,
      huts: 3,
      snowpark: 2,
      easyRuns: 2,
      challenging: 3,
      snowReliability: 5,
      valueForMoney: 2,
      family: 1,
      panorama: 4,
      summerGlacier: 5,
    },
    filters: { minPisteKm: "10" },
  },
  {
    id: "offpiste",
    title: "Off-Piste Finder",
    subtitle: "Höhenlage, sportliches Gelände, Schnee und weniger Andrang für Fahrer abseits der Standardpiste.",
    tags: ["freeride", "sportlich", "schnee"],
    prefs: {
      budgetMin: 320,
      budgetMax: 760,
      apres: 1,
      emptySlopes: 4,
      infrastructure: 3,
      huts: 2,
      snowpark: 3,
      easyRuns: 1,
      challenging: 5,
      snowReliability: 5,
      valueForMoney: 2,
      family: 0,
      panorama: 4,
      offPiste: 5,
    },
    filters: { minPisteKm: "25" },
  },
];

function SliderRow(props: { label: string; hint?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-white">{props.label}</div>
          {props.hint ? <div className="mt-1 text-xs text-slate-400">{props.hint}</div> : null}
        </div>
        <div className="text-sm text-slate-300">{props.value}/5</div>
      </div>

      <input
        className="mt-3 w-full"
        type="range"
        min={0}
        max={5}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />

      <div className="mt-1 flex justify-between text-[11px] text-slate-300">
        <span>egal</span>
        <span>wichtig</span>
      </div>
    </div>
  );
}

function signalLabel(value: number) {
  if (value >= 5) return "max";
  if (value >= 4) return "hoch";
  if (value >= 2) return "mittel";
  return "egal";
}

function parseIsoDate(value: string | null) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function QuizPage() {
  const router = useRouter();
  const { value: heroContent } = useSiteContent("quiz", {
    title: `Dein ${brand.shortName} Match`,
    subtitle: "Stell kurz ein, was dir wichtig ist. Du bekommst eine Top-Liste mit groben Kosten und Gründen.",
    heroImage: "/bg/banner-bild-4k.png",
  });

  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [prefilters, setPrefilters] = useState<Prefilters>({
    countryFilter: "all",
    minPisteKm: "",
    maxDriveHours: "",
  });
  const [hydrated, setHydrated] = useState(false);
  const [showFineTuning, setShowFineTuning] = useState(false);
  const [dnaStatus, setDnaStatus] = useState<"idle" | "loading" | "saved" | "local" | "error">("idle");
  const [dnaMessage, setDnaMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const rawPrefs = localStorage.getItem(STORAGE_KEY);
    if (rawPrefs) {
      try {
        const saved = JSON.parse(rawPrefs) as Partial<Prefs> & { needRental: boolean; budget: number };
        const rentalMode =
          typeof saved.rentalMode === "string"
            ? saved.rentalMode === "rent"
              ? "rent"
              : "own"
            : saved.needRental
              ? "rent"
              : "own";

        const travelMode =
          saved.travelMode === "train" || saved.travelMode === "bus" || saved.travelMode === "flight"
            ? saved.travelMode
            : "car";

        const budgetMin = Number(saved.budgetMin ?? defaultPrefs.budgetMin);
        const budgetMax = Number(saved.budgetMax ?? saved.budget ?? defaultPrefs.budgetMax);

        const nextPrefs: Prefs = {
          ...defaultPrefs,
          ...saved,
          tripStyle:
            saved.tripStyle === "budget" ||
            saved.tripStyle === "apres" ||
            saved.tripStyle === "family" ||
            saved.tripStyle === "sport" ||
            saved.tripStyle === "premium" ||
            saved.tripStyle === "quiet" ||
            saved.tripStyle === "powder" ||
            saved.tripStyle === "glacier" ||
            saved.tripStyle === "offpiste"
              ? saved.tripStyle
              : "balanced",
          budgetMin,
          budgetMax,
          peopleCount: Number(saved.peopleCount ?? defaultPrefs.peopleCount),
          apres: Number(saved.apres ?? defaultPrefs.apres),
          emptySlopes: Number(saved.emptySlopes ?? defaultPrefs.emptySlopes),
          infrastructure: Number(saved.infrastructure ?? defaultPrefs.infrastructure),
          huts: Number(saved.huts ?? defaultPrefs.huts),
          snowpark: Number(saved.snowpark ?? defaultPrefs.snowpark),
          easyRuns: Number(saved.easyRuns ?? defaultPrefs.easyRuns),
          challenging: Number(saved.challenging ?? defaultPrefs.challenging),
          snowReliability: Number(saved.snowReliability ?? defaultPrefs.snowReliability),
          valueForMoney: Number(saved.valueForMoney ?? defaultPrefs.valueForMoney),
          family: Number(saved.family ?? defaultPrefs.family),
          panorama: Number(saved.panorama ?? defaultPrefs.panorama),
          summerGlacier: Number(saved.summerGlacier ?? defaultPrefs.summerGlacier),
          offPiste: Number(saved.offPiste ?? defaultPrefs.offPiste),
          foodSpendLevel:
            saved.foodSpendLevel === "budget" || saved.foodSpendLevel === "comfort" || saved.foodSpendLevel === "standard"
              ? saved.foodSpendLevel
              : "standard",
          tripStartDate: saved.tripStartDate ?? null,
          tripEndDate: saved.tripEndDate ?? null,
          rentalMode,
          travelMode,
          excludeCountries: Array.isArray(saved.excludeCountries)
            ? saved.excludeCountries.filter((entry): entry is string => typeof entry === "string")
            : [],
          excludeGlacier: Boolean(saved.excludeGlacier),
          excludePremium: Boolean(saved.excludePremium),
          excludeFamilyOnly: Boolean(saved.excludeFamilyOnly),
        };
        setPrefs(nextPrefs);

        const from = parseIsoDate(nextPrefs.tripStartDate);
        const to = parseIsoDate(nextPrefs.tripEndDate);
        if (from || to) {
          setDateRange({ from, to });
        }
      } catch {
        // ignore invalid storage
      }
    }

    const rawFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (rawFilters) {
      try {
        const saved = JSON.parse(rawFilters) as Partial<Prefilters> & { country: string };
        setPrefilters({
          countryFilter: saved.countryFilter ?? saved.country ?? "all",
          minPisteKm: saved.minPisteKm ?? "",
          maxDriveHours: saved.maxDriveHours ?? "",
        });
      } catch {
        // ignore invalid storage
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      const nextUserId = data.user?.id ?? null;
      setUserId(nextUserId);
      if (!nextUserId) return;

      const { data: saved, error } = await supabase
        .from("profile_preferences")
        .select("preferences,filters,updated_at")
        .eq("user_id", nextUserId)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setDnaStatus("local");
        setDnaMessage("DNA ist lokal gespeichert. Supabase-Profil konnte nicht geladen werden.");
        return;
      }
      if (!saved?.preferences) return;

      const nextPrefs = { ...defaultPrefs, ...(saved.preferences as Partial<Prefs>) };
      setPrefs(nextPrefs);
      const from = parseIsoDate(nextPrefs.tripStartDate);
      const to = parseIsoDate(nextPrefs.tripEndDate);
      setDateRange(from || to ? { from, to } : undefined);
      if (saved?.filters && typeof saved.filters === "object") {
        setPrefilters((current) => ({ ...current, ...(saved.filters as Partial<Prefilters>) }));
      }
      setDnaStatus("saved");
      setDnaMessage("Gespeicherte Alpivo DNA aus deinem Profil geladen.");
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    if (dnaStatus === "saved") return;
    setDnaStatus(userId ? "local" : "idle");
  }, [prefs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const existing = localStorage.getItem(FILTER_STORAGE_KEY);
    let originFields = {};
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as Record<string, unknown>;
        originFields = {
          originLat: parsed.originLat ?? "",
          originLon: parsed.originLon ?? "",
          originLabel: parsed.originLabel ?? "",
        };
      } catch {
        // ignore invalid storage
      }
    }
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({
        ...originFields,
        query: "",
        countryFilter: prefilters.countryFilter,
        regionFilter: "all",
        budgetFilter: "all",
        profileFilter: "all",
        sortBy: "match",
        maxDriveHours: prefilters.maxDriveHours,
        minPisteKm: prefilters.minPisteKm,
        maxPisteKm: "",
        apresMin: "0",
        quietMin: "0",
      })
    );
  }, [prefilters, hydrated]);

  async function onSubmit() {
    const existingFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    let originFields = {};
    if (existingFilters) {
      try {
        const parsed = JSON.parse(existingFilters) as Record<string, unknown>;
        originFields = {
          originLat: parsed.originLat ?? "",
          originLon: parsed.originLon ?? "",
          originLabel: parsed.originLabel ?? "",
        };
      } catch {
        // ignore invalid storage
      }
    }
    const mergedFilters = {
      ...originFields,
      query: "",
      countryFilter: prefilters.countryFilter,
      regionFilter: "all",
      budgetFilter: "all",
      profileFilter: "all",
      sortBy: "match",
      maxDriveHours: prefilters.maxDriveHours,
      minPisteKm: prefilters.minPisteKm,
      maxPisteKm: "",
      apresMin: "0",
      quietMin: "0",
      budgetMin: String(prefs.budgetMin),
      budgetMax: String(prefs.budgetMax),
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(mergedFilters));

    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(prefs),
    });

    const data = await res.json();
    if (!res.ok) {
      alert("Fehler beim Matching");
      return;
    }

    sessionStorage.setItem("ski_results", JSON.stringify(data.results));
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(data.results));
    localStorage.setItem("alpivo_excluded_results", JSON.stringify(data.excluded ?? []));
    router.push("/results");
  }

  async function saveDnaToProfile() {
    if (!userId) {
      setDnaStatus("error");
      setDnaMessage("Bitte einloggen, damit Alpivo deine DNA dauerhaft im Profil speichern kann.");
      return;
    }
    setDnaStatus("loading");
    setDnaMessage("DNA wird gespeichert...");

    const { error } = await supabase.from("profile_preferences").upsert(
      {
        user_id: userId,
        preferences: prefs,
        filters: prefilters,
        exclusions: {
          excludeCountries: prefs.excludeCountries,
          excludeGlacier: prefs.excludeGlacier,
          excludePremium: prefs.excludePremium,
          excludeFamilyOnly: prefs.excludeFamilyOnly,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      setDnaStatus("error");
      setDnaMessage(error.message);
      return;
    }

    setDnaStatus("saved");
    setDnaMessage("Alpivo DNA dauerhaft im Profil gespeichert.");
  }

  function applyTripProfile(profile: (typeof tripProfiles)[number]) {
    setPrefs((prev) => ({ ...prev, ...profile.prefs, tripStyle: profile.id }));
    if (profile.filters) {
      setPrefilters((prev) => ({ ...prev, ...profile.filters }));
    }
  }

  const rangeSummary = useMemo(() => {
    if (!dateRange?.from) return "Kein Datum gewählt";
    const fromLabel = dateFormatter.format(dateRange.from);
    if (!dateRange.to) return `${fromLabel} – ...`;
    return `${fromLabel} – ${dateFormatter.format(dateRange.to)}`;
  }, [dateRange]);

  const rangeDays = useMemo(() => {
    if (!dateRange?.from || !dateRange.to) return null;
    const diffMs = dateRange.to.getTime() - dateRange.from.getTime();
    const days = Math.max(1, Math.round(diffMs / 86400000) + 1);
    return days;
  }, [dateRange]);

  const tripDna = useMemo(
    () => [
      { label: "Value", value: prefs.valueForMoney },
      { label: "Schnee", value: prefs.snowReliability },
      { label: "Vibe", value: Math.max(prefs.apres, prefs.huts, prefs.panorama) },
      { label: "Ruhe", value: prefs.emptySlopes },
      { label: "Sport", value: prefs.challenging },
      { label: "Easy", value: Math.max(prefs.easyRuns, prefs.family) },
      { label: "Gletscher", value: prefs.summerGlacier },
      { label: "Off-Piste", value: prefs.offPiste },
    ],
    [prefs]
  );

  const activeProfile = tripProfiles.find((profile) => profile.id === prefs.tripStyle);

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc={heroContent.heroImage} heightClass="min-h-[300px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[260px] w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-12 md:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Match</p>
          <h1 className="mt-4 max-w-[13ch] break-words text-3xl font-semibold leading-tight text-white sm:max-w-2xl md:text-4xl">
            {heroContent.title}
          </h1>
          <p className="mt-2 max-w-[30ch] text-sm text-white/75 sm:max-w-2xl">{heroContent.subtitle}</p>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["1", "Reisetyp"],
            ["2", "Rahmen"],
            ["3", "Anreise"],
            ["4", "Feintuning"],
          ].map(([step, label]) => (
            <div key={step} className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Schritt {step}</div>
              <div className="mt-1 text-sm font-semibold text-white">{label}</div>
            </div>
          ))}
        </div>

        <GlassCard className="interactive-card p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Schritt 1</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Wähle deinen Skitag-Typ</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Ein Profil reicht für den Start. Alpivo setzt die wichtigsten Gewichtungen automatisch.
              </p>
            </div>
            <div className="rounded-lg border border-sky-200/20 bg-sky-200/10 px-4 py-3 text-sm text-sky-50">
              Aktiv: {activeProfile?.title ?? "Balanced"}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {tripProfiles.map((profile) => {
              const active = prefs.tripStyle === profile.id;
              return (
                <button
                  key={profile.id}
                  className={`min-w-0 rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-sky-200 bg-sky-200/[0.14] shadow-[0_18px_48px_rgba(56,189,248,0.12)]"
                      : "border-white/10 bg-white/[0.05] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                  }`}
                  onClick={() => applyTripProfile(profile)}
                >
                  <div className="break-words text-sm font-semibold text-white">{profile.title}</div>
                  <p className="mt-2 max-w-full break-words text-sm text-slate-300">{profile.subtitle}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <GlassCard className="interactive-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Live-Profil</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Deine Alpivo DNA</h2>
              </div>
              <button
                className="rounded-lg border border-sky-200/25 bg-sky-200/10 px-3 py-2 text-xs font-semibold text-sky-50 hover:bg-sky-200/15 disabled:opacity-60"
                type="button"
                disabled={dnaStatus === "loading"}
                onClick={saveDnaToProfile}
              >
                {dnaStatus === "loading" ? "Speichert..." : "DNA speichern"}
              </button>
            </div>
            {dnaMessage ? (
              <div
                className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                  dnaStatus === "error"
                    ? "border-red-300/30 bg-red-500/10 text-red-100"
                    : dnaStatus === "saved"
                      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      : "border-white/10 bg-white/[0.05] text-slate-300"
                }`}
              >
                {dnaMessage}
              </div>
            ) : null}
            <div className="mt-4 grid gap-3">
              {tripDna.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{item.label}</span>
                    <span>{signalLabel(item.value)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-sky-200" style={{ width: `${Math.round((item.value / 5) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="interactive-card p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Orientierung</p>
            <h2 className="mt-2 text-xl font-semibold text-white">So liest Alpivo deine Auswahl</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="font-medium text-white">Score wird gewichtet</div>
                <p className="mt-1">Dein Profil beeinflusst Value, Schnee, Vibe, Komfort, Gletscher-Signale und Pistenprofil direkt.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="font-medium text-white">Haken bleiben sichtbar</div>
                <p className="mt-1">Ein hoher Match kann trotzdem teuer, voll oder für Anfänger schwächer sein.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="font-medium text-white">Filter sind harte Grenzen</div>
                <p className="mt-1">Land, Fahrzeit, Pistenkilometer und Budget schneiden die Ergebnisliste nach.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="font-medium text-white">Feintuning bleibt optional</div>
                <p className="mt-1">Du musst nicht jeden Regler anfassen. Für ein gutes Ergebnis reicht Profil plus Rahmen.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="interactive-card relative z-50 overflow-visible p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Schritt 2</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Harte Grenzen setzen</h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs text-slate-400">Land</label>
              <SelectControl
                className="mt-2"
                ariaLabel="Land auswählen"
                value={prefilters.countryFilter}
                options={countryOptions}
                onChange={(value) => setPrefilters({ ...prefilters, countryFilter: value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Min. Pisten-km</label>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white"
                type="number"
                placeholder="z. B. 40"
                value={prefilters.minPisteKm}
                onChange={(e) => setPrefilters({ ...prefilters, minPisteKm: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Max. Fahrzeit (h)</label>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white"
                type="number"
                step="0.25"
                min="0"
                placeholder="z. B. 3.5"
                value={prefilters.maxDriveHours}
                onChange={(e) => setPrefilters({ ...prefilters, maxDriveHours: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <div className="text-sm font-medium text-white">Aktiv ausschließen</div>
            <p className="mt-1 text-xs text-slate-400">
              Diese Kriterien sind härter als Vorlieben. Ausgeschlossene Resorts werden aus der Hauptliste entfernt.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {exclusionCountryOptions.map((country) => {
                const active = prefs.excludeCountries.includes(country);
                return (
                  <button
                    key={country}
                    className={`rounded-full border px-3 py-2 text-xs transition ${
                      active
                        ? "border-red-300/35 bg-red-400/12 text-red-100"
                        : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1]"
                    }`}
                    type="button"
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        excludeCountries: current.excludeCountries.includes(country)
                          ? current.excludeCountries.filter((entry) => entry !== country)
                          : [...current.excludeCountries, country],
                      }))
                    }
                  >
                    Nicht {country}
                  </button>
                );
              })}
              {[
                ["excludeGlacier", "Keine Gletscher"],
                ["excludePremium", "Keine sehr teuren Resorts"],
                ["excludeFamilyOnly", "Keine reinen Anfängergebiete"],
              ].map(([key, label]) => {
                const active = Boolean(prefs[key as keyof Prefs]);
                return (
                  <button
                    key={key}
                    className={`rounded-full border px-3 py-2 text-xs transition ${
                      active
                        ? "border-red-300/35 bg-red-400/12 text-red-100"
                        : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1]"
                    }`}
                    type="button"
                    onClick={() => setPrefs((current) => ({ ...current, [key]: !active }))}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="interactive-card relative z-20 p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Schritt 3</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Budget, Datum und Anreise</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300">Budget pro Person (EUR)</label>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                <span>{prefs.budgetMin} EUR</span>
                <span>{prefs.budgetMax} EUR</span>
              </div>
              <div className="mt-3">
                <RangeSlider
                  min={BUDGET_MIN}
                  max={BUDGET_MAX}
                  step={BUDGET_STEP}
                  valueMin={prefs.budgetMin}
                  valueMax={prefs.budgetMax}
                  onChange={(nextMin, nextMax) => {
                    setPrefs((prev) => ({
                      ...prev,
                      budgetMin: nextMin,
                      budgetMax: nextMax,
                    }));
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-400">Range für Skipass, Unterkunft, Anreise, Leihe und Essen.</div>
            </div>

            <div>
              <label className="text-sm text-slate-300">Anzahl Personen</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
                  type="number"
                  min={1}
                  max={12}
                  value={prefs.peopleCount}
                  onChange={(e) => setPrefs({ ...prefs, peopleCount: Number(e.target.value) })}
                />
              </div>
              <input
                className="mt-2 w-full"
                type="range"
                min={1}
                max={12}
                step={1}
                value={prefs.peopleCount}
                onChange={(e) => setPrefs({ ...prefs, peopleCount: Number(e.target.value) })}
              />
              <div className="mt-1 text-xs text-slate-400">Für die Kostenübersicht in den Ergebnissen.</div>
            </div>

            <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-white">Reisedatum</div>
                  <div className="mt-1 text-xs text-slate-400">Wähle Anreise und Abreise wie bei Booking/Airbnb.</div>
                </div>
                <div className="text-xs text-slate-400">
                  {rangeSummary}
                  {rangeDays ? ` · ${rangeDays} Tage` : ""}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                {hydrated ? (
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      setPrefs((prev) => ({
                        ...prev,
                        tripStartDate: range?.from ? toIsoDate(range?.from) : null,
                        tripEndDate: range?.to ? toIsoDate(range?.to) : null,
                      }));
                    }}
                    locale={alpivoDayPickerLocale}
                    navLayout="after"
                    numberOfMonths={1}
                    weekStartsOn={1}
                    startMonth={new Date()}
                    disabled={{ before: new Date() }}
                    className="alpivo-calendar"
                    classNames={alpivoDayPickerClassNames}
                  />
                ) : (
                  <div className="h-48 animate-pulse rounded-xl bg-white/10" />
                )}
              </div>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">
                  <span className="text-slate-500">Anreise</span>
                  <span className="ml-2 font-semibold text-white">
                    {dateRange?.from ? dateFormatter.format(dateRange.from) : "offen"}
                  </span>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">
                  <span className="text-slate-500">Abreise</span>
                  <span className="ml-2 font-semibold text-white">
                    {dateRange?.to ? dateFormatter.format(dateRange.to) : "offen"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:col-span-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
                <div className="text-sm font-medium text-white">Essen & Trinken</div>
                <p className="mt-1 text-xs text-slate-400">
                  Wird pro Reisetag und Land geschätzt. Alpivo markiert diese Werte transparent als Schätzung.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    ["budget", "Sparsam", "Supermarkt, günstige Hütten, wenig Extras"],
                    ["standard", "Standard", "normale Hüttenpreise und Getränke"],
                    ["comfort", "Komfort", "mehr Einkehr, Drinks und Puffer"],
                  ].map(([value, label, hint]) => (
                    <button
                      key={value}
                      className={`rounded-xl border px-3 py-3 text-left text-sm ${
                        prefs.foodSpendLevel === value
                          ? "border-sky-200 bg-sky-200 text-slate-900"
                          : "border-white/10 text-slate-200 hover:bg-white/10"
                      }`}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, foodSpendLevel: value as Prefs["foodSpendLevel"] })}
                    >
                      <span className="block font-semibold">{label}</span>
                      <span className={`mt-1 block text-xs ${prefs.foodSpendLevel === value ? "text-slate-700" : "text-slate-400"}`}>
                        {hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white">Leihmaterial</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      prefs.rentalMode === "own"
                        ? "border-sky-200 bg-sky-200 text-slate-900"
                        : "border-white/10 text-slate-200 hover:bg-white/10"
                    }`}
                    onClick={() => setPrefs({ ...prefs, rentalMode: "own" })}
                  >
                    Ich bringe eigene Ski und Schuhe
                  </button>
                  <button
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      prefs.rentalMode === "rent"
                        ? "border-sky-200 bg-sky-200 text-slate-900"
                        : "border-white/10 text-slate-200 hover:bg-white/10"
                    }`}
                    onClick={() => setPrefs({ ...prefs, rentalMode: "rent" })}
                  >
                    Ich leihe vor Ort
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white">Anreise</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(["car", "train", "bus", "flight"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        prefs.travelMode === mode
                          ? "border-sky-200 bg-sky-200 text-slate-900"
                          : "border-white/10 text-slate-200 hover:bg-white/10"
                      }`}
                      onClick={() => setPrefs({ ...prefs, travelMode: mode })}
                    >
                      {mode === "car"
                        ? "Auto"
                        : mode === "train"
                          ? "Zug"
                          : mode === "bus"
                            ? "Bus"
                            : "Flug"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Schritt 4</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Feintuning</h2>
              <p className="mt-1 text-sm text-slate-300">Nur öffnen, wenn du gezielt stärker eingreifen willst.</p>
            </div>
            <button
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              type="button"
              onClick={() => setShowFineTuning((current) => !current)}
            >
              {showFineTuning ? "Feintuning schlie?en" : "Feintuning ?ffnen"}
            </button>
          </div>

          {!showFineTuning ? (
            <div className="mt-5 grid gap-2 text-sm text-slate-300 md:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">Schnee: {signalLabel(prefs.snowReliability)}</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">Value: {signalLabel(prefs.valueForMoney)}</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">Vibe: {signalLabel(Math.max(prefs.apres, prefs.huts, prefs.panorama))}</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">Easy: {signalLabel(Math.max(prefs.easyRuns, prefs.family))}</div>
            </div>
          ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SliderRow
            label="Schneesicherheit"
            hint="Höhenlage, Vertical und Gebietsstärke stärker gewichten."
            value={prefs.snowReliability}
            onChange={(v) => setPrefs({ ...prefs, snowReliability: v })}
          />
          <SliderRow
            label="Gletscher und Sommer-Ski"
            hint="Priorisiert hohe Gletscher-Kandidaten. Sommerbetrieb trotzdem offiziell prüfen."
            value={prefs.summerGlacier}
            onChange={(v) => setPrefs({ ...prefs, summerGlacier: v })}
          />
          <SliderRow
            label="Off-Piste Potenzial"
            hint="Berücksichtigt Höhenlage, Schnee, sportliches Terrain und weniger Andrang."
            value={prefs.offPiste}
            onChange={(v) => setPrefs({ ...prefs, offPiste: v })}
          />
          <SliderRow
            label="Preis-Leistung"
            hint="Günstigere Resorts und viel Piste pro Euro priorisieren."
            value={prefs.valueForMoney}
            onChange={(v) => setPrefs({ ...prefs, valueForMoney: v })}
          />
          <SliderRow
            label="Familien- und Anfängerkomfort"
            hint="Ruhiger, einfacher, planbarer."
            value={prefs.family}
            onChange={(v) => setPrefs({ ...prefs, family: v })}
          />
          <SliderRow
            label="Panorama und alpine Atmosphäre"
            hint="Höhenlage, Aussicht und ruhiger Premium-Vibe."
            value={prefs.panorama}
            onChange={(v) => setPrefs({ ...prefs, panorama: v })}
          />
          <SliderRow label="Après-Ski" value={prefs.apres} onChange={(v) => setPrefs({ ...prefs, apres: v })} />
          <SliderRow
            label="Leere Pisten"
            value={prefs.emptySlopes}
            onChange={(v) => setPrefs({ ...prefs, emptySlopes: v })}
          />
          <SliderRow
            label="Moderne Infrastruktur"
            value={prefs.infrastructure}
            onChange={(v) => setPrefs({ ...prefs, infrastructure: v })}
          />
          <SliderRow label="Hüttenkultur" value={prefs.huts} onChange={(v) => setPrefs({ ...prefs, huts: v })} />
          <SliderRow label="Snowpark" value={prefs.snowpark} onChange={(v) => setPrefs({ ...prefs, snowpark: v })} />
          <SliderRow
            label="Viele einfache Abfahrten"
            value={prefs.easyRuns}
            onChange={(v) => setPrefs({ ...prefs, easyRuns: v })}
          />
          <SliderRow
            label="Anspruchsvoll und steil"
            value={prefs.challenging}
            onChange={(v) => setPrefs({ ...prefs, challenging: v })}
          />
        </div>
          )}
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Bereit für die Ergebnisliste</div>
            <div className="mt-1 text-xs text-slate-400">
              {activeProfile?.title ?? "Balanced"} · {prefs.peopleCount} Personen · {rangeSummary}
            </div>
          </div>
          <button
            className="button-lift rounded-lg bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
            onClick={onSubmit}
          >
            Ergebnisse anzeigen
          </button>
        </GlassCard>
      </Section>
    </div>
  );
}
