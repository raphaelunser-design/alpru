"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { brand } from "@/config/brand";
import GlassCard from "@/components/GlassCard";
import AppShell from "@/components/premium/AppShell";
import MetricChip from "@/components/premium/MetricChip";
import PageHeader from "@/components/premium/PageHeader";
import RangeSlider from "@/components/RangeSlider";
import SelectControl from "@/components/SelectControl";
import { alpivoDayPickerClassNames, alpivoDayPickerLocale } from "@/lib/alpivoDayPicker";
import { matchProfiles, type MatchProfile } from "@/data/matchProfiles";
import {
  MATCH_PREF_DEFAULTS,
  buildMatchPayload,
  buildResortQuery,
  setLatestMatchSnapshot,
  type MatchResultError,
  type MatchResultMeta,
} from "@/lib/matching/matchPayload";
import type { MusicPreference, PartyPreference } from "@/lib/resortEvents";
import { skiCourseNeedOptions, type SkiCourseNeed } from "@/lib/skiCourses";
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
  partyPreference: PartyPreference;
  musicPreference: MusicPreference;
  foodSpendLevel: "budget" | "standard" | "comfort";
  rentalMode: "own" | "rent";
  skiCourseNeed: SkiCourseNeed;
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

const defaultPrefs: Prefs = { ...MATCH_PREF_DEFAULTS };

const BUDGET_MIN = 150;
const BUDGET_MAX = 900;
const BUDGET_STEP = 25;
const partyOptions: Array<{ value: PartyPreference; label: string }> = [
  { value: "indifferent", label: "Egal, Hauptsache gutes Skigebiet" },
  { value: "some_apres", label: "Ein bisschen Après-Ski wäre gut" },
  { value: "party_places", label: "Wir suchen bewusst Party-Orte" },
  { value: "festival_event", label: "Wir wollen ein Festival oder Event mitnehmen" },
  { value: "quiet_no_events", label: "Wir wollen eher Ruhe und keine großen Events" },
];

const musicOptions: Array<{ value: MusicPreference; label: string }> = [
  { value: "edm_electronic", label: "EDM / Electronic" },
  { value: "techno_house", label: "Techno / House" },
  { value: "apres_schlager", label: "Après-Ski / Schlager" },
  { value: "pop_mainstream", label: "Pop / Mainstream" },
  { value: "rock_indie_live", label: "Rock / Indie / Livebands" },
  { value: "hiphop_urban", label: "Hip-Hop / Urban" },
  { value: "any", label: "Egal" },
];
const exclusionCountryOptions = ["Frankreich", "Schweiz", "Österreich", "Italien", "Deutschland"];
const wizardSteps = [
  {
    label: "Profil",
    title: "Wer plant den Ski-Trip?",
    text: "Wählt euer Profil. Alpivo übernimmt sinnvolle Startwerte und ihr könnt danach feinjustieren.",
  },
  {
    label: "Prioritäten",
    title: "Was ist euch wichtig?",
    text: "Legt Vibe, Events und die wichtigsten Match-Signale fest.",
  },
  {
    label: "Details",
    title: "Budget, Zeitraum und harte Grenzen",
    text: "Setzt die planbaren Rahmenbedingungen, bevor Alpivo die Liste berechnet.",
  },
  {
    label: "Ergebnis",
    title: "Feinschliff und Match starten",
    text: "Prüft die Zusammenfassung und öffnet dann eure Empfehlungen.",
  },
] as const;

const tripProfiles: MatchProfile[] = matchProfiles;

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

function ProfileIcon({ profile }: { profile: TripStyle }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (profile === "budget") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 8h16v10H4V8Zm3-3h10v3H7V5Zm3 8h.01M15 12h3m-3 3h3" />
      </svg>
    );
  }

  if (profile === "apres") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M7 5h10l-1 7a4 4 0 0 1-8 0L7 5Zm5 11v3m-4 0h8M5 5h14" />
      </svg>
    );
  }

  if (profile === "family") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 20s7-4 7-10V6l-7-3-7 3v4c0 6 7 10 7 10Zm-3-9h6m-6 3h4" />
      </svg>
    );
  }

  if (profile === "glacier" || profile === "offpiste") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="m3 19 7-13 3.2 5.8L16 8l5 11H3Zm7-13 1.6 6 2.5-.2" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path {...common} d="M12 3v18m6-15H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H6m11-8 3 3-3 3" />
    </svg>
  );
}

function signalLabel(value: number) {
  if (value >= 5) return "sehr hoch";
  if (value >= 4) return "hoch";
  if (value >= 2) return "mittel";
  return "optional";
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = parseIsoDate(defaultPrefs.tripStartDate);
    const to = parseIsoDate(defaultPrefs.tripEndDate);
    return from || to ? { from, to } : undefined;
  });

  const [prefilters, setPrefilters] = useState<Prefilters>({
    countryFilter: "all",
    minPisteKm: "",
    maxDriveHours: "",
  });
  const [hydrated, setHydrated] = useState(false);
  const [showFineTuning, setShowFineTuning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [calendarMonths, setCalendarMonths] = useState(1);
  const [dnaStatus, setDnaStatus] = useState<"idle" | "loading" | "saved" | "local" | "error">("idle");
  const [dnaMessage, setDnaMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const rawPrefs = localStorage.getItem(STORAGE_KEY);
    if (rawPrefs) {
      try {
        const nextPrefs: Prefs = buildMatchPayload(JSON.parse(rawPrefs));
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
        const saved = buildResortQuery(JSON.parse(rawFilters));
        setPrefilters({
          countryFilter: saved.countryFilter,
          minPisteKm: saved.minPisteKm,
          maxDriveHours: saved.maxDriveHours,
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

      const nextPrefs: Prefs = buildMatchPayload(saved.preferences);
      setPrefs(nextPrefs);
      const from = parseIsoDate(nextPrefs.tripStartDate);
      const to = parseIsoDate(nextPrefs.tripEndDate);
      setDateRange(from || to ? { from, to } : undefined);
      if (saved?.filters && typeof saved.filters === "object") {
        const savedFilters = buildResortQuery(saved.filters);
        setPrefilters((current) => ({
          ...current,
          countryFilter: savedFilters.countryFilter,
          minPisteKm: savedFilters.minPisteKm,
          maxDriveHours: savedFilters.maxDriveHours,
        }));
      }
      setDnaStatus("saved");
      setDnaMessage("Gespeicherte Alpivo DNA aus deinem Profil geladen.");
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const updateCalendarMonths = () => setCalendarMonths(window.innerWidth >= 1024 ? 2 : 1);
    updateCalendarMonths();
    window.addEventListener("resize", updateCalendarMonths);
    return () => window.removeEventListener("resize", updateCalendarMonths);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildMatchPayload(prefs)));
    } catch {
      // Storage can be unavailable in some mobile/private contexts. Submit keeps an in-memory handoff as fallback.
    }
    if (dnaStatus === "saved") return;
    setDnaStatus(userId ? "local" : "idle");
  }, [prefs, hydrated, dnaStatus, userId]);

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
    try {
      localStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(
          buildResortQuery({
            ...originFields,
            countryFilter: prefilters.countryFilter,
            maxDriveHours: prefilters.maxDriveHours,
            minPisteKm: prefilters.minPisteKm,
          })
        )
      );
    } catch {
      // ignore unavailable client storage; the submit handoff still carries normalized filters
    }
  }, [prefilters, hydrated]);

  async function onSubmit() {
    setSubmitting(true);
    setSubmitError("");

    let existingFilters: string | null = null;
    try {
      existingFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    } catch {
      existingFilters = null;
    }
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
    const payload = buildMatchPayload(prefs);
    const mergedFilters = buildResortQuery({
      ...originFields,
      countryFilter: prefilters.countryFilter,
      maxDriveHours: prefilters.maxDriveHours,
      minPisteKm: prefilters.minPisteKm,
      budgetMin: payload.budgetMin,
      budgetMax: payload.budgetMax,
      // Match budget is scoring context. It becomes a hard Results filter only after the user moves that Results control.
      budgetFilterActive: false,
    });

    try {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(mergedFilters));
        localStorage.removeItem("alpivo_results_error");
      } catch {
        // Some mobile/private browsers can reject storage writes; in-memory handoff below keeps client navigation working.
      }

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        const message = typeof data?.error === "string" ? data.error : "Fehler beim Matching";
        throw Object.assign(new Error(message), { status: res.status });
      }

      const results = Array.isArray(data.results) ? data.results : [];
      const excluded = Array.isArray(data.excluded) ? data.excluded : [];
      const resultMeta: MatchResultMeta = {
        createdAt: new Date().toISOString(),
        source: data.source ?? "unknown",
        usingFallback: Boolean(data.usingFallback),
        total: data.total ?? results.length,
        loaded: data.loaded ?? results.length,
        resultCount: results.length,
        excludedCount: excluded.length,
        prefs: payload,
        filters: mergedFilters,
      };
      setLatestMatchSnapshot({ results, excluded, meta: resultMeta });

      if (process.env.NODE_ENV !== "production" && results.length === 0) {
        console.warn("[alpivo-match] match returned zero visible resorts", {
          params: payload,
          filters: mergedFilters,
          excludedCount: excluded.length,
          source: data.source,
          supabaseError: data.error ?? data.fallbackReason ?? null,
        });
      }

      try {
        sessionStorage.setItem("ski_results", JSON.stringify(results));
        localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results));
        localStorage.setItem("alpivo_excluded_results", JSON.stringify(excluded));
        localStorage.setItem("alpivo_results_meta", JSON.stringify(resultMeta));
        localStorage.removeItem("alpivo_results_error");
      } catch {
        // In-memory snapshot above protects the mobile flow when Web Storage is blocked.
      }

      if (userId) {
        const compactResults = (results as Array<{
          id: string;
          slug: string;
          name: string;
          country: string;
          region: string | null;
          matchPct: number;
          budgetStatus?: string;
        }>)
          .slice(0, 50)
          .map((result) => ({
            id: result.id,
            slug: result.slug,
            name: result.name,
            country: result.country,
            region: result.region,
            matchPct: result.matchPct,
            budgetStatus: result.budgetStatus ?? null,
          }));

        const { error: persistError } = await supabase.from("profile_preferences").upsert(
          {
            user_id: userId,
            preferences: payload,
            filters: {
              ...prefilters,
              resultFilters: mergedFilters,
              lastMatch: resultMeta,
            },
            exclusions: {
              excludeCountries: payload.excludeCountries,
              excludeGlacier: payload.excludeGlacier,
              excludePremium: payload.excludePremium,
              excludeFamilyOnly: payload.excludeFamilyOnly,
              lastResults: compactResults,
              lastExcludedCount: excluded.length,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (persistError) {
          setDnaStatus("local");
          setDnaMessage("Match lokal gespeichert. Profil-Speicherung ist fehlgeschlagen.");
        } else {
          setDnaStatus("saved");
          setDnaMessage("Match und Alpivo DNA im Profil gespeichert.");
        }
      } else {
        setDnaStatus("local");
        setDnaMessage("Nicht eingeloggt: Match bleibt nur lokal auf diesem Geraet gespeichert.");
      }

      router.push("/results");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fehler beim Matching";
      const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : undefined;
      const matchError: MatchResultError = {
        message,
        status: Number.isFinite(status) ? status : undefined,
        createdAt: new Date().toISOString(),
        prefs: payload,
        filters: mergedFilters,
      };
      setLatestMatchSnapshot({ results: [], excluded: [], error: matchError });
      setSubmitError("Der Match konnte gerade nicht berechnet werden. Die Ergebnisseite zeigt Details und einen neuen Versuch.");
      if (process.env.NODE_ENV !== "production") {
        console.error("[alpivo-match] client submit failed", { params: payload, filters: mergedFilters, error: message, status });
      }
      try {
        localStorage.setItem("alpivo_results_error", JSON.stringify(matchError));
      } catch {
        // ignore unavailable storage
      }
      router.push("/results");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDnaToProfile() {
    if (!userId) {
      setDnaStatus("error");
      setDnaMessage("Bitte einloggen, damit Alpivo deine DNA dauerhaft im Profil speichern kann.");
      return;
    }
    setDnaStatus("loading");
    setDnaMessage("DNA wird gespeichert...");
    const payload = buildMatchPayload(prefs);

    const { error } = await supabase.from("profile_preferences").upsert(
      {
        user_id: userId,
        preferences: payload,
        filters: buildResortQuery(prefilters),
        exclusions: {
          excludeCountries: payload.excludeCountries,
          excludeGlacier: payload.excludeGlacier,
          excludePremium: payload.excludePremium,
          excludeFamilyOnly: payload.excludeFamilyOnly,
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
    if (!dateRange.to) return `${fromLabel} – Abreise offen`;
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
      { label: "Preis-Leistung", value: prefs.valueForMoney },
      { label: "Schnee", value: prefs.snowReliability },
      { label: "Vibe", value: Math.max(prefs.apres, prefs.huts, prefs.panorama) },
      {
        label: "Events",
        value:
          prefs.partyPreference === "festival_event"
            ? 5
            : prefs.partyPreference === "party_places"
              ? 4
              : prefs.partyPreference === "some_apres"
                ? 3
                : prefs.partyPreference === "quiet_no_events"
                  ? 0
                  : 1,
      },
      { label: "Ruhe", value: prefs.emptySlopes },
      { label: "Sport", value: prefs.challenging },
      { label: "Leichte Pisten", value: Math.max(prefs.easyRuns, prefs.family) },
      { label: "Gletscher-Fit", value: prefs.summerGlacier },
      { label: "Off-Piste", value: prefs.offPiste },
    ],
    [prefs]
  );

  const activeProfile = tripProfiles.find((profile) => profile.id === prefs.tripStyle);
  const activeProfileLabel = activeProfile?.displayTitle ?? activeProfile?.title ?? "Individuell";
  const topPriorities = useMemo(
    () =>
      [
        ["Après-Ski & Events", Math.max(prefs.apres, prefs.huts, prefs.partyPreference === "festival_event" ? 5 : 0)],
        ["Pistenvielfalt", Math.max(prefs.challenging, prefs.easyRuns, prefs.infrastructure)],
        ["Schneesicherheit", Math.max(prefs.snowReliability, prefs.summerGlacier)],
        ["Ruhe & Komfort", Math.max(prefs.emptySlopes, prefs.panorama)],
        ["Preis-Leistung", prefs.valueForMoney],
      ]
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .slice(0, 3)
        .map(([label]) => label),
    [prefs]
  );
  const currentWizardStep = wizardSteps[activeStep] ?? wizardSteps[0];
  const isFinalStep = activeStep === wizardSteps.length - 1;
  const goToPreviousStep = () => setActiveStep((current) => Math.max(0, current - 1));
  const goToNextStep = () => setActiveStep((current) => Math.min(wizardSteps.length - 1, current + 1));
  const primaryStepAction = isFinalStep ? onSubmit : goToNextStep;

  return (
    <AppShell>
      <main className="alpivo-page-shell min-h-screen px-4 py-7 md:px-8 md:py-10">
        <div className="mx-auto grid w-full max-w-[1480px] gap-6 pb-32 md:pb-10">
          <PageHeader
            eyebrow="Alpivo Match Wizard"
            title={heroContent.title}
            subtitle={heroContent.subtitle}
            actions={
              <button
                type="button"
                className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.065] px-5 text-sm font-extrabold text-white hover:bg-white/10"
                onClick={() => setMobileSummaryOpen((current) => !current)}
              >
                Auswahl anzeigen
              </button>
            }
          />

        <section className="grid gap-4 lg:grid-cols-4">
          <MetricChip icon="vibe" value={activeProfileLabel} label="Profil" variant="glass" />
          <MetricChip icon="cost" value={`€ ${prefs.budgetMin} - € ${prefs.budgetMax}`} label="Budget p. P." variant="glass" />
          <MetricChip icon="time" value={rangeSummary} label={rangeDays ? `${rangeDays} Tage` : "Zeitraum"} variant="glass" />
          <MetricChip icon="data" value={`${topPriorities.length}`} label="Top-Prioritäten gewählt" variant="glass" />
        </section>

        <div className="grid grid-cols-2 gap-2 rounded-[1.35rem] border border-white/18 bg-white p-2 text-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.12)] sm:grid-cols-4">
          {wizardSteps.map((step, index) => {
            const active = index === activeStep;
            const completed = index < activeStep;
            return (
              <button
                key={step.label}
                type="button"
                className={`flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                  active
                    ? "bg-sky-50 text-sky-800"
                    : completed
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
                onClick={() => setActiveStep(index)}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                    active ? "bg-sky-600 text-white" : completed ? "bg-emerald-500 text-white" : "bg-white text-slate-500"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate text-sm font-extrabold">{step.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
        <section className={`${activeStep === 0 ? "" : "hidden"} rounded-[1.5rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.16)] md:p-6`}>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-700">Alpivo Match Wizard</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.01em] text-slate-950">{wizardSteps[0].title}</h2>
              <p className="mt-2 max-w-[19.5rem] text-sm leading-6 text-slate-600 sm:max-w-2xl">
                {wizardSteps[0].text}
              </p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-extrabold text-sky-900">
              Aktiv: {activeProfileLabel}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tripProfiles.map((profile) => {
              const active = prefs.tripStyle === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  className={`group min-w-0 overflow-hidden rounded-[1.1rem] border bg-white text-left shadow-sm transition ${
                    active
                      ? "border-sky-500 ring-4 ring-sky-100"
                      : "border-slate-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_22px_60px_rgba(14,165,233,0.12)]"
                  }`}
                  onClick={() => applyTripProfile(profile)}
                >
                  <div className="relative h-32 overflow-hidden">
                    <Image src={profile.image} alt="" fill sizes="(min-width: 1280px) 260px, (min-width: 768px) 42vw, 92vw" className="object-cover transition duration-300 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/12 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-700 shadow-sm">
                      {profile.badge}
                    </span>
                    <span className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full ${active ? "bg-sky-600 text-white" : "bg-white/90 text-slate-700"}`}>
                      {active ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <ProfileIcon profile={profile.id} />
                      )}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="break-words text-base font-extrabold text-slate-950">{profile.displayTitle}</div>
                    <p className="mt-2 max-w-full break-words text-sm leading-6 text-slate-600">{profile.displaySubtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <GlassCard className={activeStep === 1 ? "interactive-card p-6" : "hidden"}>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Vibe & Events</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Wie wichtig sind euch Party, Musik oder Festivals?</h2>
            </div>
            <div className="max-w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1 text-xs leading-5 text-slate-300 md:max-w-[22rem]">
              {partyOptions.find((option) => option.value === prefs.partyPreference)?.label}
            </div>
          </div>

          <div className="mt-5 grid gap-2 lg:grid-cols-5">
            {partyOptions.map((option) => {
              const active = prefs.partyPreference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`min-h-[74px] rounded-xl border px-3 py-3 text-left text-sm leading-5 transition ${
                    active
                      ? "border-sky-200 bg-sky-200 text-slate-950 shadow-[0_16px_42px_rgba(125,211,252,0.18)]"
                      : "border-white/10 bg-white/[0.05] text-slate-200 hover:border-sky-200/30 hover:bg-white/[0.09]"
                  }`}
                  onClick={() =>
                    setPrefs((current) => ({
                      ...current,
                      partyPreference: option.value,
                      apres:
                        option.value === "quiet_no_events"
                          ? Math.min(current.apres, 1)
                          : option.value === "party_places" || option.value === "festival_event"
                            ? Math.max(current.apres, 4)
                            : current.apres,
                      emptySlopes: option.value === "quiet_no_events" ? Math.max(current.emptySlopes, 4) : current.emptySlopes,
                    }))
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <div className="text-sm font-medium text-white">Welche Musikrichtung passt zu euch?</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {musicOptions.map((option) => {
                const active = prefs.musicPreference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "border-sky-200 bg-sky-200 text-slate-950"
                        : "border-white/10 bg-white/[0.045] text-slate-200 hover:border-sky-200/30 hover:bg-sky-200/10"
                    }`}
                    onClick={() => setPrefs((current) => ({ ...current, musicPreference: option.value }))}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        <div className={`${activeStep === 1 ? "grid" : "hidden"} gap-4 lg:grid-cols-[0.85fr_1.15fr]`}>
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
            <h2 className="mt-2 text-xl font-semibold text-white">Was Alpivo daraus macht</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="font-medium text-white">Score wird gewichtet</div>
                <p className="mt-1">Profil und Budget steuern die Sortierung. Harte Grenzen schneiden die Liste danach sauber zu.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="font-medium text-white">Haken bleiben sichtbar</div>
                <p className="mt-1">Ein hoher Match kann trotzdem teuer, voll oder für Anfänger schwächer sein.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="font-medium text-white">Kosten werden konkreter</div>
                <p className="mt-1">Datum, Personen und Anreise machen die Kosten pro Person greifbarer.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="font-medium text-white">Feintuning bleibt optional</div>
                <p className="mt-1">Du musst nicht jeden Regler anfassen. Profil plus Rahmen reichen für den ersten Match.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className={activeStep === 2 ? "interactive-card relative z-50 overflow-visible p-6" : "hidden"}>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Details</p>
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

        <GlassCard id="alpivo-budget-panel" className={activeStep === 2 ? "interactive-card relative z-20 p-6" : "hidden"}>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Details</p>
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
                    numberOfMonths={calendarMonths}
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
              <div className="sticky bottom-0 mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/82 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:hidden">
                <div className="grid gap-1 text-xs text-slate-300 sm:grid-cols-2">
                  <span>Anreise: <strong className="text-white">{dateRange?.from ? dateFormatter.format(dateRange.from) : "offen"}</strong></span>
                  <span>Abreise: <strong className="text-white">{dateRange?.to ? dateFormatter.format(dateRange.to) : "offen"}</strong></span>
                </div>
                <button
                  type="button"
                  className="min-h-11 rounded-xl bg-sky-200 px-4 text-sm font-semibold text-slate-950"
                  onClick={() => document.getElementById("alpivo-budget-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  Datum übernehmen
                </button>
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
                <div className="text-sm font-medium text-white">Braucht jemand aus eurer Gruppe Skikurs?</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skiCourseNeedOptions.map((option) => {
                    const active = prefs.skiCourseNeed === option.value;
                    return (
                      <button
                        key={option.value}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                          active
                            ? "border-sky-200 bg-sky-200 text-slate-900"
                            : "border-white/10 text-slate-200 hover:bg-white/10"
                        }`}
                        type="button"
                        onClick={() => setPrefs({ ...prefs, skiCourseNeed: option.value })}
                      >
                        {option.label}
                      </button>
                    );
                  })}
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

        <GlassCard className={activeStep === 3 ? "p-6" : "hidden"}>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ergebnis</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Für Fortgeschrittene</h2>
              <p className="mt-1 text-sm text-slate-300">Optionales Feintuning für Schnee, Value, Ruhe und Spezialwünsche.</p>
            </div>
            <button
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              type="button"
              onClick={() => setShowFineTuning((current) => !current)}
            >
              {showFineTuning ? "Fortgeschrittene schließen" : "Fortgeschrittene öffnen"}
            </button>
          </div>

          {!showFineTuning ? (
            <div className="mt-5 grid gap-2 text-sm text-slate-300 md:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">Schnee: {signalLabel(prefs.snowReliability)}</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">Preis-Leistung: {signalLabel(prefs.valueForMoney)}</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">Vibe: {signalLabel(Math.max(prefs.apres, prefs.huts, prefs.panorama))}</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">Leichte Pisten: {signalLabel(Math.max(prefs.easyRuns, prefs.family))}</div>
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
            <div className="text-sm font-semibold text-white">{currentWizardStep.title}</div>
            <div className="mt-1 text-xs text-slate-400">
              {currentWizardStep.text}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {activeStep > 0 ? (
              <button
                className="rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                type="button"
                onClick={goToPreviousStep}
              >
                Zurück
              </button>
            ) : null}
            <button
              className="button-lift rounded-lg bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:cursor-wait disabled:opacity-70"
              disabled={isFinalStep && submitting}
              type="button"
              onClick={primaryStepAction}
            >
              {isFinalStep ? (submitting ? "Match wird berechnet..." : "Ergebnisse anzeigen") : "Weiter"}
            </button>
          </div>
          {submitError ? (
            <div className="text-sm leading-6 text-amber-100 md:max-w-sm">{submitError}</div>
          ) : null}
        </GlassCard>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.13)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-700">Eure Auswahl (Live)</p>
                <h2 className="mt-2 text-xl font-extrabold text-slate-950">{activeProfileLabel}</h2>
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>Zeitraum</span>
                    <span className="text-right font-extrabold text-slate-950">{rangeSummary}</span>
                  </div>
                  <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>Abfahrt</span>
                    <span className="font-extrabold text-slate-950">München</span>
                  </div>
                  <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>Budget</span>
                    <span className="font-extrabold text-slate-950">€ {prefs.budgetMin} – € {prefs.budgetMax}</span>
                  </div>
                  <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>Gruppe</span>
                    <span className="font-extrabold text-slate-950">{prefs.peopleCount} Personen</span>
                  </div>
                  <div className="flex justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>Skikurs</span>
                    <span className="text-right font-extrabold text-slate-950">
                      {skiCourseNeedOptions.find((option) => option.value === prefs.skiCourseNeed)?.label ?? "Nein"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="font-semibold text-slate-500">Prioritäten Top 3</span>
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs font-bold text-slate-900">
                      {topPriorities.map((priority) => (
                        <li key={priority}>{priority}</li>
                      ))}
                    </ol>
                  </div>
                </div>
                <button
                  className="button-lift mt-4 w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-sky-500 disabled:cursor-wait disabled:opacity-70"
                  disabled={isFinalStep && submitting}
                  onClick={primaryStepAction}
                  type="button"
                >
                  {isFinalStep ? (submitting ? "Match wird berechnet..." : "Ergebnisse anzeigen") : "Weiter"}
                </button>
                {submitError ? <div className="mt-3 text-sm leading-6 text-amber-100">{submitError}</div> : null}
              </div>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-24 z-30 rounded-2xl border border-sky-200/25 bg-slate-950/90 p-3 shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{activeProfileLabel}</div>
              <div className="mt-0.5 truncate text-xs text-slate-400">
                {prefs.peopleCount} Personen · {prefs.budgetMin}-{prefs.budgetMax} EUR · {rangeSummary}
              </div>
            </div>
            <button
              className="min-h-11 shrink-0 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white hover:bg-white/10"
              type="button"
              onClick={() => setMobileSummaryOpen((current) => !current)}
              aria-expanded={mobileSummaryOpen}
            >
              {mobileSummaryOpen ? "Weniger" : "Details"}
            </button>
            <button
              className="min-h-11 shrink-0 rounded-xl bg-sky-200 px-4 text-sm font-semibold text-slate-950 disabled:opacity-70"
              disabled={isFinalStep && submitting}
              onClick={primaryStepAction}
              type="button"
            >
              {isFinalStep ? (submitting ? "..." : "Match") : "Weiter"}
            </button>
          </div>
          {mobileSummaryOpen ? (
            <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 text-xs text-slate-300">
              <div className="flex justify-between gap-3">
                <span>Profil</span>
                <span className="text-right font-semibold text-white">{activeProfileLabel}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Budget</span>
                <span className="text-right font-semibold text-white">€ {prefs.budgetMin} – € {prefs.budgetMax}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Prioritäten</span>
                <span className="text-right font-semibold text-white">{topPriorities.join(", ")}</span>
              </div>
            </div>
          ) : null}
          {submitError ? <div className="mt-2 text-xs leading-5 text-amber-100">{submitError}</div> : null}
        </div>
        </div>
      </main>
    </AppShell>
  );
}
