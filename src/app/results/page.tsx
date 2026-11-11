"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader, Button } from "@/components/ui";
import TopMatchesFilterBar, { FamilyIcon, type ActiveFilter, type ResultsSortKey, SnowIcon, WalletIcon } from "@/components/results/TopMatchesFilterBar";
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

function buildCanonicalCard(result: MatchResult, resort: AlpivoResort): TopMatchCardModel {
  const reasons = (result.reasons.length ? result.reasons : resort.reasons).map(normalizeReason);
  return {
    slug: resort.slug,
    name: resort.name,
    location: resort.regionLabel,
    image: resort.image,
    score: referenceDisplayScores[resort.slug] ?? result.totalScore,
    priceNote: formatDayPrice(result.resort.price.estimatedPerPerson),
    travelTime: result.resort.travelFromMunich.durationLabel || resort.travelTimeFromMunich,
    travelLabel: "Beispiel ab München",
    snow: normalizeSnow(resort.snowLabel),
    reasons: reasons.slice(0, 3),
    detailHref: `/resort/${encodeURIComponent(resort.slug)}`,
    sortScore: result.totalScore,
    sortPrice: result.resort.price.estimatedPerPerson,
  };
}

function buildDecisionCard(result: ResortDecision, originLabel: string, matchId?: string, budgetCap?: number): TopMatchCardModel {
  const location = [result.region, result.country].filter(Boolean).join(", ");
  const price = result.cost?.totalMin ?? result.cost?.dayTripMin ?? 0;
  const match = presentMatch(result, originLabel);
  const min = result.cost?.totalMin;
  const max = result.cost?.totalMax;
  const budgetFit = budgetCap && budgetCap > 0 && Number.isFinite(min) && Number.isFinite(max)
    ? min > budgetCap ? "over" : max <= budgetCap ? "within" : "partial"
    : undefined;
  return {
    ...match,
    budgetFit,
    slug: result.slug,
    name: result.name,
    location: location || result.country,
    image: result.imageUrl || "/bg/skilandschaft.png",
    detailHref: `/resort/${encodeURIComponent(result.slug)}${matchId ? `?match=${encodeURIComponent(matchId)}` : ""}`,
    sortScore: result.matchPct,
    sortPrice: price,
  };
}

function buildMvpFallbackCard(resort: MvpResortRow): TopMatchCardModel {
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
    priceNote: "ca. 140 € / Tag",
    travelTime: "6 h 15 min",
    travelLabel: "Beispiel ab München",
    snow: "Hoch",
    reasons: [
      "Hochgelegenes Skigebiet mit stabiler Schneelage",
      "Perfekt für Familien: breite Pisten und starke Betreuung",
      "Stressfrei durch autofreie Bereiche und klare Infrastruktur",
    ],
    detailHref: "/resorts",
    sortScore: 88,
    sortPrice: price,
  };
}

function sortCards(cards: TopMatchCardModel[], sort: ResultsSortKey) {
  if (sort === "price") return [...cards].sort((a, b) => a.sortPrice - b.sortPrice || b.score - a.score);
  return [...cards].sort((a, b) => b.sortScore - a.sortScore);
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
    return base;
  }, [guestState.preferences, sort]);

  const apiMatchCards = useMemo(() => {
    const results = matchSnapshot?.results ?? [];
    return results
      .filter((result) => !(result.exclusionReasons?.length > 0))
      .map((result) => buildDecisionCard(result, originLabel, matchSnapshot?.meta?.createdAt, matchSnapshot?.meta?.prefs.budgetMax));
  }, [matchSnapshot, originLabel]);

  const fallbackMatchCards = useMemo(() => {
    const bySlug = new Map(scoredResults.map((result) => [result.resort.slug, result]));
    const allCanonicalCards = scoredResults
      .map((result) => {
        const resort = getAlpivoResortBySlug(result.resort.slug);
        return resort ? buildCanonicalCard(result, resort) : null;
      })
      .filter((card): card is TopMatchCardModel => Boolean(card));

    const preferredCards = preferredResultSlugs
      .map((slug) => {
        const result = bySlug.get(slug);
        const resort = result ? getAlpivoResortBySlug(result.resort.slug) : null;
        if (result && resort) return buildCanonicalCard(result, resort);
        if (canonicalSlugSet.has(slug)) return null;
        const fallback = findMvpResortBySlug(slug);
        return fallback ? buildMvpFallbackCard(fallback) : null;
      })
      .filter((card): card is TopMatchCardModel => Boolean(card));

    const used = new Set(preferredCards.map((card) => card.slug));
    const merged = [...preferredCards, ...allCanonicalCards.filter((card) => !used.has(card.slug))];
    return sortCards(merged, sort).slice(0, 3);
  }, [scoredResults, sort]);

  const matchCards = useMemo(() => {
    if (matchSnapshot && !matchSnapshot.error) return sortCards(apiMatchCards, sort).slice(0, 3);
    return fallbackMatchCards;
  }, [apiMatchCards, fallbackMatchCards, matchSnapshot, sort]);

  const activePreferences = matchSnapshot?.meta?.prefs ?? guestState.preferences;
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
    if (matchSnapshot?.meta?.usingFallback) return "Empfehlungen aus einer Auswahl an Beispielgebieten.";
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

          <div className="relative mx-auto max-w-[1280px] px-[var(--alpivo-space-page-x)] py-6 md:py-10">
            <div className="max-w-3xl">
              <h1 className="alpivo-ui-heading text-3xl leading-tight md:text-5xl">Deine Top Matches</h1>
              <p className="mt-2 text-sm leading-6 md:text-base text-[var(--alpivo-ink)]">Diese Skigebiete passen am besten zu deinen Kriterien.</p>
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto mt-3 max-w-[1280px] px-[var(--alpivo-space-page-x)]">
          <TopMatchesFilterBar filters={activeFilters} refreshing={refreshing} sort={sort} onSortChange={setSort} />
        </div>

        <section className="mx-auto mt-3 max-w-[1280px] space-y-4 px-[var(--alpivo-space-page-x)] md:mt-8">
          <div className="px-1 text-xs leading-5 text-[var(--alpivo-ink-muted)] md:text-sm">
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
