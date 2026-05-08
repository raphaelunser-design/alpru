import type { ScoreCategory, SkillLevel, TripType, UserPreferences } from "@/types/matching";
import { normalizePriority, normalizeWeights } from "./scoringUtils";

export const baseWeights: Record<ScoreCategory, number> = {
  budget: 0.18,
  distance: 0.15,
  weatherSnow: 0.14,
  skillFit: 0.12,
  pisteFit: 0.1,
  apresSki: 0.08,
  crowd: 0.07,
  offPiste: 0.05,
  infrastructure: 0.06,
  valueForMoney: 0.1,
  tripTypeFit: 0.05,
  festivalFit: 0.03,
};

function bump(weights: Record<ScoreCategory, number>, key: ScoreCategory, amount: number) {
  weights[key] += amount;
}

function applySkillWeights(weights: Record<ScoreCategory, number>, skill: SkillLevel) {
  if (skill === "beginner") {
    bump(weights, "skillFit", 0.08);
    bump(weights, "tripTypeFit", 0.03);
    bump(weights, "pisteFit", -0.02);
  }
  if (skill === "advanced") {
    bump(weights, "pisteFit", 0.05);
    bump(weights, "weatherSnow", 0.03);
    bump(weights, "skillFit", 0.03);
  }
  if (skill === "expert") {
    bump(weights, "offPiste", 0.08);
    bump(weights, "pisteFit", 0.05);
    bump(weights, "weatherSnow", 0.04);
  }
  if (skill === "mixed") {
    bump(weights, "skillFit", 0.05);
    bump(weights, "infrastructure", 0.03);
    bump(weights, "tripTypeFit", 0.02);
  }
}

function applyTripWeights(weights: Record<ScoreCategory, number>, tripType: TripType) {
  if (tripType === "day_trip") {
    bump(weights, "distance", 0.08);
    bump(weights, "budget", 0.05);
    bump(weights, "tripTypeFit", 0.05);
    bump(weights, "pisteFit", -0.02);
  }
  if (tripType === "weekend") {
    bump(weights, "distance", 0.04);
    bump(weights, "valueForMoney", 0.03);
    bump(weights, "tripTypeFit", 0.04);
  }
  if (tripType === "week" || tripType === "multi_day") {
    bump(weights, "pisteFit", 0.06);
    bump(weights, "weatherSnow", 0.05);
    bump(weights, "infrastructure", 0.04);
    bump(weights, "distance", -0.03);
  }
}

export function getDynamicWeights(preferences: UserPreferences = {}) {
  const weights = { ...baseWeights };
  const p = preferences.priorities ?? {};

  bump(weights, "budget", (normalizePriority(p.budget, 3) - 0.6) * 0.12);
  bump(weights, "valueForMoney", (normalizePriority(p.budget, 3) - 0.6) * 0.08);
  bump(weights, "distance", (normalizePriority(p.distance, 3) - 0.6) * 0.12);
  bump(weights, "tripTypeFit", (normalizePriority(p.distance, 3) - 0.6) * 0.05);
  bump(weights, "weatherSnow", (normalizePriority(p.snow, 3) - 0.6) * 0.13);
  bump(weights, "apresSki", (normalizePriority(p.apresSki, 2) - 0.4) * 0.12);
  bump(weights, "crowd", (normalizePriority(p.quiet, 2) - 0.4) * 0.11);
  bump(weights, "pisteFit", (normalizePriority(p.pisteSize, 3) - 0.6) * 0.1);
  bump(weights, "infrastructure", (normalizePriority(p.pisteSize, 3) - 0.6) * 0.04);
  bump(weights, "offPiste", (normalizePriority(p.offPiste, 1) - 0.25) * 0.16);
  bump(weights, "skillFit", (normalizePriority(p.beginnerFriendly, 2) - 0.4) * 0.08);
  bump(weights, "infrastructure", (normalizePriority(p.comfort, 2) - 0.4) * 0.06);

  if (preferences.wantsApresSki) bump(weights, "apresSki", 0.06);
  if (preferences.wantsQuiet) bump(weights, "crowd", 0.07);
  if (preferences.wantsOffPiste) bump(weights, "offPiste", 0.09);
  if (preferences.wantsFamilyFriendly) bump(weights, "skillFit", 0.05);

  if (preferences.partyPreference === "some_apres") {
    bump(weights, "festivalFit", 0.04);
    bump(weights, "apresSki", 0.02);
  }
  if (preferences.partyPreference === "party_places") {
    bump(weights, "festivalFit", 0.08);
    bump(weights, "apresSki", 0.03);
  }
  if (preferences.partyPreference === "festival_event" || preferences.wantsFestival) {
    bump(weights, "festivalFit", 0.12);
    bump(weights, "apresSki", 0.02);
  }
  if (preferences.partyPreference === "quiet_no_events") {
    bump(weights, "festivalFit", 0.09);
    bump(weights, "crowd", 0.04);
    bump(weights, "apresSki", -0.02);
  }
  if (preferences.musicPreference && preferences.musicPreference !== "any" && preferences.partyPreference !== "indifferent") {
    bump(weights, "festivalFit", 0.02);
  }

  applySkillWeights(weights, preferences.skillLevel ?? "mixed");
  applyTripWeights(weights, preferences.tripType ?? "weekend");

  return normalizeWeights(weights);
}
