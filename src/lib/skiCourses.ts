export type SkiCourseDataStatus = "official" | "curated" | "estimated" | "demo" | "unknown";

export type SkiCourseType =
  | "children_group"
  | "adult_group"
  | "private"
  | "snowboard"
  | "beginner"
  | "advanced"
  | "family";

export type SkiCourseTargetGroup = "children" | "adults" | "families" | "mixed";
export type SkiCourseSkillLevel = "first_timer" | "beginner" | "intermediate" | "advanced" | "all";
export type SkiCoursePriceUnit = "half_day" | "day" | "multi_day" | "hour" | "course";
export type SkiCourseNeed = "none" | "children" | "adults" | "beginner" | "snowboard" | "private" | "unsure";

export type SkiSchool = {
  id: string;
  resortId: string | null;
  resortSlug: string;
  name: string;
  websiteUrl: string | null;
  bookingUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  country: string | null;
  region: string | null;
  sourceUrl: string | null;
  dataStatus: SkiCourseDataStatus;
  lastCheckedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SkiCourseOffer = {
  id: string;
  skiSchoolId: string;
  resortId: string | null;
  resortSlug: string;
  courseType: SkiCourseType;
  targetGroup: SkiCourseTargetGroup;
  skillLevel: SkiCourseSkillLevel;
  duration: string | null;
  halfDayAvailable: boolean | null;
  fullDayAvailable: boolean | null;
  privateAvailable: boolean | null;
  groupAvailable: boolean | null;
  snowboardAvailable: boolean | null;
  childrenAvailable: boolean | null;
  adultsAvailable: boolean | null;
  minAge: number | null;
  maxAge: number | null;
  priceFrom: number | null;
  currency: string;
  priceUnit: SkiCoursePriceUnit | null;
  equipmentIncluded: boolean | null;
  liftpassIncluded: boolean | null;
  lunchIncluded: boolean | null;
  onlineBookingAvailable: boolean | null;
  cancellationHint: string | null;
  meetingPoint: string | null;
  languageOptions: string[];
  sourceUrl: string | null;
  dataStatus: SkiCourseDataStatus;
  lastCheckedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SkiCourseBundle = {
  resortSlug: string;
  resortId: string | null;
  schools: SkiSchool[];
  offers: SkiCourseOffer[];
  configured: boolean;
  source: "supabase" | "demo" | "fallback";
  hint: string | null;
};

export type SkiCourseFilters = {
  targetGroup?: "all" | SkiCourseTargetGroup;
  skillLevel?: "all" | SkiCourseSkillLevel;
  courseType?: "all" | "group" | "private" | "snowboard";
  onlyOnlineBooking?: boolean;
  maxPriceFrom?: number | null;
};

export type SkiCourseBundleSummary = {
  schoolCount: number;
  offerCount: number;
  priceFrom: number | null;
  currency: string | null;
  dataStatus: SkiCourseDataStatus;
  childrenAvailable: boolean;
  adultsAvailable: boolean;
  privateAvailable: boolean;
  groupAvailable: boolean;
  snowboardAvailable: boolean;
  onlineBookingAvailable: boolean;
  equipmentIncludedAvailable: boolean;
  liftpassIncludedAvailable: boolean;
};

export type SkiCourseFitInput = {
  need?: SkiCourseNeed;
  beginnerFriendlyScore?: number | null;
  familyFriendlyScore?: number | null;
};

export type SkiCourseFitScore = {
  score: number;
  label: string;
  reasons: string[];
  warnings: string[];
};

export type SkiCourseMapBadgeKind =
  | "has_data"
  | "children"
  | "private"
  | "online_booking"
  | "incomplete_data";

export type SkiCourseMapBadge = {
  kind: SkiCourseMapBadgeKind;
  label: string;
  dataStatus: SkiCourseDataStatus;
};

export type SkiCourseBudgetScenario = {
  participants: number;
  days?: number;
  hours?: number;
};

export type SkiCourseDemoFallbackEnv = {
  NODE_ENV?: string;
  ALPIVO_ENABLE_SKI_COURSE_DEMO_FALLBACK?: string;
};

export const SKI_COURSE_DATA_NOTE =
  "Kursdaten können sich ändern. Preise, Verfügbarkeiten, Treffpunkte und enthaltene Leistungen bitte vor Buchung bei der offiziellen Skischule prüfen.";

export const skiCourseNeedOptions: Array<{ value: SkiCourseNeed; label: string }> = [
  { value: "none", label: "Nein" },
  { value: "children", label: "Ja, Kinderkurs" },
  { value: "adults", label: "Ja, Erwachsenenkurs" },
  { value: "beginner", label: "Ja, Anfänger" },
  { value: "snowboard", label: "Ja, Snowboard" },
  { value: "private", label: "Ja, Privatunterricht" },
  { value: "unsure", label: "Noch unsicher" },
];

export const skiCourseTargetLabels: Record<SkiCourseTargetGroup, string> = {
  children: "Kinder",
  adults: "Erwachsene",
  families: "Familien",
  mixed: "Gemischt",
};

export const skiCourseSkillLabels: Record<SkiCourseSkillLevel, string> = {
  first_timer: "Erster Skitag",
  beginner: "Anfänger",
  intermediate: "Fortgeschritten",
  advanced: "Sportlich",
  all: "Alle Level",
};

export const skiCourseTypeLabels: Record<SkiCourseType, string> = {
  children_group: "Kinderkurs",
  adult_group: "Erwachsenenkurs",
  private: "Privatunterricht",
  snowboard: "Snowboardkurs",
  beginner: "Anfängerkurs",
  advanced: "Fortgeschrittenenkurs",
  family: "Familienkurs",
};

export const skiCoursePriceUnitLabels: Record<SkiCoursePriceUnit, string> = {
  half_day: "Halbtag",
  day: "Tag",
  multi_day: "Kurs",
  hour: "Stunde",
  course: "Kurs",
};

const statusRank: Record<SkiCourseDataStatus, number> = {
  official: 5,
  curated: 4,
  estimated: 3,
  demo: 2,
  unknown: 1,
};

const demoSchool: SkiSchool = {
  id: "demo-ski-school-obertauern",
  resortId: null,
  resortSlug: "obertauern",
  name: "Obertauern Demo-Skischule",
  websiteUrl: "https://www.obertauern.com",
  bookingUrl: "https://www.obertauern.com",
  phone: null,
  email: null,
  address: "Obertauern, Salzburg",
  country: "Österreich",
  region: "Salzburg",
  sourceUrl: "https://www.obertauern.com",
  dataStatus: "demo",
  lastCheckedAt: "2026-05-12",
  createdAt: null,
  updatedAt: null,
};

const demoOffers: SkiCourseOffer[] = [
  {
    id: "demo-obertauern-children-group",
    skiSchoolId: demoSchool.id,
    resortId: null,
    resortSlug: demoSchool.resortSlug,
    courseType: "children_group",
    targetGroup: "children",
    skillLevel: "beginner",
    duration: "1 Tag Gruppenkurs",
    halfDayAvailable: true,
    fullDayAvailable: true,
    privateAvailable: false,
    groupAvailable: true,
    snowboardAvailable: false,
    childrenAvailable: true,
    adultsAvailable: false,
    minAge: 4,
    maxAge: 14,
    priceFrom: 78,
    currency: "EUR",
    priceUnit: "day",
    equipmentIncluded: false,
    liftpassIncluded: false,
    lunchIncluded: false,
    onlineBookingAvailable: true,
    cancellationHint: "Demo-Hinweis: Bedingungen offiziell prüfen.",
    meetingPoint: "Zentraler Sammelplatz im Ort, bitte offiziell prüfen.",
    languageOptions: ["de", "en"],
    sourceUrl: "https://www.obertauern.com",
    dataStatus: "demo",
    lastCheckedAt: "2026-05-12",
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "demo-obertauern-adult-beginner",
    skiSchoolId: demoSchool.id,
    resortId: null,
    resortSlug: demoSchool.resortSlug,
    courseType: "adult_group",
    targetGroup: "adults",
    skillLevel: "beginner",
    duration: "1 Tag Anfängerkurs",
    halfDayAvailable: true,
    fullDayAvailable: true,
    privateAvailable: false,
    groupAvailable: true,
    snowboardAvailable: false,
    childrenAvailable: false,
    adultsAvailable: true,
    minAge: 15,
    maxAge: null,
    priceFrom: 92,
    currency: "EUR",
    priceUnit: "day",
    equipmentIncluded: false,
    liftpassIncluded: false,
    lunchIncluded: false,
    onlineBookingAvailable: true,
    cancellationHint: "Demo-Hinweis: Bedingungen offiziell prüfen.",
    meetingPoint: "Treffpunkt wird durch die Skischule bestätigt.",
    languageOptions: ["de", "en"],
    sourceUrl: "https://www.obertauern.com",
    dataStatus: "demo",
    lastCheckedAt: "2026-05-12",
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "demo-obertauern-private-snowboard",
    skiSchoolId: demoSchool.id,
    resortId: null,
    resortSlug: demoSchool.resortSlug,
    courseType: "snowboard",
    targetGroup: "mixed",
    skillLevel: "all",
    duration: "Privatstunde Ski oder Snowboard",
    halfDayAvailable: true,
    fullDayAvailable: false,
    privateAvailable: true,
    groupAvailable: false,
    snowboardAvailable: true,
    childrenAvailable: true,
    adultsAvailable: true,
    minAge: null,
    maxAge: null,
    priceFrom: 68,
    currency: "EUR",
    priceUnit: "hour",
    equipmentIncluded: false,
    liftpassIncluded: false,
    lunchIncluded: false,
    onlineBookingAvailable: true,
    cancellationHint: "Demo-Hinweis: genaue Staffelpreise offiziell prüfen.",
    meetingPoint: "Nach Absprache mit der Skischule.",
    languageOptions: ["de", "en"],
    sourceUrl: "https://www.obertauern.com",
    dataStatus: "demo",
    lastCheckedAt: "2026-05-12",
    createdAt: null,
    updatedAt: null,
  },
];

const demoBundles: Record<string, SkiCourseBundle> = {
  obertauern: {
    resortSlug: "obertauern",
    resortId: null,
    schools: [demoSchool],
    offers: demoOffers,
    configured: true,
    source: "demo",
    hint: "Beta-Daten für die Orientierung. Preise und Verfügbarkeiten sind nicht garantiert.",
  },
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isTruthy(value: boolean | null | undefined) {
  return value === true;
}

function statusFromRows(rows: Array<{ dataStatus: SkiCourseDataStatus }>) {
  if (!rows.length) return "unknown" satisfies SkiCourseDataStatus;
  return rows.reduce<SkiCourseDataStatus>((best, row) => (statusRank[row.dataStatus] < statusRank[best] ? row.dataStatus : best), rows[0].dataStatus);
}

function hasAnyUnknownOrDemo(bundle: SkiCourseBundle) {
  return [...bundle.schools, ...bundle.offers].some((entry) => entry.dataStatus === "unknown" || entry.dataStatus === "demo");
}

function clampScore(value: number) {
  const finiteValue = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(finiteValue)));
}

function finiteRatio(value: number | null | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function positiveUnit(value: number | null | undefined, fallback = 1) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function positiveWholeUnit(value: number | null | undefined, fallback = 1) {
  return Math.max(1, Math.round(positiveUnit(value, fallback)));
}

export function getDemoSkiCourseBundle(slug: string): SkiCourseBundle | null {
  return demoBundles[normalizeSlug(slug)] ?? null;
}

export function isSkiCourseDemoFallbackEnabled(env: SkiCourseDemoFallbackEnv = process.env) {
  const explicit = env.ALPIVO_ENABLE_SKI_COURSE_DEMO_FALLBACK?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1" || explicit === "yes") return true;
  if (explicit === "false" || explicit === "0" || explicit === "no") return false;
  return env.NODE_ENV !== "production";
}

export function getDemoSkiCourseBundleIfEnabled(slug: string, env?: SkiCourseDemoFallbackEnv): SkiCourseBundle | null {
  if (!isSkiCourseDemoFallbackEnabled(env)) return null;
  return getDemoSkiCourseBundle(slug);
}

export function getKnownDemoSkiCourseBundles() {
  return Object.values(demoBundles);
}

export function summarizeSkiCourseBundle(bundle: Pick<SkiCourseBundle, "schools" | "offers">): SkiCourseBundleSummary {
  const priceRows = bundle.offers.filter((offer) => typeof offer.priceFrom === "number" && Number.isFinite(offer.priceFrom));
  const comparablePriceRows = priceRows.filter((offer) => offer.priceUnit !== "hour");
  const lowest = (comparablePriceRows.length ? comparablePriceRows : priceRows).reduce<SkiCourseOffer | null>(
    (best, offer) => (!best || (offer.priceFrom ?? Number.POSITIVE_INFINITY) < (best.priceFrom ?? Number.POSITIVE_INFINITY) ? offer : best),
    null
  );

  return {
    schoolCount: bundle.schools.length,
    offerCount: bundle.offers.length,
    priceFrom: lowest?.priceFrom ?? null,
    currency: lowest?.currency ?? priceRows[0]?.currency ?? null,
    dataStatus: statusFromRows([...bundle.schools, ...bundle.offers]),
    childrenAvailable: bundle.offers.some((offer) => isTruthy(offer.childrenAvailable)),
    adultsAvailable: bundle.offers.some((offer) => isTruthy(offer.adultsAvailable)),
    privateAvailable: bundle.offers.some((offer) => isTruthy(offer.privateAvailable)),
    groupAvailable: bundle.offers.some((offer) => isTruthy(offer.groupAvailable)),
    snowboardAvailable: bundle.offers.some((offer) => isTruthy(offer.snowboardAvailable)),
    onlineBookingAvailable: bundle.offers.some((offer) => isTruthy(offer.onlineBookingAvailable)),
    equipmentIncludedAvailable: bundle.offers.some((offer) => isTruthy(offer.equipmentIncluded)),
    liftpassIncludedAvailable: bundle.offers.some((offer) => isTruthy(offer.liftpassIncluded)),
  };
}

export function filterSkiCourseOffers(offers: SkiCourseOffer[], filters: SkiCourseFilters = {}) {
  return offers.filter((offer) => {
    if (filters.targetGroup && filters.targetGroup !== "all") {
      if (filters.targetGroup === "children" && !offer.childrenAvailable) return false;
      if (filters.targetGroup === "adults" && !offer.adultsAvailable) return false;
      if (filters.targetGroup === "families" && offer.targetGroup !== "families" && !(offer.childrenAvailable && offer.adultsAvailable)) return false;
      if (filters.targetGroup === "mixed" && offer.targetGroup !== "mixed") return false;
    }

    if (filters.skillLevel && filters.skillLevel !== "all" && offer.skillLevel !== "all" && offer.skillLevel !== filters.skillLevel) return false;

    if (filters.courseType && filters.courseType !== "all") {
      if (filters.courseType === "group" && !offer.groupAvailable) return false;
      if (filters.courseType === "private" && !offer.privateAvailable) return false;
      if (filters.courseType === "snowboard" && !offer.snowboardAvailable && offer.courseType !== "snowboard") return false;
    }

    if (filters.onlyOnlineBooking && !offer.onlineBookingAvailable) return false;
    if (typeof filters.maxPriceFrom === "number" && Number.isFinite(filters.maxPriceFrom)) {
      if (typeof offer.priceFrom !== "number" || offer.priceFrom > filters.maxPriceFrom) return false;
    }

    return true;
  });
}

export function formatSkiCoursePrice(value: number | null | undefined, currency = "EUR", unit?: SkiCoursePriceUnit | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Preis offen";
  const formatted = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
  return unit ? `ab ${formatted} / ${skiCoursePriceUnitLabels[unit]}` : `ab ${formatted}`;
}

export function formatSkiCourseLastChecked(value: string | null | undefined) {
  if (!value) return "Prüfstand offen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
}

export function calculateSkiCourseFitScore(bundle: SkiCourseBundle, input: SkiCourseFitInput = {}): SkiCourseFitScore {
  const summary = summarizeSkiCourseBundle(bundle);
  const need = input.need ?? "unsure";
  const beginnerFriendlyScore = finiteRatio(input.beginnerFriendlyScore, 0.5);
  const familyFriendlyScore = finiteRatio(input.familyFriendlyScore, 0.5);
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = summary.offerCount > 0 ? 48 : 18;

  if (summary.offerCount > 0) reasons.push(`${summary.offerCount} Kursangebote hinterlegt`);
  if (summary.childrenAvailable) reasons.push("Kinderkurse verfügbar");
  if (summary.adultsAvailable) reasons.push("Erwachsenenkurse verfügbar");
  if (summary.privateAvailable) reasons.push("Privatunterricht sichtbar");
  if (summary.onlineBookingAvailable) reasons.push("Online-Buchung wird verlinkt");
  if (summary.priceFrom !== null) reasons.push("Preis ab transparent gepflegt");
  if (summary.equipmentIncludedAvailable) reasons.push("Kurs mit Ausrüstung möglich");

  if (need === "none") score += summary.offerCount > 0 ? 4 : 0;
  if (need === "children") score += summary.childrenAvailable ? 24 : -18;
  if (need === "adults") score += summary.adultsAvailable ? 20 : -16;
  if (need === "beginner") score += beginnerFriendlyScore * 18 + (summary.groupAvailable ? 8 : 0);
  if (need === "snowboard") score += summary.snowboardAvailable ? 20 : -15;
  if (need === "private") score += summary.privateAvailable ? 20 : -15;
  if (need === "unsure") score += summary.childrenAvailable || summary.adultsAvailable || summary.privateAvailable ? 12 : 0;

  score += summary.onlineBookingAvailable ? 8 : 0;
  score += summary.priceFrom !== null ? 8 : 0;
  score += familyFriendlyScore * (need === "children" ? 10 : 4);
  if (summary.dataStatus === "official") score += 8;
  if (summary.dataStatus === "curated") score += 5;
  if (summary.dataStatus === "estimated") warnings.push("Preise sind geschätzt und müssen offiziell geprüft werden.");
  if (summary.dataStatus === "demo") warnings.push("Beta-Daten: vor Buchung immer offiziell prüfen.");
  if (summary.dataStatus === "unknown") warnings.push("Datenstatus unklar: offizielle Skischule prüfen.");

  const resolved = clampScore(score);
  return {
    score: resolved,
    label: resolved >= 78 ? "Starker Skikurs-Fit" : resolved >= 58 ? "Brauchbarer Skikurs-Fit" : "Skikursdaten ausbaufähig",
    reasons: reasons.slice(0, 5),
    warnings: warnings.length ? warnings : ["Preise und Verfügbarkeiten sind nicht live und müssen offiziell geprüft werden."],
  };
}

export function deriveSkiCourseMapBadges(bundle: SkiCourseBundle): SkiCourseMapBadge[] {
  const summary = summarizeSkiCourseBundle(bundle);
  if (!summary.offerCount) {
    return [{ kind: "incomplete_data", label: "Skikursdaten unvollständig", dataStatus: "unknown" }];
  }

  const badges: SkiCourseMapBadge[] = [{ kind: "has_data", label: "Skikursdaten vorhanden", dataStatus: summary.dataStatus }];
  if (summary.childrenAvailable) badges.push({ kind: "children", label: "Kinderkurse", dataStatus: summary.dataStatus });
  if (summary.privateAvailable) badges.push({ kind: "private", label: "Privatkurse", dataStatus: summary.dataStatus });
  if (summary.onlineBookingAvailable) badges.push({ kind: "online_booking", label: "Online buchbar", dataStatus: summary.dataStatus });
  if (hasAnyUnknownOrDemo(bundle)) badges.push({ kind: "incomplete_data", label: "Daten unvollständig", dataStatus: summary.dataStatus });
  return badges;
}

export function estimateSkiCourseBudgetFromOffer(offer: SkiCourseOffer, scenario: SkiCourseBudgetScenario) {
  if (typeof offer.priceFrom !== "number" || !Number.isFinite(offer.priceFrom)) {
    return { amount: null, currency: offer.currency, note: "Kein belastbarer Kurs-Startpreis vorhanden." };
  }

  const participants = positiveWholeUnit(scenario.participants);
  const units = offer.priceUnit === "hour" ? positiveUnit(scenario.hours) : positiveUnit(scenario.days);
  const pricePerUnit = offer.privateAvailable ? offer.priceFrom : offer.priceFrom * participants;
  return {
    amount: Math.round(pricePerUnit * units),
    currency: offer.currency,
    note: offer.privateAvailable
      ? "Privatunterricht grob pro Einheit gerechnet; Gruppengröße und Staffelpreise offiziell prüfen."
      : "Gruppenkurs grob pro Person gerechnet; Paketpreise und Rabatte offiziell prüfen.",
  };
}
