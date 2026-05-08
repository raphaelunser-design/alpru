import { calculateAlpivoMatchScore } from "@/lib/matching/alpivoScore";
import {
  calculateFestivalFit,
  deriveEventBadges,
  normalizeResortEvents,
  type MusicPreference,
  type PartyPreference,
  type ResortEvent,
} from "@/lib/resortEvents";
import type { AlpivoScoreResult, ResortInput, UserPreferences } from "@/types/matching";

export type BudgetStatus = "green" | "yellow" | "red";
export type BudgetClass = "budget" | "mid-range" | "premium";
export type TripStyle =
  | "balanced"
  | "budget"
  | "apres"
  | "family"
  | "sport"
  | "premium"
  | "quiet"
  | "powder"
  | "glacier"
  | "offpiste";

export type MatchPreferences = Partial<{
  tripStyle: TripStyle;
  tripStartDate: string | null;
  tripEndDate: string | null;
  budgetMin: number;
  budgetMax: number;
  budget: number;
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
  needRental: boolean;
  rentalMode: "own" | "rent";
  travelMode: "car" | "train" | "bus" | "flight";
  excludeCountries: string[];
  excludeGlacier: boolean;
  excludePremium: boolean;
  excludeFamilyOnly: boolean;
}>;

export type ResortSignalRow = {
  id: string;
  slug: string | null;
  name: string;
  country: string;
  region: string | null;
  lat: number | null;
  lon: number | null;
  piste_km: number | null;
  piste_km_total: number | null;
  piste_km_easy: number | null;
  piste_km_intermediate: number | null;
  piste_km_advanced: number | null;
  runs_count_total: number | null;
  lifts_count_total: number | null;
  elevation_min_m: number | null;
  elevation_max_m: number | null;
  vertical_m: number | null;
  image_url: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  image_source: string | null;
  image_credit: string | null;
  image_license: string | null;
  official_url: string | null;
  piste_map_url: string | null;
  skipass_url: string | null;
  openskimap_url: string | null;
  skipass_price_from: number | null;
  apres_score: number | null;
  crowd_score: number | null;
  infra_score: number | null;
  hut_score: number | null;
  park_score: number | null;
  beginner_score: number | null;
  advanced_score: number | null;
  resort_events?: ResortEvent[] | null;
};

export type ResortVibeTag = {
  label: string;
  score: number;
  tone: "ice" | "amber" | "green" | "slate";
};

export type InfrastructureSignal = {
  label: string;
  value: string;
  detail: string;
  score: number;
};

export type InfrastructureProfile = {
  score: number;
  source: "stored" | "derived" | "combined";
  sourceLabel: string;
  summary: string;
  signals: InfrastructureSignal[];
};

export type CostEstimate = {
  passSource: "stored" | "estimated";
  passMin: number;
  passMax: number;
  rentalMin: number;
  rentalMax: number;
  accommodationMin: number;
  accommodationMax: number;
  travelMin: number;
  travelMax: number;
  travelSource: "fallback" | "route" | "provider";
  parkingMin: number;
  parkingMax: number;
  foodMin: number;
  foodMax: number;
  foodSource: "country-estimate";
  foodLevel: "budget" | "standard" | "comfort";
  totalMin: number;
  totalMax: number;
  dayTripMin: number;
  dayTripMax: number;
  weekendMin: number;
  weekendMax: number;
  weekMin: number;
  weekMax: number;
};

export type SlopeProfile = {
  total: number | null;
  easy: number | null;
  intermediate: number | null;
  advanced: number | null;
  easyShare: number | null;
  intermediateShare: number | null;
  advancedShare: number | null;
};

export type ResortDecision = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string | null;
  lat: number | null;
  lon: number | null;
  pisteKm: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageSource: string | null;
  imageCredit: string | null;
  imageLicense: string | null;
  officialUrl: string | null;
  pisteMapUrl: string | null;
  openskimapUrl: string | null;
  skipassUrl: string | null;
  rawScore: number;
  matchPct: number;
  apresScore: number | null;
  crowdScore: number | null;
  snowReliability: number;
  summerGlacierScore: number;
  infrastructureScore: number;
  infrastructureProfile: InfrastructureProfile;
  valueScore: number;
  cost: CostEstimate;
  budgetStatus: BudgetStatus;
  budgetClass: BudgetClass;
  slopeProfile: SlopeProfile;
  fitProfile: {
    slope: number;
    vibe: number;
    festival: number;
    snow: number;
    summer: number;
    offPiste: number;
    value: number;
    comfort: number;
  };
  tripStyleHint: string;
  vibeTags: ResortVibeTag[];
  eventBadges: string[];
  events: ResortEvent[];
  festivalFitScore: number;
  bestFor: string[];
  reasons: string[];
  drawbacks: string[];
  exclusionReasons: string[];
  alpivoScore: AlpivoScoreResult;
  matchLabel: string;
  recommendationType: string;
  categoryScores: AlpivoScoreResult["categoryScores"];
  weightedCategoryScores: AlpivoScoreResult["weightedScores"];
  scoreWeights: AlpivoScoreResult["weights"];
  estimatedCosts: AlpivoScoreResult["estimatedCosts"];
  missingDataNotes: string[];
};

const DEFAULT_PREFS: Required<
  Pick<
    MatchPreferences,
    | "apres"
    | "emptySlopes"
    | "infrastructure"
    | "huts"
    | "snowpark"
    | "easyRuns"
    | "challenging"
    | "snowReliability"
    | "valueForMoney"
    | "family"
    | "panorama"
    | "summerGlacier"
    | "offPiste"
  >
> = {
  apres: 3,
  emptySlopes: 3,
  infrastructure: 4,
  huts: 3,
  snowpark: 1,
  easyRuns: 3,
  challenging: 3,
  snowReliability: 3,
  valueForMoney: 3,
  family: 2,
  panorama: 3,
  summerGlacier: 0,
  offPiste: 0,
};

const WEIGHTS = {
  apres: 1.15,
  crowd: 1.25,
  infra: 1.05,
  hut: 0.9,
  park: 0.7,
  easy: 1.0,
  hard: 1.0,
  snow: 1.35,
  value: 1.15,
  family: 0.95,
  panorama: 0.75,
  summerGlacier: 1.25,
  offPiste: 1.15,
  profile: 2.8,
  scale: 0.1,
};

const number = new Intl.NumberFormat("de-DE");

function clamp(value: number, min = 0, max = 1) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function scoreValue(value: number | null | undefined, fallback = 0.5) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return clamp(value);
}

function prefValue(value: number | null | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback / 5;
  return clamp(value / 5);
}

function parseIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function tripDays(prefs: MatchPreferences = {}) {
  const start = parseIsoDate(prefs.tripStartDate);
  const end = parseIsoDate(prefs.tripEndDate);
  if (start && end && end >= start) {
    const diffMs = end.getTime() - start.getTime();
    return Math.max(1, Math.round(diffMs / 86400000) + 1);
  }
  return 1;
}

export function pickPisteKm(resort: ResortSignalRow) {
  return resort.piste_km_total ?? resort.piste_km ?? null;
}

export function deriveSlopeProfile(resort: ResortSignalRow): SlopeProfile {
  const total = pickPisteKm(resort);
  const easy = resort.piste_km_easy ?? null;
  const intermediate = resort.piste_km_intermediate ?? null;
  const advanced = resort.piste_km_advanced ?? null;
  const base = total && total > 0 ? total : null;

  return {
    total,
    easy,
    intermediate,
    advanced,
    easyShare: base && easy !== null ? clamp(easy / base) : null,
    intermediateShare: base && intermediate !== null ? clamp(intermediate / base) : null,
    advancedShare: base && advanced !== null ? clamp(advanced / base) : null,
  };
}

export function deriveSnowReliability(resort: ResortSignalRow) {
  const maxElevation = Number(resort.elevation_max_m ?? 0);
  const minElevation = Number(resort.elevation_min_m ?? 0);
  const vertical = Number(resort.vertical_m ?? Math.max(0, maxElevation - minElevation));
  const highScore = clamp((maxElevation - 950) / 1700);
  const verticalScore = clamp(vertical / 1200);
  const scaleScore = clamp(Number(pickPisteKm(resort) ?? 0) / 140);
  return clamp(highScore * 0.58 + verticalScore * 0.24 + scaleScore * 0.18);
}

function formatMetric(value: number | null | undefined, suffix = "") {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return "offen";
  const rounded = Math.round(value * 10) / 10;
  return `${number.format(rounded)}${suffix}`;
}

function signalDetail(score: number) {
  if (score >= 0.76) return "stark";
  if (score >= 0.6) return "gut";
  if (score >= 0.44) return "solide";
  return "begrenzt";
}

function hasUsefulStoredInfraScore(resort: ResortSignalRow) {
  return typeof resort.infra_score === "number" && Number.isFinite(resort.infra_score) && Math.abs(resort.infra_score - 0.5) > 0.001;
}

export function deriveInfrastructureProfile(resort: ResortSignalRow): InfrastructureProfile {
  const pisteKm = Number(pickPisteKm(resort) ?? 0);
  const lifts = Number(resort.lifts_count_total ?? 0);
  const runs = Number(resort.runs_count_total ?? 0);
  const maxElevation = Number(resort.elevation_max_m ?? 0);
  const minElevation = Number(resort.elevation_min_m ?? 0);
  const vertical = Number(resort.vertical_m ?? Math.max(0, maxElevation - minElevation));

  const liftScaleScore = clamp(Math.log1p(lifts) / Math.log1p(55));
  const liftCoverageScore = pisteKm > 0 ? clamp(lifts / pisteKm / 0.22) : liftScaleScore * 0.72;
  const liftScore = clamp(liftScaleScore * 0.58 + liftCoverageScore * 0.42);
  const terrainScore = clamp(
    clamp(Math.log1p(pisteKm) / Math.log1p(230)) * 0.44 +
      clamp(Math.log1p(runs) / Math.log1p(170)) * 0.26 +
      clamp(vertical / 1250) * 0.3
  );
  const hasSlopeBreakdown =
    typeof resort.piste_km_easy === "number" ||
    typeof resort.piste_km_intermediate === "number" ||
    typeof resort.piste_km_advanced === "number";
  const sourceHits = [
    resort.official_url,
    resort.piste_map_url,
    resort.openskimap_url,
    resort.skipass_url,
    hasSlopeBreakdown,
    lifts > 0,
    runs > 0,
    maxElevation > 0 && minElevation > 0,
  ].filter(Boolean).length;
  const sourceScore = clamp(sourceHits / 8);
  const verticalScore = clamp(vertical / 1250);
  const derivedScore = clamp(liftScore * 0.35 + terrainScore * 0.35 + sourceScore * 0.18 + verticalScore * 0.12);
  const storedScore = scoreValue(resort.infra_score);
  const hasStoredScore = hasUsefulStoredInfraScore(resort);
  const score = hasStoredScore ? clamp(derivedScore * 0.65 + storedScore * 0.35) : derivedScore;

  const summary =
    score >= 0.76
      ? "Sehr starke Infrastruktur: Lift- und Gebietsdaten sprechen fuer ein belastbares, gut erschlossenes Skigebiet."
      : score >= 0.6
        ? "Gute Infrastruktur: Gebiet, Lifte und Quellenabdeckung wirken solide fuer die meisten Trips."
        : score >= 0.44
          ? "Solide Infrastruktur: ausreichend fuer passende Trips, aber nicht der staerkste Treiber."
          : "Begrenzte Infrastruktur: eher kompakt oder mit noch duenner Datenlage.";

  return {
    score,
    source: hasStoredScore ? "combined" : "derived",
    sourceLabel: hasStoredScore ? "Datenbankwert plus Gebietsdaten" : "aus Gebietsdaten abgeleitet",
    summary,
    signals: [
      {
        label: "Liftabdeckung",
        value: formatMetric(lifts, " Lifte"),
        detail: signalDetail(liftScore),
        score: liftScore,
      },
      {
        label: "Gebietsgröße",
        value: formatMetric(pisteKm, " km"),
        detail: signalDetail(terrainScore),
        score: terrainScore,
      },
      {
        label: "Höhenprofil",
        value: formatMetric(vertical, " m"),
        detail: signalDetail(verticalScore),
        score: verticalScore,
      },
      {
        label: "Datenabdeckung",
        value: `${sourceHits}/8`,
        detail: signalDetail(sourceScore),
        score: sourceScore,
      },
    ],
  };
}

function derivePanoramaScore(resort: ResortSignalRow) {
  const maxElevation = Number(resort.elevation_max_m ?? 0);
  const vertical = Number(resort.vertical_m ?? 0);
  const pisteKm = Number(pickPisteKm(resort) ?? 0);
  return clamp(((maxElevation - 900) / 1900) * 0.48 + clamp(vertical / 1300) * 0.3 + clamp(pisteKm / 160) * 0.22);
}

export function deriveOffPisteScore(resort: ResortSignalRow) {
  const maxElevation = Number(resort.elevation_max_m ?? 0);
  const vertical = Number(resort.vertical_m ?? 0);
  const pisteKm = Number(pickPisteKm(resort) ?? 0);
  const advanced = scoreValue(resort.advanced_score, 0.42);
  const snow = deriveSnowReliability(resort);
  const quiet = 1 - scoreValue(resort.crowd_score, 0.55);
  const park = scoreValue(resort.park_score, 0.35);
  const altitude = clamp((maxElevation - 1450) / 1550);
  const verticalScore = clamp(vertical / 1200);
  const terrainScale = clamp(Math.log1p(Math.max(0, pisteKm)) / Math.log1p(170));

  return clamp(
    advanced * 0.25 +
      snow * 0.24 +
      altitude * 0.17 +
      verticalScore * 0.15 +
      quiet * 0.09 +
      terrainScale * 0.06 +
      park * 0.04
  );
}

const SUMMER_GLACIER_HINTS = [
  "hintertux",
  "stubai",
  "stubaier",
  "kaunertal",
  "pitztal",
  "soelden",
  "solden",
  "kitzsteinhorn",
  "kaprun",
  "moelltal",
  "molltal",
  "moelltaler",
  "molltaler",
  "zermatt",
  "matterhorn",
  "saas-fee",
  "saas fee",
  "saasfee",
  "les 2 alpes",
  "deux alpes",
  "tignes",
  "val d isere",
  "valdisere",
  "cervinia",
  "stelvio",
  "schnalstal",
  "senales",
];

function normalizeSearchText(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function deriveSummerGlacierScore(resort: ResortSignalRow) {
  const text = normalizeSearchText(`${resort.name} ${resort.region ?? ""} ${resort.slug ?? ""}`);
  const hasNamedGlacier = SUMMER_GLACIER_HINTS.some((hint) => text.includes(hint));
  const hasGlacierWord = text.includes("gletscher") || text.includes("glacier") || text.includes("glaciar");
  const maxElevation = Number(resort.elevation_max_m ?? 0);
  const vertical = Number(resort.vertical_m ?? 0);
  const snow = deriveSnowReliability(resort);
  const altitudeScore = clamp((maxElevation - 2550) / 950);
  const veryHighScore = clamp((maxElevation - 3000) / 700);
  const verticalScore = clamp(vertical / 1200);
  const namedScore = hasNamedGlacier ? 1 : hasGlacierWord ? 0.82 : 0;

  if (namedScore > 0) {
    return clamp(namedScore * 0.58 + altitudeScore * 0.24 + snow * 0.12 + verticalScore * 0.06);
  }

  if (maxElevation >= 3150) {
    return clamp(0.34 + veryHighScore * 0.3 + altitudeScore * 0.2 + snow * 0.16, 0, 0.56);
  }

  return clamp(altitudeScore * 0.42 + snow * 0.22 + verticalScore * 0.12, 0, 0.54);
}

function deriveFamilyScore(resort: ResortSignalRow) {
  const beginner = scoreValue(resort.beginner_score);
  const quiet = 1 - scoreValue(resort.crowd_score);
  const infra = deriveInfrastructureProfile(resort).score;
  const value = 1 - clamp(((resort.skipass_price_from ?? 70) - 45) / 65);
  return clamp(beginner * 0.38 + quiet * 0.25 + infra * 0.22 + value * 0.15);
}

function deriveSlopeFit(prefs: MatchPreferences, resort: ResortSignalRow) {
  const easyWeight = prefValue(prefs.easyRuns, DEFAULT_PREFS.easyRuns);
  const hardWeight = prefValue(prefs.challenging, DEFAULT_PREFS.challenging);
  const beginner = scoreValue(resort.beginner_score);
  const advanced = scoreValue(resort.advanced_score);
  const denominator = Math.max(0.001, easyWeight + hardWeight);
  return clamp((easyWeight * beginner + hardWeight * advanced) / denominator);
}

function deriveVibeFit(prefs: MatchPreferences, resort: ResortSignalRow) {
  const apresWeight = prefValue(prefs.apres, DEFAULT_PREFS.apres);
  const quietWeight = prefValue(prefs.emptySlopes, DEFAULT_PREFS.emptySlopes);
  const hutWeight = prefValue(prefs.huts, DEFAULT_PREFS.huts);
  const parkWeight = prefValue(prefs.snowpark, DEFAULT_PREFS.snowpark);
  const denominator = Math.max(0.001, apresWeight + quietWeight + hutWeight + parkWeight);
  return clamp(
    (apresWeight * scoreValue(resort.apres_score) +
      quietWeight * (1 - scoreValue(resort.crowd_score)) +
      hutWeight * scoreValue(resort.hut_score) +
      parkWeight * scoreValue(resort.park_score, 0.35)) /
      denominator
  );
}

function deriveTripStyleScore(style: TripStyle | undefined, resort: ResortSignalRow, cost: CostEstimate) {
  const normalizedStyle = style ?? "balanced";
  const value = deriveValueScore(resort, cost);
  const snow = deriveSnowReliability(resort);
  const summerGlacier = deriveSummerGlacierScore(resort);
  const offPiste = deriveOffPisteScore(resort);
  const family = deriveFamilyScore(resort);
  const panorama = derivePanoramaScore(resort);
  const quiet = 1 - scoreValue(resort.crowd_score);
  const pisteKm = clamp(Number(pickPisteKm(resort) ?? 0) / 160);
  const apres = scoreValue(resort.apres_score);
  const advanced = scoreValue(resort.advanced_score);
  const infra = deriveInfrastructureProfile(resort).score;
  const huts = scoreValue(resort.hut_score);
  const km = Number(pickPisteKm(resort) ?? 0);
  const sizeSweetSpot = (min: number, max: number, hardMax: number) => {
    if (!km) return 0.45;
    if (km >= min && km <= max) return 1;
    if (km < min) return clamp(km / min);
    return 1 - clamp((km - max) / Math.max(1, hardMax - max), 0, 0.72);
  };

  if (normalizedStyle === "budget") return clamp(value * 0.45 + sizeSweetSpot(8, 95, 220) * 0.25 + quiet * 0.18 + family * 0.12);
  if (normalizedStyle === "apres") return clamp(apres * 0.54 + huts * 0.2 + infra * 0.14 + pisteKm * 0.12);
  if (normalizedStyle === "family") {
    return clamp(family * 0.42 + sizeSweetSpot(8, 85, 190) * 0.34 + quiet * 0.14 + value * 0.1);
  }
  if (normalizedStyle === "sport") return clamp(advanced * 0.46 + pisteKm * 0.25 + infra * 0.17 + snow * 0.12);
  if (normalizedStyle === "premium") return clamp(infra * 0.3 + huts * 0.22 + snow * 0.2 + panorama * 0.18 + pisteKm * 0.1);
  if (normalizedStyle === "quiet") return clamp(quiet * 0.42 + sizeSweetSpot(6, 70, 180) * 0.24 + panorama * 0.18 + value * 0.16);
  if (normalizedStyle === "powder") return clamp(snow * 0.48 + advanced * 0.2 + panorama * 0.18 + pisteKm * 0.14);
  if (normalizedStyle === "glacier") return clamp(summerGlacier * 0.56 + snow * 0.18 + infra * 0.12 + panorama * 0.08 + value * 0.06);
  if (normalizedStyle === "offpiste") return clamp(offPiste * 0.54 + snow * 0.18 + advanced * 0.14 + quiet * 0.08 + value * 0.06);
  return clamp(value * 0.2 + snow * 0.22 + family * 0.16 + panorama * 0.16 + pisteKm * 0.14 + infra * 0.12);
}

function deriveTripStyleHint(style: TripStyle | undefined) {
  if (style === "budget") return "Budget clever";
  if (style === "apres") return "Après & Gruppe";
  if (style === "family") return "Familie entspannt";
  if (style === "sport") return "Sportlich groß";
  if (style === "premium") return "Premium Panorama";
  if (style === "quiet") return "Ruhige Alpenzeit";
  if (style === "powder") return "Schnee & Höhenlage";
  if (style === "glacier") return "Sommer-Gletscher";
  if (style === "offpiste") return "Off-Piste Finder";
  return "Ausgewogener Match";
}

export function deriveBudgetClass(resort: ResortSignalRow, cost: Pick<CostEstimate, "dayTripMax">): BudgetClass {
  const skipass = resort.skipass_price_from ?? 0;
  const day = cost.dayTripMax ?? skipass;
  if ((skipass > 0 && skipass <= 58) || day <= 125) return "budget";
  if ((skipass > 0 && skipass >= 82) || day >= 185) return "premium";
  return "mid-range";
}

function countryCostFactor(country: string | null | undefined) {
  const normalized = normalizeSearchText(country);
  if (normalized.includes("schweiz") || normalized.includes("switzerland")) return 1.34;
  if (normalized.includes("frankreich") || normalized.includes("france")) return 1.08;
  if (normalized.includes("osterreich") || normalized.includes("austria")) return 1;
  if (normalized.includes("italien") || normalized.includes("italy")) return 0.96;
  if (normalized.includes("deutschland") || normalized.includes("germany")) return 0.92;
  return 1;
}

function foodDailyRange(country: string | null | undefined, level: MatchPreferences["foodSpendLevel"]) {
  const factor = countryCostFactor(country);
  const resolved = level ?? "standard";
  const base =
    resolved === "budget"
      ? { min: 18, max: 34 }
      : resolved === "comfort"
        ? { min: 48, max: 88 }
        : { min: 30, max: 56 };

  return {
    level: resolved,
    min: Math.round(base.min * factor),
    max: Math.round(base.max * factor),
  };
}

function accommodationNightRange(country: string | null | undefined, budgetClass: BudgetClass) {
  const factor = countryCostFactor(country);
  const base =
    budgetClass === "budget"
      ? { min: 42, max: 78 }
      : budgetClass === "premium"
        ? { min: 95, max: 185 }
        : { min: 62, max: 125 };

  return {
    min: Math.round(base.min * factor),
    max: Math.round(base.max * factor),
  };
}

export function estimateResortCost(prefs: MatchPreferences = {}, resort: ResortSignalRow): CostEstimate {
  const days = tripDays(prefs);
  const needsRental = prefs.rentalMode ? prefs.rentalMode === "rent" : Boolean(prefs.needRental);
  const peopleCount = Math.max(1, Math.round(Number(prefs.peopleCount ?? 1)));
  const pisteKm = Number(pickPisteKm(resort) ?? 0);
  const skipass = resort.skipass_price_from;
  const passSource = typeof skipass === "number" && skipass > 0 ? "stored" : "estimated";
  const basePassMin = Math.max(34, 30 + pisteKm * 0.22);
  const basePassMax = Math.max(52, 44 + pisteKm * 0.34);
  const passMin = (typeof skipass === "number" && skipass > 0 ? skipass : basePassMin) * days;
  const passMax =
    (typeof skipass === "number" && skipass > 0 ? Math.max(skipass, basePassMax) : basePassMax) * days;

  const rentalMin = needsRental ? 24 * days : 0;
  const rentalMax = needsRental ? 48 * days : 0;
  const roughBudgetClass = deriveBudgetClass(resort, {
    dayTripMax: typeof skipass === "number" && skipass > 0 ? skipass : basePassMax,
  });
  const nights = Math.max(0, days - 1);
  const accommodation = accommodationNightRange(resort.country, roughBudgetClass);
  const accommodationMin = nights * accommodation.min;
  const accommodationMax = nights * accommodation.max;
  const parkingMin = (prefs.travelMode === "train" ? 0 : 6) * days;
  const parkingMax = (prefs.travelMode === "train" ? 0 : 18) * days;
  const travelMode = prefs.travelMode ?? "car";
  const fallbackTravel =
    travelMode === "train"
      ? { min: 38 * days, max: 105 * days, source: "provider" as const }
      : travelMode === "bus"
        ? { min: 24 * days, max: 78 * days, source: "provider" as const }
        : travelMode === "flight"
          ? { min: 120, max: 330, source: "provider" as const }
          : { min: Math.round(58 / peopleCount), max: Math.round(155 / peopleCount), source: "fallback" as const };
  const travelMin = fallbackTravel.min;
  const travelMax = fallbackTravel.max;
  const food = foodDailyRange(resort.country, prefs.foodSpendLevel);
  const foodMin = food.min * days;
  const foodMax = food.max * days;
  const totalMin = Math.round(passMin + rentalMin + accommodationMin + travelMin + parkingMin + foodMin);
  const totalMax = Math.round(passMax + rentalMax + accommodationMax + travelMax + parkingMax + foodMax);

  const oneDay = {
    passMin: typeof skipass === "number" && skipass > 0 ? skipass : basePassMin,
    passMax: typeof skipass === "number" && skipass > 0 ? Math.max(skipass, basePassMax) : basePassMax,
  };
  const dayTravelMin =
    travelMode === "car" ? Math.round(58 / peopleCount) : travelMode === "bus" ? 24 : travelMode === "train" ? 38 : 120;
  const dayTravelMax =
    travelMode === "car" ? Math.round(155 / peopleCount) : travelMode === "bus" ? 78 : travelMode === "train" ? 105 : 330;
  const dayFood = foodDailyRange(resort.country, prefs.foodSpendLevel);
  const dayTripMin = Math.round(oneDay.passMin + (needsRental ? 24 : 0) + dayTravelMin + (prefs.travelMode === "train" ? 0 : 6) + dayFood.min);
  const dayTripMax = Math.round(oneDay.passMax + (needsRental ? 48 : 0) + dayTravelMax + (prefs.travelMode === "train" ? 0 : 18) + dayFood.max);
  const weekendLodging = accommodationNightRange(resort.country, roughBudgetClass);
  const weekLodging = accommodationNightRange(resort.country, roughBudgetClass);

  return {
    passSource,
    passMin: Math.round(passMin),
    passMax: Math.round(passMax),
    rentalMin,
    rentalMax,
    accommodationMin,
    accommodationMax,
    travelMin,
    travelMax,
    travelSource: fallbackTravel.source,
    parkingMin,
    parkingMax,
    foodMin,
    foodMax,
    foodSource: "country-estimate",
    foodLevel: food.level,
    totalMin,
    totalMax,
    dayTripMin,
    dayTripMax,
    weekendMin: Math.round(dayTripMin * 2 + weekendLodging.min),
    weekendMax: Math.round(dayTripMax * 2 + weekendLodging.max),
    weekMin: Math.round(dayTripMin * 6 + weekLodging.min * 6),
    weekMax: Math.round(dayTripMax * 6 + weekLodging.max * 6),
  };
}

export function deriveExclusionReasons(prefs: MatchPreferences = {}, resort: ResortSignalRow, cost: CostEstimate) {
  const out: string[] = [];
  const normalizedExcludedCountries = new Set(
    (prefs.excludeCountries ?? []).map((country) => normalizeSearchText(country)).filter(Boolean)
  );
  const country = normalizeSearchText(resort.country);
  const nextCost = cost ?? estimateResortCost(prefs, resort);
  const budgetClass = deriveBudgetClass(resort, nextCost);
  const summerGlacier = deriveSummerGlacierScore(resort);
  const pisteKm = Number(pickPisteKm(resort) ?? 0);
  const beginner = scoreValue(resort.beginner_score);
  const advanced = scoreValue(resort.advanced_score);
  const apres = scoreValue(resort.apres_score);

  if (country && normalizedExcludedCountries.has(country)) out.push(resort.country);
  if (prefs.excludeGlacier && summerGlacier >= 0.58) out.push("Gletscher/Sommer-Ski-Signal");
  if (prefs.excludePremium && budgetClass === "premium") out.push("sehr teurer Kostenrahmen");
  if (prefs.excludeFamilyOnly && beginner >= 0.72 && advanced < 0.45 && apres < 0.45 && pisteKm > 0 && pisteKm < 55) {
    out.push("starkes Familien-/Anfängerprofil");
  }

  return out;
}

export function deriveBudgetStatus(budgetCap: number, min: number, max: number): BudgetStatus {
  if (!Number.isFinite(budgetCap) || budgetCap <= 0) return "green";
  if (max <= budgetCap) return "green";
  if (min <= budgetCap * 1.1) return "yellow";
  return "red";
}

export function deriveValueScore(resort: ResortSignalRow, cost: CostEstimate) {
  const pisteKm = Math.max(8, Number(pickPisteKm(resort) ?? 8));
  const pass = resort.skipass_price_from ?? cost.dayTripMax * 0.55;
  const pricePerKm = pass / pisteKm;
  const efficiency = 1 - clamp((pricePerKm - 0.28) / 1.2);
  const infra = deriveInfrastructureProfile(resort).score;
  return clamp(efficiency * 0.68 + infra * 0.32);
}

export function deriveVibeTags(resort: ResortSignalRow): ResortVibeTag[] {
  const tags: ResortVibeTag[] = [];
  const apres = scoreValue(resort.apres_score);
  const quiet = 1 - scoreValue(resort.crowd_score);
  const huts = scoreValue(resort.hut_score);
  const park = scoreValue(resort.park_score, 0.35);
  const beginner = scoreValue(resort.beginner_score);
  const advanced = scoreValue(resort.advanced_score);
  const snow = deriveSnowReliability(resort);
  const summerGlacier = deriveSummerGlacierScore(resort);
  const offPiste = deriveOffPisteScore(resort);
  const infra = deriveInfrastructureProfile(resort).score;
  const pisteKm = Number(pickPisteKm(resort) ?? 0);

  if (apres >= 0.68) tags.push({ label: "Energetischer Après-Ski", score: apres, tone: "amber" });
  if (quiet >= 0.62) tags.push({ label: "Ruhigere Hänge", score: quiet, tone: "green" });
  if (huts >= 0.68) tags.push({ label: "Starke Hüttenkultur", score: huts, tone: "amber" });
  if (park >= 0.56) tags.push({ label: "Snowpark relevant", score: park, tone: "ice" });
  if (beginner >= 0.68) tags.push({ label: "Einsteigerfreundlich", score: beginner, tone: "green" });
  if (advanced >= 0.66) tags.push({ label: "Sportlich anspruchsvoll", score: advanced, tone: "ice" });
  if (summerGlacier >= 0.66) tags.push({ label: "Sommer-Gletscher Kandidat", score: summerGlacier, tone: "ice" });
  if (offPiste >= 0.62) tags.push({ label: "Off-Piste Potenzial", score: offPiste, tone: "ice" });
  if (snow >= 0.66) tags.push({ label: "Schneesicherer Eindruck", score: snow, tone: "ice" });
  if (infra >= 0.72) tags.push({ label: "Moderne Liftlogik", score: infra, tone: "slate" });
  if (pisteKm >= 120) tags.push({ label: "Großes Skigebiet", score: clamp(pisteKm / 220), tone: "slate" });

  if (tags.length === 0) {
    tags.push({ label: "Solider Allrounder", score: 0.55, tone: "slate" });
  }

  return tags.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function deriveBestFor(resort: ResortSignalRow, budgetClass: BudgetClass) {
  const out: string[] = [];
  const apres = scoreValue(resort.apres_score);
  const quiet = 1 - scoreValue(resort.crowd_score);
  const beginner = scoreValue(resort.beginner_score);
  const advanced = scoreValue(resort.advanced_score);
  const snow = deriveSnowReliability(resort);
  const summerGlacier = deriveSummerGlacierScore(resort);
  const offPiste = deriveOffPisteScore(resort);
  const pisteKm = Number(pickPisteKm(resort) ?? 0);

  if (budgetClass === "budget") out.push("Studierende");
  if (apres >= 0.68) out.push("Gruppen");
  if (quiet >= 0.62) out.push("Paare");
  if (beginner >= 0.68) out.push("Anfänger");
  if (advanced >= 0.66) out.push("Fortgeschrittene");
  if (offPiste >= 0.62) out.push("Off-Piste");
  if (summerGlacier >= 0.66) out.push("Sommer-Ski");
  if (snow >= 0.66 && pisteKm >= 80) out.push("Wochenenden");
  if (budgetClass === "premium") out.push("Komfort-Reisen");
  if (out.length === 0) out.push("Allround-Trips");

  return Array.from(new Set(out)).slice(0, 4);
}

export function deriveReasons(prefs: MatchPreferences = {}, resort: ResortSignalRow, cost: CostEstimate) {
  const out: string[] = [];
  const apresImportance = prefs.apres ?? DEFAULT_PREFS.apres;
  const quietImportance = prefs.emptySlopes ?? DEFAULT_PREFS.emptySlopes;
  const easyImportance = prefs.easyRuns ?? DEFAULT_PREFS.easyRuns;
  const hardImportance = prefs.challenging ?? DEFAULT_PREFS.challenging;
  const pisteKm = pickPisteKm(resort);
  const snow = deriveSnowReliability(resort);
  const value = deriveValueScore(resort, cost);
  const family = deriveFamilyScore(resort);
  const panorama = derivePanoramaScore(resort);
  const summerGlacier = deriveSummerGlacierScore(resort);
  const offPiste = deriveOffPisteScore(resort);
  const style = prefs.tripStyle ?? "balanced";

  if (style === "family" && family >= 0.52) {
    out.push("Familienprofil: ruhiger, einfacher und planbarer als viele Alternativen");
  }
  if (style === "budget" && value >= 0.58) {
    out.push("Budgetprofil: viel Skigebiet im Verhältnis zu den geschätzten Kosten");
  }
  if (style === "apres" && scoreValue(resort.apres_score) >= 0.55) {
    out.push("Crew-Fit: Après-Ski, Hütten und Gruppenvibe sind starke Treiber");
  }
  if (style === "sport" && scoreValue(resort.advanced_score) >= 0.55) {
    out.push("Sportprofil: genügend Anspruch für Fahrer, die mehr als blaue Pisten wollen");
  }
  if (style === "premium" && panorama >= 0.58) {
    out.push("Premiumprofil: Panorama, Höhenlage und Infrastruktur tragen den Match");
  }
  if (style === "quiet" && 1 - scoreValue(resort.crowd_score) >= 0.55) {
    out.push("Ruheprofil: weniger Trubel ist ein relevanter Pluspunkt");
  }
  if (style === "powder" && snow >= 0.6) {
    out.push("Schneeprofil: Höhenlage und Gebietsdaten sprechen für stabilere Bedingungen");
  }
  if (style === "glacier" && summerGlacier >= 0.58) {
    out.push("Sommer-Gletscher: hohe Lage oder bekannte Gletscher-Signale machen das Resort spannender");
  }
  if (style === "offpiste" && offPiste >= 0.58) {
    out.push("Off-Piste-Profil: Höhenlage, sportliches Terrain und geringerer Andrang sprechen dafür");
  }

  if (apresImportance >= 4 && scoreValue(resort.apres_score) >= 0.65) out.push("starke Après-Ski-Signale");
  if (quietImportance >= 4 && 1 - scoreValue(resort.crowd_score) >= 0.6) out.push("wirkt weniger überlaufen");
  if ((prefs.infrastructure ?? DEFAULT_PREFS.infrastructure) >= 4 && deriveInfrastructureProfile(resort).score >= 0.68) {
    out.push("gute Lift- und Infrastrukturwerte");
  }
  if ((prefs.huts ?? DEFAULT_PREFS.huts) >= 4 && scoreValue(resort.hut_score) >= 0.68) {
    out.push("passt, wenn Hütten wichtig sind");
  }
  if ((prefs.snowpark ?? DEFAULT_PREFS.snowpark) >= 4 && scoreValue(resort.park_score, 0.35) >= 0.55) {
    out.push("Snowpark ist ein echter Pluspunkt");
  }
  if (easyImportance >= 4 && scoreValue(resort.beginner_score) >= 0.68) out.push("freundlich für einfache Pisten");
  if (hardImportance >= 4 && scoreValue(resort.advanced_score) >= 0.64) out.push("genug sportliche Optionen");
  if (snow >= 0.66) out.push("Höhenlage spricht für bessere Schneesicherheit");
  if (value >= 0.64) out.push("Preis-Leistung wirkt stark");
  if ((prefs.family ?? DEFAULT_PREFS.family) >= 4 && family >= 0.6) out.push("entspannter Fit für Familien oder Anfänger");
  if ((prefs.panorama ?? DEFAULT_PREFS.panorama) >= 4 && panorama >= 0.62) out.push("starker Panorama- und Höhenlagen-Faktor");
  if ((prefs.summerGlacier ?? DEFAULT_PREFS.summerGlacier) >= 4 && summerGlacier >= 0.58) {
    out.push("relevant, wenn du Sommer-Ski oder Gletscherbetrieb prüfen willst");
  }
  if ((prefs.offPiste ?? DEFAULT_PREFS.offPiste) >= 4 && offPiste >= 0.58) {
    out.push("spannend für Off-Piste-orientierte Fahrer");
  }
  if (pisteKm && pisteKm >= 80) out.push(`${number.format(pisteKm)} km Pisten geben viel Auswahl`);

  if (out.length < 3) out.push("guter Allround-Fit für deinen Kriterienmix");
  if (out.length < 3) out.push("Kosten, Vibe und Pistenprofil sind ausgewogen");
  if (out.length < 3) out.push("genug Datenpunkte für eine belastbare Vorauswahl");

  return Array.from(new Set(out)).slice(0, 3);
}

export function deriveDrawbacks(resort: ResortSignalRow, budgetClass: BudgetClass, prefs: MatchPreferences = {}) {
  const out: string[] = [];
  const pisteKm = Number(pickPisteKm(resort) ?? 0);
  const crowd = scoreValue(resort.crowd_score);
  const snow = deriveSnowReliability(resort);
  const summerGlacier = deriveSummerGlacierScore(resort);
  const offPiste = deriveOffPisteScore(resort);
  const beginner = scoreValue(resort.beginner_score);
  const advanced = scoreValue(resort.advanced_score);
  const glacierRequested = prefs.tripStyle === "glacier" || (prefs.summerGlacier ?? 0) >= 4;
  const offPisteRequested = prefs.tripStyle === "offpiste" || (prefs.offPiste ?? 0) >= 4;

  if (glacierRequested && summerGlacier < 0.5) {
    out.push("Sommer-Gletscherbetrieb ist hier kein starkes Signal");
  }
  if (offPisteRequested && offPiste < 0.48) {
    out.push("Off-Piste-Signal ist in den vorhandenen Daten schwach");
  }
  if (glacierRequested && summerGlacier >= 0.58) out.push("Sommerbetrieb und Gletscher-Status saisonal offiziell prüfen");
  if (budgetClass === "premium") out.push("kann in der Hauptsaison teuer werden");
  if (crowd >= 0.68) out.push("an starken Wochenenden potenziell voll");
  if (snow < 0.42) out.push("Schneesicherheit hängt stärker vom Wetter ab");
  if (pisteKm > 0 && pisteKm < 35) out.push("für lange Skiwochen eher kompakt");
  if (beginner < 0.42) out.push("für komplette Anfänger nicht ideal");
  if (advanced < 0.42) out.push("für sehr sportliche Fahrer begrenzter");
  if (out.length === 0) out.push("Verfügbarkeit und Preise vor Buchung prüfen");

  return out.slice(0, 2);
}

export function scoreResort(prefs: MatchPreferences = {}, resort: ResortSignalRow, cost: CostEstimate) {
  const apresWeight = WEIGHTS.apres * prefValue(prefs.apres, DEFAULT_PREFS.apres);
  const crowdWeight = WEIGHTS.crowd * prefValue(prefs.emptySlopes, DEFAULT_PREFS.emptySlopes);
  const infraWeight = WEIGHTS.infra * prefValue(prefs.infrastructure, DEFAULT_PREFS.infrastructure);
  const hutWeight = WEIGHTS.hut * prefValue(prefs.huts, DEFAULT_PREFS.huts);
  const parkWeight = WEIGHTS.park * prefValue(prefs.snowpark, DEFAULT_PREFS.snowpark);
  const easyWeight = WEIGHTS.easy * prefValue(prefs.easyRuns, DEFAULT_PREFS.easyRuns);
  const hardWeight = WEIGHTS.hard * prefValue(prefs.challenging, DEFAULT_PREFS.challenging);
  const snowWeight = WEIGHTS.snow * prefValue(prefs.snowReliability, DEFAULT_PREFS.snowReliability);
  const valueWeight = WEIGHTS.value * prefValue(prefs.valueForMoney, DEFAULT_PREFS.valueForMoney);
  const familyWeight = WEIGHTS.family * prefValue(prefs.family, DEFAULT_PREFS.family);
  const panoramaWeight = WEIGHTS.panorama * prefValue(prefs.panorama, DEFAULT_PREFS.panorama);
  const summerGlacierWeight = WEIGHTS.summerGlacier * prefValue(prefs.summerGlacier, DEFAULT_PREFS.summerGlacier);
  const offPisteWeight = WEIGHTS.offPiste * prefValue(prefs.offPiste, DEFAULT_PREFS.offPiste);
  const profileWeight = WEIGHTS.profile;
  const fixedWeight = WEIGHTS.scale + profileWeight;
  const maxScore =
    apresWeight +
    crowdWeight +
    infraWeight +
    hutWeight +
    parkWeight +
    easyWeight +
    hardWeight +
    snowWeight +
    valueWeight +
    familyWeight +
    panoramaWeight +
    summerGlacierWeight +
    offPisteWeight +
    fixedWeight;

  const pisteKm = Number(pickPisteKm(resort) ?? 0);
  const snowScore = deriveSnowReliability(resort);
  const valueScore = deriveValueScore(resort, cost);
  const familyScore = deriveFamilyScore(resort);
  const panoramaScore = derivePanoramaScore(resort);
  const summerGlacierScore = deriveSummerGlacierScore(resort);
  const offPisteScore = deriveOffPisteScore(resort);
  const infraScore = deriveInfrastructureProfile(resort).score;
  const quietScore = 1 - scoreValue(resort.crowd_score);
  const largeAreaScore = clamp(Math.log1p(Math.max(0, pisteKm)) / Math.log1p(230));
  const compactQualityScore = clamp((snowScore + valueScore + infraScore + quietScore) / 4);
  const scaleScore = clamp(largeAreaScore * 0.65 + compactQualityScore * 0.35);
  const profileScore = deriveTripStyleScore(prefs.tripStyle, resort, cost);
  const rawScore =
    apresWeight * scoreValue(resort.apres_score) +
    crowdWeight * (1 - scoreValue(resort.crowd_score)) +
    infraWeight * infraScore +
    hutWeight * scoreValue(resort.hut_score) +
    parkWeight * scoreValue(resort.park_score, 0.35) +
    easyWeight * scoreValue(resort.beginner_score) +
    hardWeight * scoreValue(resort.advanced_score) +
    snowWeight * snowScore +
    valueWeight * valueScore +
    familyWeight * familyScore +
    panoramaWeight * panoramaScore +
    summerGlacierWeight * summerGlacierScore +
    offPisteWeight * offPisteScore +
    profileWeight * profileScore +
    WEIGHTS.scale * scaleScore;

  let matchPct = Math.round(clamp(rawScore / Math.max(0.001, maxScore)) * 100);
  const style = prefs.tripStyle ?? "balanced";
  if (style === "family" && pisteKm > 120) matchPct -= Math.min(18, Math.round((pisteKm - 120) / 12));
  if (style === "family" && pisteKm > 240) matchPct -= 8;
  if (style === "quiet" && pisteKm > 130) matchPct -= Math.min(14, Math.round((pisteKm - 130) / 18));
  if (style === "budget" && cost.dayTripMax > 175) matchPct -= Math.min(16, Math.round((cost.dayTripMax - 175) / 12));
  if (style === "budget" && pisteKm > 145) matchPct -= Math.min(12, Math.round((pisteKm - 145) / 18));
  if (style === "sport" && pisteKm > 0 && pisteKm < 45) matchPct -= Math.min(14, Math.round((45 - pisteKm) / 4));
  if (style === "premium" && derivePanoramaScore(resort) < 0.48) matchPct -= 7;
  if (style === "apres" && scoreValue(resort.apres_score) < 0.46) matchPct -= 8;
  if (style === "glacier" && summerGlacierScore < 0.55) matchPct -= 18;
  if (style === "offpiste" && offPisteScore < 0.52) matchPct -= 16;
  if (pisteKm > 0 && pisteKm < 35 && compactQualityScore >= 0.62 && (style === "budget" || style === "family" || style === "quiet")) {
    matchPct += 5;
  }

  return {
    rawScore,
    matchPct: Math.max(0, Math.min(100, matchPct)),
  };
}

export function deriveFitProfile(prefs: MatchPreferences = {}, resort: ResortSignalRow, cost: CostEstimate) {
  const infraScore = deriveInfrastructureProfile(resort).score;
  return {
    slope: deriveSlopeFit(prefs, resort),
    vibe: deriveVibeFit(prefs, resort),
    snow: deriveSnowReliability(resort),
    summer: deriveSummerGlacierScore(resort),
    offPiste: deriveOffPisteScore(resort),
    value: deriveValueScore(resort, cost),
    comfort: clamp((deriveFamilyScore(resort) + infraScore + (1 - scoreValue(resort.crowd_score))) / 3),
  };
}

export function resolveBudgetCap(prefs: MatchPreferences = {}) {
  let minBudget = Number(prefs.budgetMin ?? 0);
  let maxBudget = Number(prefs.budgetMax ?? prefs.budget ?? 0);
  if (minBudget < 0) minBudget = 0;
  if (maxBudget < 0) maxBudget = 0;
  if (maxBudget > 0 && minBudget > maxBudget) {
    const tmp = minBudget;
    minBudget = maxBudget;
    maxBudget = tmp;
  }
  return maxBudget > 0 ? maxBudget : minBudget;
}

function deriveTripTypeForAlpivo(prefs: MatchPreferences): UserPreferences["tripType"] {
  const days = tripDays(prefs);
  if (days <= 1) return "day_trip";
  if (days <= 3) return "weekend";
  if (days >= 6) return "week";
  return "multi_day";
}

function deriveSkillLevelForAlpivo(prefs: MatchPreferences): UserPreferences["skillLevel"] {
  const easy = prefs.easyRuns ?? DEFAULT_PREFS.easyRuns;
  const hard = prefs.challenging ?? DEFAULT_PREFS.challenging;
  if ((prefs.tripStyle === "offpiste" || (prefs.offPiste ?? 0) >= 4) && hard >= 4) return "expert";
  if (prefs.tripStyle === "sport" || (hard >= 4 && easy <= 2)) return "advanced";
  if (easy >= 4 && hard <= 2) return "beginner";
  if (easy >= 4 && hard >= 4) return "mixed";
  return "mixed";
}

function deriveAccommodationStyleForAlpivo(prefs: MatchPreferences): UserPreferences["accommodationStyle"] {
  const budget = resolveBudgetCap(prefs);
  if (budget > 0 && budget <= 340) return "budget";
  if (budget >= 700 || prefs.tripStyle === "premium") return "comfort";
  return "standard";
}

function mapTravelModeForAlpivo(mode: MatchPreferences["travelMode"]): UserPreferences["travelMode"] {
  if (mode === "car" || mode === "train" || mode === "bus") return mode;
  return "unknown";
}

function toAlpivoUserPreferences(prefs: MatchPreferences = {}): UserPreferences {
  const tripType = deriveTripTypeForAlpivo(prefs);
  const budget = resolveBudgetCap(prefs);
  const skillLevel = deriveSkillLevelForAlpivo(prefs);
  const partyPreference = prefs.partyPreference ?? (prefs.tripStyle === "apres" ? "party_places" : prefs.tripStyle === "quiet" ? "quiet_no_events" : "indifferent");
  const wantsFestival = partyPreference === "festival_event";
  const wantsApresSki =
    (prefs.apres ?? 0) >= 4 ||
    prefs.tripStyle === "apres" ||
    partyPreference === "some_apres" ||
    partyPreference === "party_places" ||
    partyPreference === "festival_event";
  const wantsQuiet = (prefs.emptySlopes ?? 0) >= 4 || prefs.tripStyle === "quiet" || partyPreference === "quiet_no_events";
  return {
    tripType,
    days: tripDays(prefs),
    people: Math.max(1, Math.round(Number(prefs.peopleCount ?? 1))),
    budgetPerPerson: budget > 0 ? budget : undefined,
    skillLevel,
    hasTripDates: Boolean(prefs.tripStartDate && prefs.tripEndDate),
    tripStartDate: prefs.tripStartDate ?? null,
    tripEndDate: prefs.tripEndDate ?? null,
    priorities: {
      budget: prefs.valueForMoney ?? (prefs.tripStyle === "budget" ? 5 : 3),
      distance: tripType === "day_trip" ? 5 : tripType === "weekend" ? 4 : 2,
      snow: prefs.snowReliability ?? DEFAULT_PREFS.snowReliability,
      apresSki: prefs.apres ?? DEFAULT_PREFS.apres,
      quiet: prefs.emptySlopes ?? DEFAULT_PREFS.emptySlopes,
      pisteSize: Math.max(prefs.challenging ?? DEFAULT_PREFS.challenging, prefs.infrastructure ?? DEFAULT_PREFS.infrastructure),
      offPiste: prefs.offPiste ?? DEFAULT_PREFS.offPiste,
      familyFriendly: prefs.family ?? DEFAULT_PREFS.family,
      beginnerFriendly: prefs.easyRuns ?? DEFAULT_PREFS.easyRuns,
      comfort: Math.max(prefs.infrastructure ?? DEFAULT_PREFS.infrastructure, prefs.huts ?? DEFAULT_PREFS.huts),
    },
    travelMode: mapTravelModeForAlpivo(prefs.travelMode),
    foodStyle: prefs.foodSpendLevel ?? "standard",
    accommodationStyle: deriveAccommodationStyleForAlpivo(prefs),
    wantsApresSki,
    wantsFestival,
    wantsOffPiste: (prefs.offPiste ?? 0) >= 4 || prefs.tripStyle === "offpiste",
    wantsQuiet,
    wantsSnowpark: (prefs.snowpark ?? 0) >= 4,
    wantsFamilyFriendly: (prefs.family ?? 0) >= 4 || prefs.tripStyle === "family" || skillLevel === "beginner",
    needsRental: prefs.rentalMode === "rent" || Boolean(prefs.needRental),
    partyPreference,
    musicPreference: prefs.musicPreference ?? "any",
  };
}

function toAlpivoResortInput(resort: ResortSignalRow): ResortInput {
  return {
    id: resort.id,
    name: resort.name,
    country: resort.country,
    region: resort.region ?? undefined,
    lat: resort.lat ?? undefined,
    lng: resort.lon ?? undefined,
    pisteKmTotal: pickPisteKm(resort) ?? undefined,
    pisteKmBlue: resort.piste_km_easy ?? undefined,
    pisteKmRed: resort.piste_km_intermediate ?? undefined,
    pisteKmBlack: resort.piste_km_advanced ?? undefined,
    liftsCountTotal: resort.lifts_count_total ?? undefined,
    elevationMin: resort.elevation_min_m ?? undefined,
    elevationMax: resort.elevation_max_m ?? undefined,
    verticalDrop: resort.vertical_m ?? undefined,
    adultDayPassPrice: resort.skipass_price_from ?? undefined,
    apresSkiScore: resort.apres_score ?? undefined,
    familyScore: deriveFamilyScore(resort),
    beginnerScore: resort.beginner_score ?? undefined,
    offPisteScore: deriveOffPisteScore(resort),
    snowparkScore: resort.park_score ?? undefined,
    crowdScore: resort.crowd_score ?? undefined,
    snowReliabilityScore: deriveSnowReliability(resort),
    events: normalizeResortEvents(resort.resort_events),
  };
}

export function deriveResortDecision(
  resort: ResortSignalRow,
  prefs: MatchPreferences = {},
  budgetCap = resolveBudgetCap(prefs)
): ResortDecision {
  const cost = estimateResortCost(prefs, resort);
  const budgetClass = deriveBudgetClass(resort, cost);
  const legacyScored = scoreResort(prefs, resort, cost);
  const alpivoScore = calculateAlpivoMatchScore(toAlpivoResortInput(resort), toAlpivoUserPreferences(prefs));
  const pisteKm = pickPisteKm(resort);
  const summerGlacierScore = deriveSummerGlacierScore(resort);
  const infrastructureProfile = deriveInfrastructureProfile(resort);
  const exclusionReasons = deriveExclusionReasons(prefs, resort, cost);
  const events = normalizeResortEvents(resort.resort_events);
  const festivalFit = calculateFestivalFit(events, {
    partyPreference: prefs.partyPreference,
    musicPreference: prefs.musicPreference,
    tripStartDate: prefs.tripStartDate,
    tripEndDate: prefs.tripEndDate,
    apresSkiScore: resort.apres_score,
    crowdScore: resort.crowd_score,
    wantsApresSki: (prefs.apres ?? 0) >= 4 || prefs.tripStyle === "apres",
    wantsQuiet: (prefs.emptySlopes ?? 0) >= 4 || prefs.tripStyle === "quiet",
  });
  const festivalFitScore = clamp((alpivoScore.categoryScores.festivalFit ?? festivalFit.score) / 100);
  const eventBadges = deriveEventBadges(events, 1 - scoreValue(resort.crowd_score));
  const resolvedImageUrl = (resort.hero_image_url || "").trim() || (resort.image_url || "").trim() || null;
  const combinedReasons = Array.from(new Set([...alpivoScore.reasons, ...deriveReasons(prefs, resort, cost)]));
  const combinedWarnings = Array.from(new Set([...alpivoScore.warnings, ...deriveDrawbacks(resort, budgetClass, prefs)]));
  const bestFor = Array.from(
    new Set([
      ...deriveBestFor(resort, budgetClass),
      ...(eventBadges.includes("Junge Gruppen") ? ["Junge Gruppen"] : []),
      ...(eventBadges.includes("Festival") ? ["Festival-Trips"] : []),
      ...(eventBadges.includes("Live-Musik") ? ["Live-Musik"] : []),
    ])
  ).slice(0, 4);

  return {
    id: resort.id,
    slug: resort.slug || resort.id,
    name: resort.name,
    country: resort.country,
    region: resort.region,
    lat: resort.lat ?? null,
    lon: resort.lon ?? null,
    pisteKm,
    imageUrl: resolvedImageUrl,
    imageAlt: (resort.hero_image_alt || "").trim() || (resolvedImageUrl ? `Winterpanorama im Skigebiet ${resort.name}` : null),
    imageSource: (resort.image_source || "").trim() || null,
    imageCredit: (resort.image_credit || "").trim() || null,
    imageLicense: (resort.image_license || "").trim() || null,
    officialUrl: resort.official_url ?? null,
    pisteMapUrl: resort.piste_map_url ?? null,
    openskimapUrl: resort.openskimap_url ?? null,
    skipassUrl: resort.skipass_url ?? null,
    rawScore: legacyScored.rawScore,
    matchPct: alpivoScore.totalScore,
    apresScore: typeof resort.apres_score === "number" ? resort.apres_score : null,
    crowdScore: typeof resort.crowd_score === "number" ? resort.crowd_score : null,
    snowReliability: deriveSnowReliability(resort),
    summerGlacierScore,
    infrastructureScore: infrastructureProfile.score,
    infrastructureProfile,
    valueScore: deriveValueScore(resort, cost),
    cost,
    budgetStatus: deriveBudgetStatus(budgetCap, cost.totalMin, cost.totalMax),
    budgetClass,
    slopeProfile: deriveSlopeProfile(resort),
    fitProfile: {
      ...deriveFitProfile(prefs, resort, cost),
      festival: festivalFitScore,
    },
    tripStyleHint: deriveTripStyleHint(prefs.tripStyle),
    vibeTags: deriveVibeTags(resort),
    eventBadges,
    events,
    festivalFitScore,
    bestFor,
    reasons: combinedReasons.slice(0, 4),
    drawbacks: combinedWarnings.slice(0, 3),
    exclusionReasons,
    alpivoScore,
    matchLabel: alpivoScore.matchLabel,
    recommendationType: alpivoScore.recommendationType,
    categoryScores: alpivoScore.categoryScores,
    weightedCategoryScores: alpivoScore.weightedScores,
    scoreWeights: alpivoScore.weights,
    estimatedCosts: alpivoScore.estimatedCosts,
    missingDataNotes: alpivoScore.missingDataNotes,
  };
}

export const resortSignalSelect = [
  "id",
  "slug",
  "name",
  "country",
  "region",
  "lat",
  "lon",
  "piste_km",
  "piste_km_total",
  "piste_km_easy",
  "piste_km_intermediate",
  "piste_km_advanced",
  "runs_count_total",
  "lifts_count_total",
  "elevation_min_m",
  "elevation_max_m",
  "vertical_m",
  "image_url",
  "hero_image_url",
  "hero_image_alt",
  "image_source",
  "image_credit",
  "image_license",
  "official_url",
  "piste_map_url",
  "skipass_url",
  "openskimap_url",
  "skipass_price_from",
  "apres_score",
  "crowd_score",
  "infra_score",
  "hut_score",
  "park_score",
  "beginner_score",
  "advanced_score",
].join(",");

export const resortEventSelect = [
  "resort_events(",
  [
    "id",
    "resort_id",
    "name",
    "event_type",
    "music_genres",
    "vibe_tags",
    "start_date",
    "end_date",
    "recurring_month",
    "location_name",
    "altitude_m",
    "ticket_required",
    "ticket_price_from",
    "official_url",
    "short_description",
    "best_for",
    "not_ideal_for",
    "data_quality",
    "last_checked_at",
    "created_at",
    "updated_at",
  ].join(","),
  ")",
].join("");

export const resortSignalSelectWithEvents = [resortSignalSelect, resortEventSelect].join(",");
