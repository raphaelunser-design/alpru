import type { EstimatedTripCosts, ResortInput, UserPreferences } from "@/types/matching";
import { clamp, optionalNumber, safeNumber } from "./scoringUtils";

function normalizeCountry(country: string | null | undefined) {
  return String(country || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function countryPriceFactor(country: string | null | undefined) {
  const normalized = normalizeCountry(country);
  if (normalized.includes("schweiz") || normalized.includes("switzerland") || normalized.includes("suisse")) return 1.35;
  if (normalized.includes("frankreich") || normalized.includes("france")) return 1.1;
  if (normalized.includes("oesterreich") || normalized.includes("osterreich") || normalized.includes("austria")) return 1.05;
  if (normalized.includes("italien") || normalized.includes("italy") || normalized.includes("italie")) return 1;
  if (normalized.includes("deutschland") || normalized.includes("germany") || normalized.includes("allemagne")) return 0.95;
  return 1.05;
}

function fallbackDayPass(country: string | null | undefined) {
  const normalized = normalizeCountry(country);
  if (normalized.includes("schweiz") || normalized.includes("switzerland") || normalized.includes("suisse")) return 85;
  if (normalized.includes("frankreich") || normalized.includes("france")) return 70;
  if (normalized.includes("italien") || normalized.includes("italy") || normalized.includes("italie")) return 65;
  if (normalized.includes("deutschland") || normalized.includes("germany") || normalized.includes("allemagne")) return 50;
  return 70;
}

function accommodationBase(style: UserPreferences["accommodationStyle"]) {
  if (style === "budget") return 58;
  if (style === "comfort") return 155;
  return 92;
}

function foodBase(style: UserPreferences["foodStyle"]) {
  if (style === "budget") return 30;
  if (style === "comfort") return 88;
  return 55;
}

function travelCost(resort: ResortInput, prefs: UserPreferences, assumptions: string[]) {
  const people = Math.max(1, Math.round(safeNumber(prefs.people, 1)));
  const distance = optionalNumber(resort.distanceKm);
  const mode = prefs.travelMode || "unknown";

  if (distance === undefined || distance <= 0) {
    assumptions.push("Anreisekosten konnten mangels Entfernung nicht genau berechnet werden.");
    return { value: 0, confidencePenalty: 1 };
  }

  if (mode === "car" || mode === "unknown") {
    if (mode === "unknown") assumptions.push("Anreise als Auto-Fallback mit 0,22 €/km berechnet.");
    return { value: Math.round((distance * 2 * 0.22) / people), confidencePenalty: mode === "unknown" ? 0.5 : 0 };
  }

  const oneWay =
    distance < 150 ? (mode === "bus" ? 28 : 38) : distance <= 400 ? (mode === "bus" ? 62 : 78) : mode === "bus" ? 120 : 145;
  assumptions.push(`${mode === "train" ? "Zug" : "Bus"}kosten als Distanz-Pauschale geschätzt.`);
  return { value: Math.round(oneWay), confidencePenalty: 0.75 };
}

export function calculateEstimatedTripCost(resort: ResortInput, prefs: UserPreferences = {}): EstimatedTripCosts {
  const assumptions: string[] = [];
  const days = Math.max(1, Math.round(safeNumber(prefs.days, prefs.tripType === "week" ? 6 : prefs.tripType === "weekend" ? 2 : 1)));
  const people = Math.max(1, Math.round(safeNumber(prefs.people, 1)));
  const tripType = prefs.tripType || (days <= 1 ? "day_trip" : days <= 3 ? "weekend" : "multi_day");
  const factor = countryPriceFactor(resort.country);

  const dayPass = optionalNumber(resort.adultDayPassPrice) || fallbackDayPass(resort.country);
  if (resort.adultDayPassPrice === undefined || resort.adultDayPassPrice <= 0) {
    assumptions.push(`Skipasspreis nach Land geschätzt (${Math.round(dayPass)} €/Tag).`);
  }
  const skiPassPerPerson = Math.round(dayPass * days);

  const nights = tripType === "day_trip" ? 0 : Math.max(days - 1, 1);
  const accommodationNight =
    optionalNumber(resort.accommodationAvgNight) || Math.round(accommodationBase(prefs.accommodationStyle || "standard") * factor);
  if (resort.accommodationAvgNight === undefined || resort.accommodationAvgNight <= 0) {
    assumptions.push("Unterkunft über Land und Reisestil geschätzt.");
  }
  const accommodationPerPerson = Math.round(nights * accommodationNight);

  const transport = travelCost(resort, prefs, assumptions);
  const apresAddOn =
    prefs.wantsApresSki || safeNumber(prefs.priorities?.apresSki, 0) >= 4
      ? clamp(10 + (safeNumber(resort.apresSkiScore, 0.5) <= 1 ? safeNumber(resort.apresSkiScore, 0.5) * 15 : safeNumber(resort.apresSkiScore, 50) / 100 * 15), 10, 25)
      : 0;
  const foodDrinkPerPerson = Math.round(days * (foodBase(prefs.foodStyle || "standard") * factor + apresAddOn));
  if (apresAddOn > 0) assumptions.push("Après-Ski-Aufschlag in Essen & Trinken berücksichtigt.");

  const extrasPerPerson = prefs.wantsSnowpark || prefs.wantsOffPiste ? 20 : 0;
  const fallbackCount = assumptions.length + transport.confidencePenalty;
  const confidence = fallbackCount <= 1 ? "high" : fallbackCount <= 3 ? "medium" : "low";

  return {
    totalPerPerson: Math.round(skiPassPerPerson + accommodationPerPerson + transport.value + foodDrinkPerPerson + extrasPerPerson),
    accommodationPerPerson,
    skiPassPerPerson,
    transportPerPerson: transport.value,
    foodDrinkPerPerson,
    extrasPerPerson,
    confidence,
    assumptions,
  };
}
