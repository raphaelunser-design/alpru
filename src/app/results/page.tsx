"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader, Button } from "@/components/ui";
import TopMatchesFilterBar, { CarIcon, FamilyIcon, type ActiveFilter, type ResultsSortKey, SnowIcon, WalletIcon } from "@/components/results/TopMatchesFilterBar";
import TopMatchResultCard, { type TopMatchCardModel } from "@/components/results/TopMatchResultCard";
import { alpivoCanonicalResorts, getAlpivoResortBySlug, type AlpivoResort } from "@/data/resorts";
import { useAlpivoGuestState } from "@/hooks/useAlpivoGuestState";
import { buildMatchPayload, buildResortQuery, getLatestMatchSnapshot, MATCH_PREF_DEFAULTS, persistLatestMatchSnapshot, type MatchResultSnapshot } from "@/lib/matching/matchPayload";
import { calculateMatchResults, type MatchResult } from "@/lib/matchScore";
import { findMvpResortBySlug, type MvpResortRow } from "@/lib/mvpResorts";
import { presentMatch } from "@/lib/matching/matchPresentation";
import { requestMatch } from "@/lib/matching/requestMatch";
import type { TripPreferences } from "@/types/alpivo";
import type { ResortDecision } from "@/lib/resortSignals";

const preferredResultSlugs = ["obertauern", "solden", "serfaus-fiss-ladis"] as const;
const canonicalSlugSet = new Set(alpivoCanonicalResorts.map((resort) => resort.slug));
const referenceDisplayScores: Record<string, number> = {
  obertauern: 96,
  solden: 92,
  "serfaus-fiss-ladis": 88,
};

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatPriceLevel(price: number) {
  if (price >= 680) return "€€€€€";
  if (price >= 520) return "€€€€";
  return "€€€";
}

function formatDayPrice(price: number) {
  const dayPrice = Math.max(90, Math.round(price / 4 / 10) * 10);
  return `ca. ${dayPrice} € / Tag`;
}

function normalizeSnow(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("sehr")) return "Sehr hoch";
  if (normalized.includes("gut") || normalized.includes("hoch")) return "Hoch";
  return value;
}

function tripStyleLabel(value: string | undefined) {
  if (value === "budget") return "Budget-Profil";
  if (value === "apres") return "Après-Profil";
  if (value === "family") return "Familien-Profil";
  if (value === "sport") return "Sport-Profil";
  if (value === "premium") return "Premium-Profil";
  if (value === "quiet") return "Ruhiges Profil";
  if (value === "glacier") return "Gletscher-Profil";
  if (value === "offpiste") return "Off-Piste-Profil";
  return "Individuelles Profil";
}

function normalizeReason(reason: string) {
  return reason.replaceAll("EUR", "€").replaceAll("p. P.", "pro Person");
}

function minutesFromTravelLabel(label: string) {
  const hourMatch = label.match(/(\d+)\s*(?::|h)/i);
  const minuteMatch = label.match(/(?::|h)\s*(\d+)/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  return hours * 60 + minutes;
}

function driveMinutesFromResult(result: MatchResult, fallbackLabel = "") {
  const parsed = minutesFromTravelLabel(result.resort.travelFromMunich.durationLabel || fallbackLabel);
  return parsed > 0 ? parsed : result.resort.travelFromMunich.durationMinutes ?? 9999;
}

function buildCanonicalCard(result: MatchResult, resort: AlpivoResort, originLabel: string): TopMatchCardModel {
  const reasons = (result.reasons.length ? result.reasons : resort.reasons).map(normalizeReason);
  return {
    slug: resort.slug,
    name: resort.name,
    location: resort.regionLabel,
    image: resort.image,
    score: referenceDisplayScores[resort.slug] ?? result.totalScore,
    priceLevel: formatPriceLevel(result.resort.price.estimatedPerPerson),
    priceNote: formatDayPrice(result.resort.price.estimatedPerPerson),
    travelTime: result.resort.travelFromMunich.durationLabel || resort.travelTimeFromMunich,
    travelLabel: `ab ${originLabel || "München"}`,
    snow: normalizeSnow(resort.snowLabel),
    reasons: reasons.slice(0, 3),
    detailHref: `/resort/${encodeURIComponent(resort.slug)}`,
    sortScore: result.totalScore,
    sortPrice: result.resort.price.estimatedPerPerson,
    sortDriveMinutes: driveMinutesFromResult(result, resort.travelTimeFromMunich),
  };
}

function buildDecisionCard(result: ResortDecision, originLabel: string, matchId?: string): TopMatchCardModel {
  const location = [result.region, result.country].filter(Boolean).join(", ");
  const price = result.cost?.totalMin ?? result.cost?.dayTripMin ?? 0;
  const match = presentMatch(result, originLabel);
  return {
    ...match,
    slug: result.slug,
    name: result.name,
    location: location || result.country,
    image: result.imageUrl || "/bg/skilandschaft.png",
    priceLevel: formatPriceLevel(price),
    detailHref: `/resort/${encodeURIComponent(result.slug)}${matchId ? `?match=${encodeURIComponent(matchId)}` : ""}`,
    sortScore: result.matchPct,
    sortPrice: price,
    sortDriveMinutes: 9999,
  };
}

function buildMvpFallbackCard(resort: MvpResortRow, originLabel: string): TopMatchCardModel {
  const price = 560;
  const slug = resort.slug || "serfaus-fiss-ladis";
  const name = resort.name || "Serfaus-Fiss-Ladis";
  const location = [resort.region || "Tirol", resort.country || "Österreich"].filter(Boolean).join(", ");
  return {
    slug,
    name,
    location,
    image: resort.hero_image_url || resort.image_url || "/bg/skilandschaft.png",
    score: 88,
    priceLevel: formatPriceLevel(price),
    priceNote: "ca. 140 € / Tag",
    travelTime: "6 h 15 min",
    travelLabel: `ab ${originLabel || "München"}`,
    snow: "Hoch",
    reasons: [
      "Hochgelegenes Skigebiet mit stabiler Schneelage",
      "Perfekt für Familien: breite Pisten und starke Betreuung",
      "Stressfrei durch autofreie Bereiche und klare Infrastruktur",
    ],
    detailHref: "/resorts",
    sortScore: 88,
    sortPrice: price,
    sortDriveMinutes: 375,
  };
}

function sortCards(cards: TopMatchCardModel[], sort: ResultsSortKey) {
  if (sort === "price") return [...cards].sort((a, b) => a.sortPrice - b.sortPrice || b.score - a.score);
  if (sort === "drive") {
    return [...cards].sort((a, b) => {
      const aDrive = Number.isFinite(a.sortDriveMinutes) && a.sortDriveMinutes > 0 ? a.sortDriveMinutes : minutesFromTravelLabel(a.travelTime);
      const bDrive = Number.isFinite(b.sortDriveMinutes) && b.sortDriveMinutes > 0 ? b.sortDriveMinutes : minutesFromTravelLabel(b.travelTime);
      return aDrive - bDrive || b.score - a.score;
    });
  }
  return [...cards].sort((a, b) => b.sortScore - a.sortScore || a.sortDriveMinutes - b.sortDriveMinutes);
}

export default function ResultsPage() {
  const [sort, setSort] = useState<ResultsSortKey>("match");
  const [matchSnapshot, setMatchSnapshot] = useState<MatchResultSnapshot | null>(null);
  const { state: guestState, setPreferences } = useAlpivoGuestState();
  const pendingMatch = useRef<AbortController | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const originLabel = matchSnapshot?.meta?.originLabel || matchSnapshot?.meta?.filters.originLabel || guestState.preferences.originLabel;

  async function refreshMatch(changes: Partial<TripPreferences>) {
    if (pendingMatch.current) return;

    const current = matchSnapshot?.meta;
    const prefs = buildMatchPayload({ ...guestState.preferences, ...current?.prefs, ...changes });
    const filters = buildResortQuery({
      ...current?.filters,
      minPisteKm: current?.filters.minPisteKm ?? guestState.preferences.minPisteKm,
      maxDriveHours: changes.maxTravelHours ?? current?.filters.maxDriveHours ?? guestState.preferences.maxTravelHours,
      budgetMin: prefs.budgetMin,
      budgetMax: prefs.budgetMax,
    });

    const controller = new AbortController();
    pendingMatch.current = controller;
    setRefreshing(true);
    setRefreshError("");
    try {
      const snapshot = await requestMatch(prefs, filters, originLabel, controller.signal);
      if (controller.signal.aborted) return;
      setPreferences({ ...prefs, ...changes, originLabel });
      persistLatestMatchSnapshot(snapshot);
      setMatchSnapshot(snapshot);
    } catch {
      if (!controller.signal.aborted) {
        setRefreshError("Die Empfehlungen konnten nicht aktualisiert werden. Bitte versuche es erneut.");
      }
    } finally {
      if (!controller.signal.aborted) {
        pendingMatch.current = null;
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    setMatchSnapshot(getLatestMatchSnapshot());
    return () => pendingMatch.current?.abort();
  }, []);

  const scoredResults = useMemo(() => {
    const base = calculateMatchResults(guestState.preferences, alpivoCanonicalResorts).filter((result) => !result.hardExclusion?.excluded);
    if (sort === "price") return [...base].sort((a, b) => a.resort.price.estimatedPerPerson - b.resort.price.estimatedPerPerson).map((result, index) => ({ ...result, rank: index + 1 }));
    if (sort === "drive") {
      return [...base]
        .sort((a, b) => driveMinutesFromResult(a) - driveMinutesFromResult(b))
        .map((result, index) => ({ ...result, rank: index + 1 }));
    }
    return base;
  }, [guestState.preferences, sort]);

  const apiMatchCards = useMemo(() => {
    const results = matchSnapshot?.results ?? [];
    return results
      .filter((result) => !(result.exclusionReasons?.length > 0))
      .map((result) => buildDecisionCard(result, originLabel, matchSnapshot?.meta?.createdAt));
  }, [matchSnapshot, originLabel]);

  const fallbackMatchCards = useMemo(() => {
    const bySlug = new Map(scoredResults.map((result) => [result.resort.slug, result]));
    const allCanonicalCards = scoredResults
      .map((result) => {
        const resort = getAlpivoResortBySlug(result.resort.slug);
        return resort ? buildCanonicalCard(result, resort, originLabel) : null;
      })
      .filter((card): card is TopMatchCardModel => Boolean(card));

    const preferredCards = preferredResultSlugs
      .map((slug) => {
        const result = bySlug.get(slug);
        const resort = result ? getAlpivoResortBySlug(result.resort.slug) : null;
        if (result && resort) return buildCanonicalCard(result, resort, originLabel);
        if (canonicalSlugSet.has(slug)) return null;
        const fallback = findMvpResortBySlug(slug);
        return fallback ? buildMvpFallbackCard(fallback, originLabel) : null;
      })
      .filter((card): card is TopMatchCardModel => Boolean(card));

    const used = new Set(preferredCards.map((card) => card.slug));
    const merged = [...preferredCards, ...allCanonicalCards.filter((card) => !used.has(card.slug))];
    return sortCards(merged, sort).slice(0, 3);
  }, [originLabel, scoredResults, sort]);

  const matchCards = useMemo(() => {
    if (matchSnapshot && !matchSnapshot.error) return sortCards(apiMatchCards, sort).slice(0, 3);
    return fallbackMatchCards;
  }, [apiMatchCards, fallbackMatchCards, matchSnapshot, sort]);

  const activePreferences = matchSnapshot?.meta?.prefs ?? guestState.preferences;
  const activeMaxDriveHours = matchSnapshot?.meta?.filters.maxDriveHours ?? guestState.preferences.maxTravelHours;
  const activeFilters = (() => {
    const filters: ActiveFilter[] = [];
    if (activePreferences.snowReliability >= 4) {
      filters.push({
        id: "snow",
        label: "Schneesicher",
        icon: <SnowIcon />,
        onRemove: () => void refreshMatch({ snowReliability: 3 }),
      });
    }
    if (activeMaxDriveHours) {
      filters.push({
        id: "drive",
        label: "Kurze Anreise",
        icon: <CarIcon />,
        onRemove: () => void refreshMatch({ maxTravelHours: "" }),
      });
    }
    if (activePreferences.budgetMin !== MATCH_PREF_DEFAULTS.budgetMin || activePreferences.budgetMax !== MATCH_PREF_DEFAULTS.budgetMax) {
      filters.push({
        id: "budget",
        label: "Budget",
        icon: <WalletIcon />,
        onRemove: () => void refreshMatch({ budgetMin: MATCH_PREF_DEFAULTS.budgetMin, budgetMax: MATCH_PREF_DEFAULTS.budgetMax, budget: MATCH_PREF_DEFAULTS.budget }),
      });
    }
    if (activePreferences.family >= 4 || activePreferences.tripStyle === "family") {
      filters.push({
        id: "family",
        label: "Familie",
        icon: <FamilyIcon />,
        onRemove: () => void refreshMatch({ family: MATCH_PREF_DEFAULTS.family, tripStyle: MATCH_PREF_DEFAULTS.tripStyle }),
      });
    }
    if (!filters.length) {
      filters.push({
        id: "profile",
        label: tripStyleLabel(activePreferences.tripStyle),
        icon: <SnowIcon />,
      });
    }
    return filters;
  })();

  const resultStatus = useMemo(() => {
    if (matchSnapshot?.error) return "Deine Empfehlungen konnten nicht geladen werden. Hier sind einige Beispiele.";
    if (matchSnapshot?.meta?.usingFallback) return "Deine Empfehlungen basieren auf lokal verfügbaren Resortdaten.";
    if (matchSnapshot) return "Deine Empfehlungen basieren auf deiner aktuellen Auswahl.";
    return "Beispiele zur Orientierung. Starte das Quiz für persönliche Empfehlungen.";
  }, [matchSnapshot]);

  return (
    <div className="alpivo-ui-root min-h-screen bg-[var(--alpivo-snow-white)] text-[var(--alpivo-deep-navy)]">
      <AppHeader />

      <main className="pb-16">
        <section className="relative overflow-hidden border-b border-[var(--alpivo-border-subtle)]">
          <div className="absolute inset-0">
            <Image
              src="/bg/banner-bild-4k.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: "center 42%" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,251,255,0.98)_0%,rgba(248,251,255,0.9)_38%,rgba(248,251,255,0.54)_68%,rgba(248,251,255,0.2)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,251,255,0.72)_0%,rgba(248,251,255,0.74)_52%,rgba(248,251,255,0.98)_100%)]" />
          </div>

          <div className="relative mx-auto min-h-[292px] max-w-[1480px] px-[var(--alpivo-space-page-x)] py-14 md:py-20">
            <div className="max-w-3xl">
              <h1 className="alpivo-ui-heading text-5xl leading-tight md:text-6xl">Deine Top Matches</h1>
              <p className="mt-4 text-lg leading-8 text-[var(--alpivo-ink)]">Diese Skigebiete passen am besten zu deinen Kriterien.</p>
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-12 max-w-[1280px] px-[var(--alpivo-space-page-x)]">
          <TopMatchesFilterBar filters={activeFilters} refreshing={refreshing} sort={sort} onSortChange={setSort} />
        </div>

        <section className="mx-auto mt-6 max-w-[1280px] space-y-5 px-[var(--alpivo-space-page-x)] md:mt-8">
          <div className="rounded-[var(--alpivo-radius-lg)] border border-[var(--alpivo-border-subtle)] bg-white px-4 py-3 text-sm leading-6 text-[var(--alpivo-ink-muted)] shadow-[var(--alpivo-shadow-sm)]">
            <span role="status">{refreshing ? "Empfehlungen werden neu berechnet …" : resultStatus}</span>
            {refreshError && <p role="alert">{refreshError}</p>}
          </div>

          {matchCards.length ? (
            matchCards.map((match, index) => <TopMatchResultCard key={match.slug} match={match} priority={index === 0} />)
          ) : (
            <div className="rounded-[var(--alpivo-radius-xl)] border border-[var(--alpivo-border-subtle)] bg-white p-8 text-center shadow-[var(--alpivo-shadow-sm)]">
              <h2 className="alpivo-ui-heading text-2xl">Keine passenden Matches gefunden</h2>
              <p className="mt-3 text-[var(--alpivo-ink-muted)]">Passe deine Kriterien an, um wieder passende Skigebiete zu sehen.</p>
              <Button href="/quiz" iconAfter={<ArrowIcon />} className="mt-6">
                Match anpassen
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
