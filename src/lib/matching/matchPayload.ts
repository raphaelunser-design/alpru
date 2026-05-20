import type { ResortDecision, TripStyle } from "@/lib/resortSignals";
import type { MusicPreference, PartyPreference } from "@/lib/resortEvents";
import type { SkiCourseNeed } from "@/lib/skiCourses";

export type MatchPayload = {
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
  skiCourseNeed: SkiCourseNeed;
  travelMode: "car" | "train" | "bus" | "flight";
  excludeCountries: string[];
  excludeGlacier: boolean;
  excludePremium: boolean;
  excludeFamilyOnly: boolean;
};

export type ResortQuery = {
  query: string;
  countryFilter: string;
  regionFilter: string;
  budgetFilter: string;
  profileFilter: string;
  sortBy: string;
  maxDriveHours: string;
  minPisteKm: string;
  maxPisteKm: string;
  budgetMin: number;
  budgetMax: number;
  budgetFilterActive: boolean;
  apresMin: number;
  quietMin: number;
  originLat: number | null;
  originLon: number | null;
  originLabel: string;
};

export type MatchResultMeta = {
  createdAt: string;
  source: string;
  usingFallback: boolean;
  total: number;
  loaded: number;
  resultCount: number;
  excludedCount: number;
  prefs: MatchPayload;
  filters: ResortQuery;
};

export type MatchResultError = {
  message: string;
  status?: number;
  createdAt: string;
  prefs: MatchPayload;
  filters: ResortQuery;
};

export type MatchResultSnapshot = {
  results: ResortDecision[];
  excluded: ResortDecision[];
  meta?: MatchResultMeta;
  error?: MatchResultError;
};

export const MATCH_PREF_DEFAULTS: MatchPayload = {
  tripStyle: "apres",
  tripStartDate: "2027-01-20",
  tripEndDate: "2027-01-24",
  budgetMin: 450,
  budgetMax: 650,
  budget: 650,
  peopleCount: 6,
  apres: 5,
  emptySlopes: 2,
  infrastructure: 4,
  huts: 5,
  snowpark: 2,
  easyRuns: 3,
  challenging: 2,
  snowReliability: 5,
  valueForMoney: 4,
  family: 1,
  panorama: 4,
  summerGlacier: 0,
  offPiste: 0,
  partyPreference: "indifferent",
  musicPreference: "any",
  foodSpendLevel: "standard",
  needRental: false,
  rentalMode: "own",
  skiCourseNeed: "none",
  travelMode: "car",
  excludeCountries: [],
  excludeGlacier: false,
  excludePremium: false,
  excludeFamilyOnly: false,
};

export const RESULT_BUDGET_MIN = 150;
export const RESULT_BUDGET_MAX = 900;

export const RESORT_QUERY_DEFAULTS: ResortQuery = {
  query: "",
  countryFilter: "all",
  regionFilter: "all",
  budgetFilter: "all",
  profileFilter: "all",
  sortBy: "match",
  maxDriveHours: "",
  minPisteKm: "",
  maxPisteKm: "",
  budgetMin: RESULT_BUDGET_MIN,
  budgetMax: RESULT_BUDGET_MAX,
  budgetFilterActive: false,
  apresMin: 0,
  quietMin: 0,
  originLat: null,
  originLon: null,
  originLabel: "",
};

const tripStyles: TripStyle[] = [
  "balanced",
  "budget",
  "apres",
  "family",
  "sport",
  "premium",
  "quiet",
  "powder",
  "glacier",
  "offpiste",
];

const partyPreferences: PartyPreference[] = ["indifferent", "some_apres", "party_places", "festival_event", "quiet_no_events"];
const musicPreferences: MusicPreference[] = [
  "edm_electronic",
  "techno_house",
  "apres_schlager",
  "pop_mainstream",
  "rock_indie_live",
  "hiphop_urban",
  "any",
];
const foodSpendLevels: MatchPayload["foodSpendLevel"][] = ["budget", "standard", "comfort"];
const rentalModes: MatchPayload["rentalMode"][] = ["own", "rent"];
const skiCourseNeeds: SkiCourseNeed[] = ["none", "children", "adults", "beginner", "snowboard", "private", "unsure"];
const travelModes: MatchPayload["travelMode"][] = ["car", "train", "bus", "flight"];
const budgetFilters = ["all", "green", "yellow", "red"];
const profileFilters = ["all", "snow", "value", "comfort", "sport", "vibe", "festival", "glacier", "offpiste"];
const resultSortKeys = ["match", "price_low", "price_high", "drive_time", "snow", "value", "festival", "summer", "offpiste"];

let latestMatchSnapshot: MatchResultSnapshot | null = null;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberWithDefault(value: unknown, fallback: number, min = 0, max = Number.POSITIVE_INFINITY) {
  const parsed = finiteNumber(value);
  const resolved = parsed === null ? fallback : parsed;
  return Math.max(min, Math.min(max, resolved));
}

function intWithDefault(value: unknown, fallback: number, min: number, max: number) {
  return Math.round(numberWithDefault(value, fallback, min, max));
}

function optionalPositiveFilter(value: unknown) {
  const parsed = finiteNumber(value);
  if (parsed === null || parsed <= 0) return "";
  return String(Math.round(parsed * 100) / 100);
}

function percentWithDefault(value: unknown, fallback: number) {
  return Math.round(numberWithDefault(value, fallback, 0, 100));
}

function booleanWithDefault(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : fallback;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (["true", "1", "yes", "ja", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "nein", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function enumWithDefault<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function isoDateOrNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return trimmed;
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((entry) => stringValue(entry)).filter(Boolean)));
  }
  const single = stringValue(value);
  return single ? [single] : [];
}

function normalizeBudget(raw: Record<string, unknown>) {
  const legacyBudget = finiteNumber(raw.budget);
  let budgetMin = numberWithDefault(raw.budgetMin, MATCH_PREF_DEFAULTS.budgetMin, 0);
  let budgetMax = numberWithDefault(raw.budgetMax, legacyBudget ?? MATCH_PREF_DEFAULTS.budgetMax, 0);
  if (budgetMax > 0 && budgetMin > budgetMax) {
    [budgetMin, budgetMax] = [budgetMax, budgetMin];
  }
  const budget = legacyBudget && legacyBudget > 0 ? legacyBudget : budgetMax || budgetMin || MATCH_PREF_DEFAULTS.budget;
  return {
    budgetMin: Math.round(budgetMin),
    budgetMax: Math.round(budgetMax),
    budget: Math.round(budget),
  };
}

export function buildMatchPayload(input: unknown = {}): MatchPayload {
  const raw = asRecord(input);
  const budget = normalizeBudget(raw);
  const rentalMode = enumWithDefault(raw.rentalMode, rentalModes, booleanWithDefault(raw.needRental) ? "rent" : MATCH_PREF_DEFAULTS.rentalMode);

  return {
    ...MATCH_PREF_DEFAULTS,
    tripStyle: enumWithDefault(raw.tripStyle, tripStyles, MATCH_PREF_DEFAULTS.tripStyle),
    tripStartDate: isoDateOrNull(raw.tripStartDate),
    tripEndDate: isoDateOrNull(raw.tripEndDate),
    ...budget,
    peopleCount: intWithDefault(raw.peopleCount, MATCH_PREF_DEFAULTS.peopleCount, 1, 12),
    apres: numberWithDefault(raw.apres, MATCH_PREF_DEFAULTS.apres, 0, 5),
    emptySlopes: numberWithDefault(raw.emptySlopes, MATCH_PREF_DEFAULTS.emptySlopes, 0, 5),
    infrastructure: numberWithDefault(raw.infrastructure, MATCH_PREF_DEFAULTS.infrastructure, 0, 5),
    huts: numberWithDefault(raw.huts, MATCH_PREF_DEFAULTS.huts, 0, 5),
    snowpark: numberWithDefault(raw.snowpark, MATCH_PREF_DEFAULTS.snowpark, 0, 5),
    easyRuns: numberWithDefault(raw.easyRuns, MATCH_PREF_DEFAULTS.easyRuns, 0, 5),
    challenging: numberWithDefault(raw.challenging, MATCH_PREF_DEFAULTS.challenging, 0, 5),
    snowReliability: numberWithDefault(raw.snowReliability, MATCH_PREF_DEFAULTS.snowReliability, 0, 5),
    valueForMoney: numberWithDefault(raw.valueForMoney, MATCH_PREF_DEFAULTS.valueForMoney, 0, 5),
    family: numberWithDefault(raw.family, MATCH_PREF_DEFAULTS.family, 0, 5),
    panorama: numberWithDefault(raw.panorama, MATCH_PREF_DEFAULTS.panorama, 0, 5),
    summerGlacier: numberWithDefault(raw.summerGlacier, MATCH_PREF_DEFAULTS.summerGlacier, 0, 5),
    offPiste: numberWithDefault(raw.offPiste, MATCH_PREF_DEFAULTS.offPiste, 0, 5),
    partyPreference: enumWithDefault(raw.partyPreference, partyPreferences, MATCH_PREF_DEFAULTS.partyPreference),
    musicPreference: enumWithDefault(raw.musicPreference, musicPreferences, MATCH_PREF_DEFAULTS.musicPreference),
    foodSpendLevel: enumWithDefault(raw.foodSpendLevel, foodSpendLevels, MATCH_PREF_DEFAULTS.foodSpendLevel),
    needRental: rentalMode === "rent",
    rentalMode,
    skiCourseNeed: enumWithDefault(raw.skiCourseNeed, skiCourseNeeds, MATCH_PREF_DEFAULTS.skiCourseNeed),
    travelMode: enumWithDefault(raw.travelMode, travelModes, MATCH_PREF_DEFAULTS.travelMode),
    excludeCountries: stringArray(raw.excludeCountries),
    excludeGlacier: booleanWithDefault(raw.excludeGlacier),
    excludePremium: booleanWithDefault(raw.excludePremium),
    excludeFamilyOnly: booleanWithDefault(raw.excludeFamilyOnly),
  };
}

export function buildResortQuery(input: unknown = {}): ResortQuery {
  const raw = asRecord(input);
  let budgetMin = numberWithDefault(raw.budgetMin, RESORT_QUERY_DEFAULTS.budgetMin, 0, RESULT_BUDGET_MAX);
  let budgetMax = numberWithDefault(raw.budgetMax, RESORT_QUERY_DEFAULTS.budgetMax, 0, RESULT_BUDGET_MAX);
  if (budgetMax > 0 && budgetMin > budgetMax) {
    [budgetMin, budgetMax] = [budgetMax, budgetMin];
  }

  const originLat = finiteNumber(raw.originLat);
  const originLon = finiteNumber(raw.originLon);
  const hasOrigin = originLat !== null && originLon !== null && Math.abs(originLat) <= 90 && Math.abs(originLon) <= 180;

  return {
    query: stringValue(raw.query),
    countryFilter: stringValue(raw.countryFilter ?? raw.country, RESORT_QUERY_DEFAULTS.countryFilter) || "all",
    regionFilter: stringValue(raw.regionFilter, RESORT_QUERY_DEFAULTS.regionFilter) || "all",
    budgetFilter: enumWithDefault(raw.budgetFilter, budgetFilters, RESORT_QUERY_DEFAULTS.budgetFilter),
    profileFilter: enumWithDefault(raw.profileFilter, profileFilters, RESORT_QUERY_DEFAULTS.profileFilter),
    sortBy: enumWithDefault(raw.sortBy === "distance" ? "drive_time" : raw.sortBy, resultSortKeys, RESORT_QUERY_DEFAULTS.sortBy),
    maxDriveHours: optionalPositiveFilter(raw.maxDriveHours),
    minPisteKm: optionalPositiveFilter(raw.minPisteKm),
    maxPisteKm: optionalPositiveFilter(raw.maxPisteKm),
    budgetMin: Math.round(budgetMin),
    budgetMax: Math.round(budgetMax),
    budgetFilterActive: booleanWithDefault(raw.budgetFilterActive),
    apresMin: percentWithDefault(raw.apresMin, RESORT_QUERY_DEFAULTS.apresMin),
    quietMin: percentWithDefault(raw.quietMin, RESORT_QUERY_DEFAULTS.quietMin),
    originLat: hasOrigin ? originLat : null,
    originLon: hasOrigin ? originLon : null,
    originLabel: hasOrigin ? stringValue(raw.originLabel, "Gespeicherter Standort") : "",
  };
}

export function setLatestMatchSnapshot(snapshot: MatchResultSnapshot | null) {
  latestMatchSnapshot = snapshot;
}

export function getLatestMatchSnapshot() {
  return latestMatchSnapshot;
}
