"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader, Button, Card, FilterPill, MatchScoreRing, ResortImage, SectionContainer } from "@/components/ui";
import { deriveResortDecision, type MatchPreferences, type ResortDecision, type ResortSignalRow } from "@/lib/resortSignals";
import { getMvpResorts } from "@/lib/mvpResorts";
import type { ResortLoadResult } from "@/lib/resortRepository";

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
      <path d="m21 21-4.4-4.4M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Zm0-9a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatPrice(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Preis offen";
  return `ab ${number.format(Math.round(value))} €`;
}

function formatPistes(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Pisten offen";
  return `${number.format(Math.round(value))} km`;
}

function signalPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function cardImage(resort: ResortDecision) {
  return (resort.imageUrl || "").trim() || "/bg/skilandschaft.png";
}

function skeletonCards() {
  return Array.from({ length: 6 }).map((_, index) => (
    <Card key={`skeleton-${index}`} className="overflow-hidden p-0">
      <div className="h-52 animate-pulse bg-[var(--alpivo-mist-gray)]" />
      <div className="space-y-4 p-5">
        <div className="h-6 w-2/3 animate-pulse rounded bg-[rgba(7,27,58,0.08)]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[rgba(7,27,58,0.08)]" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-14 animate-pulse rounded-[var(--alpivo-radius-md)] bg-[rgba(7,27,58,0.06)]" />
          <div className="h-14 animate-pulse rounded-[var(--alpivo-radius-md)] bg-[rgba(7,27,58,0.06)]" />
          <div className="h-14 animate-pulse rounded-[var(--alpivo-radius-md)] bg-[rgba(7,27,58,0.06)]" />
        </div>
      </div>
    </Card>
  ));
}

function ResortDiscoveryCard({ resort, priority = false }: { resort: ResortDecision; priority?: boolean }) {
  const location = [resort.region, resort.country].filter(Boolean).join(", ");
  const strongestSignal = [
    { label: "Schnee", value: resort.fitProfile.snow },
    { label: "Value", value: resort.fitProfile.value },
    { label: "Vibe", value: resort.fitProfile.vibe },
    { label: "Komfort", value: resort.fitProfile.comfort },
    { label: "Pisten", value: resort.fitProfile.slope },
  ].sort((a, b) => b.value - a.value)[0];

  return (
    <Card as="article" interactive className="overflow-hidden p-0">
      <Link href={`/resort/${encodeURIComponent(resort.slug)}`} className="block focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[rgba(47,107,255,0.5)]">
        <div className="relative">
          <ResortImage
            src={cardImage(resort)}
            alt={`${resort.name} Winterpanorama`}
            priority={priority}
            aspectClassName="aspect-[1.65/1]"
            containerClassName="rounded-b-none rounded-t-[var(--alpivo-radius-xl)]"
            sizes="(min-width: 1280px) 31vw, (min-width: 768px) 46vw, 94vw"
          />
          <div className="absolute right-5 top-5">
            <MatchScoreRing value={resort.matchPct} size="sm" />
          </div>
        </div>

        <div className="p-5">
          <h2 className="alpivo-ui-heading text-2xl leading-tight">{resort.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--alpivo-ink-muted)]">
            <LocationIcon />
            <span>{location || resort.country}</span>
          </p>

          <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--alpivo-border-subtle)] border-y border-[var(--alpivo-border-subtle)] py-4">
            <div className="pr-3">
              <span className="block text-sm font-semibold text-[var(--alpivo-deep-navy)]">{formatPrice(resort.cost.totalMin)}</span>
              <span className="mt-1 block text-xs text-[var(--alpivo-ink-muted)]">p. P.</span>
            </div>
            <div className="px-3">
              <span className="block text-sm font-semibold text-[var(--alpivo-deep-navy)]">{formatPistes(resort.pisteKm)}</span>
              <span className="mt-1 block text-xs text-[var(--alpivo-ink-muted)]">Pisten</span>
            </div>
            <div className="pl-3">
              <span className="block text-sm font-semibold text-[var(--alpivo-deep-navy)]">{signalPercent(strongestSignal.value)}%</span>
              <span className="mt-1 block text-xs text-[var(--alpivo-ink-muted)]">{strongestSignal.label}</span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[var(--alpivo-ink-muted)]">
            {(resort.reasons && resort.reasons[0]) || "Guter Kandidat für einen ausgewogenen Ski-Trip."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {resort.vibeTags.slice(0, 3).map((tag) => (
              <span key={tag.label} className="rounded-[var(--alpivo-radius-sm)] bg-[rgba(47,107,255,0.08)] px-2.5 py-1 text-xs font-medium text-[var(--alpivo-deep-navy)]">
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </Card>
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
      const haystack = `${resort.name} ${resort.country} ${resort.region ?? ""} ${resort.vibeTags.map((tag) => tag.label).join(" ")} ${(resort.eventBadges ?? []).join(" ")} ${(resort.events ?? []).map((event) => event.name).join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [decisions, query, countryFilter, styleFilter]);

  const visibleResorts = filtered.slice(0, visibleCount);
  const totalLabel = number.format(totalResorts || resorts.length);

  return (
    <div className="alpivo-ui-root min-h-screen bg-[var(--alpivo-snow-white)] text-[var(--alpivo-deep-navy)]">
      <AppHeader
        navItems={[
          { href: "/resorts", label: "Resorts", active: true },
          { href: "/map", label: "3D Karte" },
          { href: "/results", label: "Top Matches" },
        ]}
      />

      <main>
        <section className="relative overflow-hidden border-b border-[var(--alpivo-border-subtle)] bg-white">
          <div className="mx-auto grid min-h-[360px] max-w-[1480px] gap-8 px-[var(--alpivo-space-page-x)] py-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)] lg:items-center lg:py-20">
            <div>
              <h1 className="alpivo-ui-heading max-w-4xl text-5xl leading-tight md:text-6xl">Resorts entdecken</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--alpivo-ink-muted)]">
                Vergleiche Skigebiete nach Match, Budget, Schnee und Vibe. Die Bibliothek bleibt bewusst leicht scannbar, bevor du in die Detailplanung wechselst.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button href="/quiz" size="lg" iconAfter={<ArrowIcon />}>
                  Match starten
                </Button>
                <Button href="/map" size="lg" variant="secondary" iconAfter={<ArrowIcon />}>
                  Karte öffnen
                </Button>
              </div>
            </div>
            <Card className="p-5">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div>
                  <span className="block text-3xl font-semibold text-[var(--alpivo-deep-navy)]">{loading ? "-" : totalLabel}</span>
                  <span className="mt-1 block text-sm text-[var(--alpivo-ink-muted)]">Resorts in der Bibliothek</span>
                </div>
                <div>
                  <span className="block text-3xl font-semibold text-[var(--alpivo-deep-navy)]">{loading ? "-" : number.format(filtered.length)}</span>
                  <span className="mt-1 block text-sm text-[var(--alpivo-ink-muted)]">aktuelle Treffer</span>
                </div>
                <div>
                  <span className="block text-3xl font-semibold text-[var(--alpivo-deep-navy)]">{usingFallback ? "Fallback" : "Live"}</span>
                  <span className="mt-1 block text-sm text-[var(--alpivo-ink-muted)]">Datenmodus</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <SectionContainer className="pb-4 pt-8 md:pt-10">
          <Card className="p-4 md:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label className="flex min-h-12 items-center gap-3 rounded-[var(--alpivo-radius-md)] border border-[var(--alpivo-border-subtle)] bg-white px-4 text-[var(--alpivo-ink-muted)]">
                <SearchIcon />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-[var(--alpivo-deep-navy)] outline-none placeholder:text-[var(--alpivo-ink-muted)]"
                  placeholder="Resort, Region, Land oder Stimmung suchen"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                className="min-h-12 rounded-[var(--alpivo-radius-md)] border border-[var(--alpivo-border-subtle)] bg-white px-4 text-sm font-medium text-[var(--alpivo-deep-navy)] outline-none"
                value={countryFilter}
                aria-label="Land filtern"
                onChange={(event) => setCountryFilter(event.target.value)}
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country === "all" ? "Alle Länder" : country}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Stil filtern">
              {styleOptions.map((option) => (
                <FilterPill key={option.value} active={styleFilter === option.value} onClick={() => setStyleFilter(option.value)}>
                  {option.label}
                </FilterPill>
              ))}
            </div>
          </Card>
        </SectionContainer>

        <SectionContainer className="pt-6" contentClassName="space-y-6">
          <div className="flex flex-col justify-between gap-3 rounded-[var(--alpivo-radius-lg)] border border-[var(--alpivo-border-subtle)] bg-white px-4 py-3 text-sm text-[var(--alpivo-ink-muted)] md:flex-row md:items-center">
            <div>
              <span className="font-semibold text-[var(--alpivo-deep-navy)]">
                {loading ? "Resortdaten werden geladen" : `${number.format(filtered.length)} von ${totalLabel} Resorts`}
              </span>
              {!loading && usingFallback ? <span> · Fallback-Daten</span> : null}
              {!loading && query.trim() ? <span> · Suche: {query.trim()}</span> : null}
            </div>
            <span>{!loading && filtered.length > 0 ? `Zeige ${number.format(visibleResorts.length)} von ${number.format(filtered.length)}` : ""}</span>
          </div>

          {error ? (
            <div className="rounded-[var(--alpivo-radius-lg)] border border-amber-300/35 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
              Live-Daten konnten nicht zuverlässig geladen werden. Alpivo zeigt deshalb kuratierte Beta-Pilotdaten. Technischer Hinweis: {error}
            </div>
          ) : null}

          <div className="rounded-[var(--alpivo-radius-lg)] border border-[var(--alpivo-border-subtle)] bg-white px-4 py-3 text-xs leading-relaxed text-[var(--alpivo-ink-muted)]">
            Resortdaten, Kosten und Verfügbarkeiten sind Orientierung. Prüfe Skipasspreise, Unterkunft und Live-Status immer über die offiziellen Links auf der Detailseite.
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading ? skeletonCards() : visibleResorts.map((resort, index) => <ResortDiscoveryCard key={resort.id} resort={resort} priority={index === 0} />)}
          </div>

          {!loading && filtered.length > visibleResorts.length ? (
            <div className="flex justify-center">
              <Button type="button" variant="secondary" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}>
                Weitere {number.format(Math.min(PAGE_SIZE, filtered.length - visibleResorts.length))} Resorts anzeigen
              </Button>
            </div>
          ) : null}

          {!loading && filtered.length === 0 && !error ? (
            <Card className="p-8 text-center">
              <h2 className="alpivo-ui-heading text-2xl">Keine Resorts gefunden</h2>
              <p className="mx-auto mt-3 max-w-2xl text-[var(--alpivo-ink-muted)]">
                Zu deiner Suche passen aktuell keine Resorts. Setze Filter zurück oder starte einen Match mit neutralem Profil.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setCountryFilter("all");
                    setStyleFilter("all");
                  }}
                >
                  Filter zurücksetzen
                </Button>
                <Button href="/quiz">Match starten</Button>
              </div>
            </Card>
          ) : null}
        </SectionContainer>
      </main>
    </div>
  );
}
