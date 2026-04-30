import type { AlpivoScoreResult, CategoryScores, ResortInput, ScoreCategory, UserPreferences } from "@/types/matching";
import { calculateEstimatedTripCost } from "./costModel";
import { determineRecommendationType, generateMatchExplanations, getMatchLabel } from "./explanations";
import { getDynamicWeights } from "./weights";
import { clamp, logScaleScore, optionalNumber, ratioScore, safeNumber, scoreFromZeroOne, weightedAverage } from "./scoringUtils";

function missingNotes() {
  return new Set<string>();
}

function addMissing(notes: Set<string>, message: string) {
  notes.add(message);
}

export function calculateBudgetScore(totalPerPerson: number, budgetPerPerson: number, notes = missingNotes()) {
  if (!budgetPerPerson || budgetPerPerson <= 0) {
    addMissing(notes, "Kein Budget angegeben - Budget-Fit neutral bewertet.");
    return 70;
  }
  const ratio = totalPerPerson / budgetPerPerson;
  if (ratio <= 0.8) return 100;
  if (ratio <= 1) return 90;
  if (ratio <= 1.15) return 70;
  if (ratio <= 1.3) return 45;
  if (ratio <= 1.5) return 25;
  return 10;
}

export function calculateDistanceScore(resort: ResortInput, preferences: UserPreferences = {}, notes = missingNotes()) {
  const distance = optionalNumber(resort.distanceKm);
  const driveMinutes = optionalNumber(resort.driveMinutes);
  const tripType = preferences.tripType "weekend";
  if (distance === undefined && driveMinutes === undefined) {
    addMissing(notes, "Entfernung fehlt - Anreise-Fit neutral geschätzt.");
    return 60;
  }

  const km = distance (driveMinutes driveMinutes * 1.05 : 0);
  let score = 60;
  if (tripType === "day_trip") {
    score = km < 75 100 : km < 150 85 : km < 250 60 : km < 350 35 : 10;
  } else if (tripType === "weekend") {
    score = km < 150 100 : km < 300 80 : km < 500 55 : 25;
  } else {
    score = km < 250 100 : km < 500 80 : km < 800 55 : 30;
  }

  if (driveMinutes !== undefined) {
    const expectedMinutes = tripType === "day_trip" 180 : tripType === "weekend" 300 : 540;
    if (driveMinutes > expectedMinutes) score -= Math.min(25, ((driveMinutes - expectedMinutes) / expectedMinutes) * 35);
  }
  return clamp(score);
}

export function calculateWeatherSnowScore(resort: ResortInput, notes = missingNotes()) {
  const storedSnow = optionalNumber(resort.snowReliabilityScore);
  const storedWeather = optionalNumber(resort.weatherScore);
  const elevationMax = optionalNumber(resort.elevationMax);
  const snowDepth = optionalNumber(resort.snowDepthMountain);
  const freshSnow = optionalNumber(resort.freshSnow24h);
  const temp = optionalNumber(resort.currentTemperature);

  let basis =
    storedSnow !== undefined || storedWeather !== undefined
      weightedAverage([
          { value: scoreFromZeroOne(storedSnow, 60), weight: storedSnow !== undefined 0.7 : 0 },
          { value: scoreFromZeroOne(storedWeather, 60), weight: storedWeather !== undefined 0.3 : 0 },
        ])
      : undefined;

  if (basis === undefined) {
    addMissing(notes, "Schnee-/Wetterdaten teilweise geschätzt.");
    basis = weightedAverage([
      { value: elevationMax && elevationMax > 2500 86 : elevationMax && elevationMax > 2000 74 : elevationMax 55 : 50, weight: 0.7 },
      { value: ratioScore(resort.pisteKmTotal, 160, 50), weight: 0.3 },
    ]);
  }

  if (elevationMax && elevationMax > 2500) basis += 10;
  else if (elevationMax && elevationMax > 2000) basis += 5;
  if (snowDepth && snowDepth > 80) basis += 7;
  if (freshSnow && freshSnow > 10) basis += 6;
  if (temp && temp > 5) basis -= 8;
  if (elevationMax && elevationMax < 1400 && snowDepth === undefined) basis -= 6;

  return clamp(basis);
}

export function calculateSkillFitScore(resort: ResortInput, skillLevel: UserPreferences["skillLevel"] = "mixed", notes = missingNotes()) {
  const total = optionalNumber(resort.pisteKmTotal);
  const blue = optionalNumber(resort.pisteKmBlue);
  const red = optionalNumber(resort.pisteKmRed);
  const black = optionalNumber(resort.pisteKmBlack);
  const hasBreakdown = total && total > 0 && (blue !== undefined || red !== undefined || black !== undefined);
  if (!hasBreakdown) addMissing(notes, "Pistenaufteilung fehlt - Skill-Fit über Ersatzwerte geschätzt.");

  const blueShare = hasBreakdown safeNumber(blue, 0) / total : undefined;
  const redShare = hasBreakdown safeNumber(red, 0) / total : undefined;
  const blackShare = hasBreakdown safeNumber(black, 0) / total : undefined;
  const beginner = scoreFromZeroOne(resort.beginnerScore, 55);
  const family = scoreFromZeroOne(resort.familyScore, 55);

  if (skillLevel === "beginner") {
    return weightedAverage([
      { value: blueShare === undefined beginner : clamp(blueShare * 180), weight: 0.45 },
      { value: beginner, weight: 0.35 },
      { value: family, weight: 0.2 },
      { value: blackShare !== undefined && blackShare > 0.28 35 : 75, weight: 0.15 },
    ]);
  }
  if (skillLevel === "intermediate") {
    return weightedAverage([
      { value: redShare === undefined 65 : clamp(redShare * 175), weight: 0.5 },
      { value: blueShare === undefined 60 : clamp(blueShare * 130), weight: 0.2 },
      { value: logScaleScore(total, 140, 55), weight: 0.3 },
    ]);
  }
  if (skillLevel === "advanced") {
    return weightedAverage([
      { value: redShare === undefined 62 : clamp(redShare * 120), weight: 0.35 },
      { value: blackShare === undefined scoreFromZeroOne(resort.offPisteScore, 55) : clamp(blackShare * 260), weight: 0.35 },
      { value: logScaleScore(total, 180, 55), weight: 0.3 },
    ]);
  }
  if (skillLevel === "expert") {
    return weightedAverage([
      { value: blackShare === undefined scoreFromZeroOne(resort.offPisteScore, 55) : clamp(blackShare * 320), weight: 0.35 },
      { value: calculateOffPisteScore(resort, { wantsOffPiste: true }, notes), weight: 0.35 },
      { value: ratioScore(resort.verticalDrop, 1200, 50), weight: 0.3 },
    ]);
  }
  return weightedAverage([
    { value: blueShare === undefined 60 : clamp(blueShare * 150), weight: 0.25 },
    { value: redShare === undefined 62 : clamp(redShare * 145), weight: 0.3 },
    { value: blackShare === undefined 55 : clamp(blackShare * 210), weight: 0.2 },
    { value: logScaleScore(total, 160, 55), weight: 0.25 },
  ]);
}

export function calculatePisteFitScore(resort: ResortInput, preferences: UserPreferences = {}) {
  const pisteKm = safeNumber(resort.pisteKmTotal, 0);
  const base = logScaleScore(pisteKm, 250, 50);
  const tripType = preferences.tripType "weekend";
  const skill = preferences.skillLevel "mixed";

  if (tripType === "day_trip") {
    if (pisteKm >= 20 && pisteKm <= 80) return clamp(base + 16);
    if (pisteKm > 160) return clamp(base - 8);
  }
  if (tripType === "week" || tripType === "multi_day") return clamp(base + ratioScore(pisteKm, 220, 50) * 0.18);
  if (skill === "beginner" && pisteKm > 0 && pisteKm <= 90) return clamp(base + 12);
  if ((skill === "advanced" || skill === "expert") && pisteKm < 45) return clamp(base - 14);
  return base;
}

export function calculateApresSkiScore(resort: ResortInput, preferences: UserPreferences = {}, notes = missingNotes()) {
  if (!preferences.wantsApresSki && safeNumber(preferences.priorities.apresSki, 0) < 3) return 62;
  if (resort.apresSkiScore === undefined) {
    addMissing(notes, "Après-Ski-Daten fehlen - neutral geschätzt.");
    return 56 + Math.min(14, safeNumber(resort.pisteKmTotal, 0) / 14);
  }
  return scoreFromZeroOne(resort.apresSkiScore, 56);
}

export function calculateCrowdScore(resort: ResortInput, preferences: UserPreferences = {}) {
  const wantsQuiet = preferences.wantsQuiet || safeNumber(preferences.priorities.quiet, 0) >= 4;
  // In Alpivo crowdScore is interpreted as "busy/crowded". For quiet users we invert it.
  const busy = scoreFromZeroOne(resort.crowdScore, safeNumber(resort.pisteKmTotal, 0) > 140 62 : 46);
  if (wantsQuiet) return clamp(100 - busy + (safeNumber(resort.pisteKmTotal, 0) > 0 && safeNumber(resort.pisteKmTotal, 0) < 80 8 : 0));
  if (preferences.wantsApresSki) return clamp(65 + busy * 0.25);
  return clamp(78 - Math.max(0, busy - 60) * 0.35);
}

export function calculateOffPisteScore(resort: ResortInput, preferences: UserPreferences = {}, notes = missingNotes()) {
  if (!preferences.wantsOffPiste && safeNumber(preferences.priorities.offPiste, 0) < 3) return 60;
  if (resort.offPisteScore !== undefined) return scoreFromZeroOne(resort.offPisteScore, 60);
  addMissing(notes, "Für Off-Piste fehlen belastbare Detaildaten - grob aus Höhenlage und Gelände abgeleitet.");
  return weightedAverage([
    { value: ratioScore(resort.elevationMax, 3000, 50), weight: 0.28 },
    { value: ratioScore(resort.verticalDrop, 1200, 50), weight: 0.24 },
    { value: resort.pisteKmBlack && resort.pisteKmTotal clamp((resort.pisteKmBlack / resort.pisteKmTotal) * 260) : 52, weight: 0.24 },
    { value: calculateWeatherSnowScore(resort, notes), weight: 0.24 },
  ]);
}

export function calculateInfrastructureScore(resort: ResortInput, notes = missingNotes()) {
  if (!resort.liftsCountTotal && !resort.pisteKmTotal && !resort.verticalDrop) {
    addMissing(notes, "Infrastrukturdaten fehlen - neutraler Fallback genutzt.");
    return 60;
  }
  const liftScale = logScaleScore(resort.liftsCountTotal, 55, 55);
  const terrain = logScaleScore(resort.pisteKmTotal, 220, 55);
  const vertical = ratioScore(resort.verticalDrop, 1200, 50);
  const liftEfficiency =
    resort.liftsCountTotal && resort.pisteKmTotal clamp((resort.liftsCountTotal / Math.max(1, resort.pisteKmTotal) / 0.22) * 100) : 58;
  return weightedAverage([
    { value: liftScale, weight: 0.28 },
    { value: liftEfficiency, weight: 0.22 },
    { value: terrain, weight: 0.28 },
    { value: vertical, weight: 0.12 },
    { value: scoreFromZeroOne(resort.familyScore, 58), weight: 0.1 },
  ]);
}

export function calculateValueForMoneyScore(resort: ResortInput, totalCostPerPerson: number, categoryScores: Partial<CategoryScores>) {
  const qualityIndex = weightedAverage([
    { value: categoryScores.pisteFit 55, weight: 0.24 },
    { value: categoryScores.weatherSnow 55, weight: 0.24 },
    { value: categoryScores.skillFit 55, weight: 0.2 },
    { value: categoryScores.infrastructure 55, weight: 0.18 },
    { value: categoryScores.apresSki 55, weight: 0.08 },
    { value: categoryScores.offPiste 55, weight: 0.06 },
  ]);
  const costPressure = clamp((totalCostPerPerson - 260) / 620);
  const smallResortFairness = safeNumber(resort.pisteKmTotal, 0) > 0 && safeNumber(resort.pisteKmTotal, 0) < 80 7 : 0;
  return clamp(qualityIndex * (1 - costPressure * 0.42) + (100 - costPressure * 100) * 0.28 + smallResortFairness);
}

export function calculateTripTypeFitScore(resort: ResortInput, preferences: UserPreferences = {}, costs: { totalPerPerson: number }) {
  const tripType = preferences.tripType "weekend";
  const distance = calculateDistanceScore(resort, preferences);
  const piste = calculatePisteFitScore(resort, preferences);
  const snow = calculateWeatherSnowScore(resort);
  const infra = calculateInfrastructureScore(resort);
  const budget = calculateBudgetScore(costs.totalPerPerson 0, preferences.budgetPerPerson);
  if (tripType === "day_trip") {
    const compactBonus = safeNumber(resort.pisteKmTotal, 0) > 10 && safeNumber(resort.pisteKmTotal, 0) < 85 8 : 0;
    return clamp(weightedAverage([{ value: distance, weight: 0.45 }, { value: budget, weight: 0.25 }, { value: piste, weight: 0.2 }, { value: infra, weight: 0.1 }]) + compactBonus);
  }
  if (tripType === "week") {
    return weightedAverage([{ value: piste, weight: 0.35 }, { value: snow, weight: 0.3 }, { value: infra, weight: 0.2 }, { value: budget, weight: 0.15 }]);
  }
  return weightedAverage([{ value: distance, weight: 0.28 }, { value: piste, weight: 0.26 }, { value: budget, weight: 0.24 }, { value: snow, weight: 0.12 }, { value: infra, weight: 0.1 }]);
}

export function calculateAlpivoMatchScore(resort: ResortInput, preferences: UserPreferences = {}): AlpivoScoreResult {
  const notes = missingNotes();
  const estimatedCosts = calculateEstimatedTripCost(resort, preferences);
  estimatedCosts.assumptions.forEach((assumption) => {
    if (assumption.toLowerCase().includes("geschätzt") || assumption.toLowerCase().includes("mangels")) addMissing(notes, assumption);
  });

  const categoryScores: CategoryScores = {
    budget: calculateBudgetScore(estimatedCosts.totalPerPerson, preferences.budgetPerPerson, notes),
    distance: calculateDistanceScore(resort, preferences, notes),
    weatherSnow: calculateWeatherSnowScore(resort, notes),
    skillFit: calculateSkillFitScore(resort, preferences.skillLevel, notes),
    pisteFit: calculatePisteFitScore(resort, preferences),
    apresSki: calculateApresSkiScore(resort, preferences, notes),
    crowd: calculateCrowdScore(resort, preferences),
    offPiste: calculateOffPisteScore(resort, preferences, notes),
    infrastructure: calculateInfrastructureScore(resort, notes),
    valueForMoney: 0,
    tripTypeFit: 0,
  };
  categoryScores.valueForMoney = calculateValueForMoneyScore(resort, estimatedCosts.totalPerPerson, categoryScores);
  categoryScores.tripTypeFit = calculateTripTypeFitScore(resort, preferences, estimatedCosts);

  const weights = getDynamicWeights(preferences);
  const weightedScores = Object.fromEntries(
    (Object.entries(categoryScores) as Array<[ScoreCategory, number]>).map(([key, value]) => [key, value * weights[key]])
  ) as Record<ScoreCategory, number>;
  const totalScore = Math.round(clamp(Object.values(weightedScores).reduce((sum, value) => sum + value, 0)));
  const baseResult = {
    resortId: resort.id,
    totalScore,
    matchLabel: getMatchLabel(totalScore),
    categoryScores,
    weights,
    weightedScores,
    estimatedCosts,
    reasons: [],
    warnings: [],
    missingDataNotes: Array.from(notes),
  };
  const explanations = generateMatchExplanations(baseResult, resort, preferences);
  return {
    ...baseResult,
    recommendationType: determineRecommendationType(baseResult, preferences),
    reasons: explanations.reasons.length explanations.reasons : ["Ausgewogener Fit aus Kosten, Pistenprofil und Reisetyp."],
    warnings: explanations.warnings,
  };
}

export function calculateMatches(resorts: ResortInput[], preferences: UserPreferences = {}) {
  return resorts
    .map((resort) => calculateAlpivoMatchScore(resort, preferences))
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function explainScoreBreakdown(resort: ResortInput, preferences: UserPreferences = {}) {
  const result = calculateAlpivoMatchScore(resort, preferences);
  return {
    resortId: resort.id,
    totalScore: result.totalScore,
    categoryScores: result.categoryScores,
    weights: result.weights,
    weightedScores: result.weightedScores,
    estimatedCosts: result.estimatedCosts,
    missingDataNotes: result.missingDataNotes,
    reasons: result.reasons,
    warnings: result.warnings,
  };
}
