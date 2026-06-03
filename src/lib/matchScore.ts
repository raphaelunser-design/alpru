import { MATCH_PREF_DEFAULTS, type MatchPayload } from "@/lib/matching/matchPayload";
import type { Resort, ResortScoreBreakdown, TripPreferences } from "@/types/alpivo";

export type MatchFactorScore = {
  factor: string;
  score: number;
  weight: number;
  explanation: string;
};

export type MatchResult = {
  resort: Resort;
  totalScore: number;
  rank: number;
  reasons: string[];
  drawbacks: string[];
  factorScores: MatchFactorScore[];
  hardExclusion?: {
    excluded: boolean;
    reason?: string;
  };
};

export function sortScoreBreakdown(items: ResortScoreBreakdown[]) {
  return [...items].sort((a, b) => b.score * b.weight - a.score * a.weight);
}

export function getTopScoreFactors(resort: Pick<Resort, "scoreBreakdown">, limit = 3) {
  return sortScoreBreakdown(resort.scoreBreakdown).slice(0, limit);
}

export function explainMatchScore(resort: Pick<Resort, "matchScore" | "scoreBreakdown" | "dataStatus">) {
  const topFactors = getTopScoreFactors(resort);
  const reasonText = topFactors.map((factor) => `${factor.label}: ${factor.explanation}`).join(" ");
  return {
    score: resort.matchScore,
    factors: topFactors,
    summary: `${resort.matchScore} Match basiert auf ${topFactors.length} stark gewichteten Faktoren. ${reasonText}`,
    confidence: resort.dataStatus.overallConfidence,
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function numberFromString(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function getMaxTravelHours(preferences: MatchPayload | Partial<TripPreferences>) {
  return numberFromString((preferences as Partial<TripPreferences>).maxTravelHours);
}

function getMinPisteKm(preferences: MatchPayload | Partial<TripPreferences>) {
  return numberFromString((preferences as Partial<TripPreferences>).minPisteKm);
}

function hardExclusionReason(preferences: MatchPayload | Partial<TripPreferences>, resort: Resort) {
  if (preferences.excludeCountries?.includes(resort.country)) {
    return `${resort.country} wurde ausgeschlossen.`;
  }

  if (preferences.excludeGlacier && resort.snow.glacier) {
    return "Gletschergebiete wurden ausgeschlossen.";
  }

  if (preferences.excludePremium && resort.price.estimatedPerPerson >= 600) {
    return "Sehr teure Resorts wurden ausgeschlossen.";
  }

  if (preferences.excludeFamilyOnly && (resort.vibe.familyFit ?? 0) >= 85 && (resort.vibe.apresFit ?? 0) < 45) {
    return "Sehr familienfokussierte Resorts wurden ausgeschlossen.";
  }

  const maxTravelHours = getMaxTravelHours(preferences);
  if (maxTravelHours && resort.travelFromMunich.durationMinutes && resort.travelFromMunich.durationMinutes > maxTravelHours * 60) {
    return `Fahrzeit liegt über ${maxTravelHours} h.`;
  }

  const minPisteKm = getMinPisteKm(preferences);
  if (minPisteKm && resort.skiArea.pisteKm && resort.skiArea.pisteKm < minPisteKm) {
    return `Pistenkilometer liegen unter ${minPisteKm} km.`;
  }

  return undefined;
}

function preferenceDelta(preferences: MatchPayload | Partial<TripPreferences>, resort: Resort) {
  let delta = 0;

  const budgetMin = preferences.budgetMin ?? MATCH_PREF_DEFAULTS.budgetMin;
  const budgetMax = preferences.budgetMax ?? MATCH_PREF_DEFAULTS.budgetMax;
  if (resort.price.estimatedPerPerson > budgetMax) {
    delta -= Math.min(10, Math.ceil((resort.price.estimatedPerPerson - budgetMax) / 30));
  } else if (resort.price.estimatedPerPerson < budgetMin) {
    delta -= Math.min(4, Math.ceil((budgetMin - resort.price.estimatedPerPerson) / 80));
  }

  delta += ((preferences.apres ?? MATCH_PREF_DEFAULTS.apres) - MATCH_PREF_DEFAULTS.apres) * (((resort.vibe.apresFit ?? 60) - 70) / 40);
  delta += ((preferences.snowReliability ?? MATCH_PREF_DEFAULTS.snowReliability) - MATCH_PREF_DEFAULTS.snowReliability) * (((resort.scoreBreakdown.find((factor) => factor.factor === "snow")?.score ?? 80) - 82) / 35);
  delta += ((preferences.valueForMoney ?? MATCH_PREF_DEFAULTS.valueForMoney) - MATCH_PREF_DEFAULTS.valueForMoney) * ((620 - resort.price.estimatedPerPerson) / 90);
  delta += ((preferences.family ?? MATCH_PREF_DEFAULTS.family) - MATCH_PREF_DEFAULTS.family) * (((resort.vibe.familyFit ?? 50) - 55) / 45);
  delta += ((preferences.emptySlopes ?? MATCH_PREF_DEFAULTS.emptySlopes) - MATCH_PREF_DEFAULTS.emptySlopes) * (((resort.vibe.quietFit ?? 45) - 45) / 45);
  delta += ((preferences.challenging ?? MATCH_PREF_DEFAULTS.challenging) - MATCH_PREF_DEFAULTS.challenging) * (((resort.skiArea.advancedFit ?? 65) - 65) / 38);

  const tripStyle = preferences.tripStyle ?? MATCH_PREF_DEFAULTS.tripStyle;
  if (tripStyle === "family") delta += ((resort.vibe.familyFit ?? 50) - 55) / 16;
  if (tripStyle === "quiet") delta += ((resort.vibe.quietFit ?? 45) - 45) / 14;
  if (tripStyle === "budget") delta += (610 - resort.price.estimatedPerPerson) / 55;
  if (tripStyle === "sport" || tripStyle === "offpiste") delta += ((resort.skiArea.advancedFit ?? 65) - 65) / 16;
  if (tripStyle === "glacier") delta += resort.snow.glacier ? 5 : -3;

  if (preferences.partyPreference === "quiet_no_events") {
    delta += ((resort.vibe.quietFit ?? 45) - (resort.vibe.apresFit ?? 65)) / 18;
  }
  if (preferences.partyPreference === "festival_event" || preferences.partyPreference === "party_places") {
    delta += ((resort.vibe.eventFit ?? resort.vibe.apresFit ?? 60) - 65) / 18;
  }

  return Math.max(-18, Math.min(14, delta));
}

function buildFactorScores(preferences: MatchPayload | Partial<TripPreferences>, resort: Resort): MatchFactorScore[] {
  const budgetFit =
    resort.price.estimatedPerPerson <= (preferences.budgetMax ?? MATCH_PREF_DEFAULTS.budgetMax) &&
    resort.price.estimatedPerPerson >= (preferences.budgetMin ?? MATCH_PREF_DEFAULTS.budgetMin)
      ? 92
      : Math.max(45, 92 - Math.abs(resort.price.estimatedPerPerson - (preferences.budgetMax ?? MATCH_PREF_DEFAULTS.budgetMax)) / 4);

  const travelFit = resort.travelFromMunich.durationMinutes
    ? Math.max(45, 100 - Math.max(0, resort.travelFromMunich.durationMinutes - 180) / 3)
    : 76;

  const customFactors: MatchFactorScore[] = [
    {
      factor: "budget",
      score: clampScore(budgetFit),
      weight: 0.16,
      explanation: `Liegt mit ca. ${resort.price.estimatedPerPerson} EUR p. P. ${budgetFit >= 85 ? "im Budgetfenster" : "außerhalb des Budgetfensters"}.`,
    },
    {
      factor: "travel",
      score: clampScore(travelFit),
      weight: 0.14,
      explanation: `${resort.travelFromMunich.durationLabel} ab München, ${resort.travelFromMunich.distanceKm ?? "?"} km Strecke.`,
    },
  ];

  const baseFactors = resort.scoreBreakdown.map((factor) => ({
    factor: factor.factor,
    score: factor.score,
    weight: factor.weight,
    explanation: factor.explanation,
  }));

  return [...baseFactors, ...customFactors].sort((a, b) => b.score * b.weight - a.score * a.weight).slice(0, 8);
}

export function calculateMatchScore(preferences: MatchPayload | Partial<TripPreferences>, resort: Resort): MatchResult {
  const exclusionReason = hardExclusionReason(preferences, resort);
  const totalScore = exclusionReason ? 0 : clampScore(resort.matchScore + preferenceDelta(preferences, resort));
  const factorScores = buildFactorScores(preferences, resort);
  const scoreReasons = factorScores
    .slice(0, 3)
    .map((factor) => factor.explanation)
    .filter(Boolean);

  return {
    resort,
    totalScore,
    rank: resort.rank ?? 999,
    reasons: scoreReasons.length ? scoreReasons : resort.matchReasons,
    drawbacks: [exclusionReason ?? resort.drawback],
    factorScores,
    hardExclusion: exclusionReason ? { excluded: true, reason: exclusionReason } : undefined,
  };
}

export function calculateMatchResults(preferences: MatchPayload | Partial<TripPreferences>, resorts: Resort[]): MatchResult[] {
  return resorts
    .map((resort) => calculateMatchScore(preferences, resort))
    .sort((a, b) => {
      if (Boolean(a.hardExclusion?.excluded) !== Boolean(b.hardExclusion?.excluded)) {
        return a.hardExclusion?.excluded ? 1 : -1;
      }
      return b.totalScore - a.totalScore || (a.resort.rank ?? 999) - (b.resort.rank ?? 999);
    })
    .map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
}
