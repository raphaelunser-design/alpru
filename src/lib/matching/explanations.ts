import type { AlpivoScoreResult, ResortInput, UserPreferences } from "@/types/matching";
import { formatEuro, formatPercentDelta } from "./scoringUtils";

export function getMatchLabel(totalScore: number) {
  if (totalScore >= 90) return "Perfektes Match";
  if (totalScore >= 80) return "Sehr gutes Match";
  if (totalScore >= 70) return "Gutes Match";
  if (totalScore >= 60) return "Solide Option";
  return "Passt nur bedingt";
}

export function determineRecommendationType(result: Pick<AlpivoScoreResult, "categoryScores" | "totalScore">, preferences: UserPreferences = {}) {
  const scores = result.categoryScores;
  if (scores.valueForMoney >= 84 && scores.budget >= 72) return "Beste Preis-Leistung";
  if (scores.distance >= 86 && (preferences.tripType === "day_trip" || (preferences.priorities?.distance ?? 0) >= 4)) {
    return "Beste Wahl für kurze Anreise";
  }
  if (scores.skillFit >= 84 && (preferences.skillLevel === "beginner" || preferences.wantsFamilyFriendly)) return "Beste Wahl für Anfänger";
  if (scores.apresSki >= 82 && (preferences.wantsApresSki || (preferences.priorities?.apresSki ?? 0) >= 4)) return "Beste Wahl für Après-Ski";
  if (scores.crowd >= 82 && preferences.wantsQuiet) return "Beste ruhige Alternative";
  if (scores.offPiste >= 82 && preferences.wantsOffPiste) return "Beste Off-Piste-Option";
  if (scores.tripTypeFit >= 82 && scores.pisteFit >= 60 && scores.valueForMoney >= 70) return "Gute kleine Alternative";
  if (result.totalScore >= 80) return "Bestes Gesamtmatch";
  return "Solide Alternative";
}

export function generateMatchExplanations(
  partial: Pick<AlpivoScoreResult, "categoryScores" | "estimatedCosts" | "missingDataNotes">,
  resort: ResortInput,
  preferences: UserPreferences = {}
) {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const scores = partial.categoryScores;
  const costs = partial.estimatedCosts;

  if (preferences.budgetPerPerson && scores.budget >= 70) {
    reasons.push(`Passt gut zu deinem Budget: geschätzt ${formatEuro(costs.totalPerPerson)} p.P. bei ${formatEuro(preferences.budgetPerPerson)} Budget.`);
  }
  if (scores.distance >= 78 && preferences.tripType) {
    reasons.push(`Sehr stark für ${preferences.tripType === "day_trip" ? "einen Tagestrip" : "diesen Reisetyp"} durch kurze Anreise.`);
  }
  if (scores.valueForMoney >= 78) {
    reasons.push("Gutes Preis-Leistungs-Verhältnis: solide Ski-Qualität bei moderaten Gesamtkosten.");
  }
  if (scores.skillFit >= 78) {
    reasons.push(
      preferences.skillLevel === "beginner"
        ? "Gute Wahl für Anfänger, weil einfache Pisten und Planbarkeit stärker gewichtet werden."
        : "Pistenprofil passt gut zum angegebenen Fahrlevel."
    );
  }
  if (scores.weatherSnow >= 78) reasons.push("Schnee- und Höhenlagen-Signale sprechen für verlässlichere Bedingungen.");
  if (scores.apresSki >= 78 && preferences.wantsApresSki) reasons.push("Starker Après-Ski-Fit für Gruppen und Abende nach dem Skitag.");
  if (scores.offPiste >= 78 && preferences.wantsOffPiste) reasons.push("Off-Piste-Potenzial ist im Vergleich zu ähnlichen Resorts überdurchschnittlich.");
  if (scores.tripTypeFit >= 80 && (resort.pisteKmTotal ?? 0) > 0 && (resort.pisteKmTotal ?? 0) < 80) {
    reasons.push("Auch ein kleineres Skigebiet wird positiv bewertet, weil Reisetyp, Budget und Anreise gut zusammenpassen.");
  }

  if (preferences.budgetPerPerson && costs.totalPerPerson > preferences.budgetPerPerson * 1.05) {
    warnings.push(`Liegt ca. ${formatPercentDelta(costs.totalPerPerson, preferences.budgetPerPerson)}.`);
  }
  if (partial.missingDataNotes.some((note) => note.toLowerCase().includes("schnee") || note.toLowerCase().includes("wetter"))) {
    warnings.push("Schnee-/Wetterdaten sind aktuell nur grob geschätzt.");
  }
  if (preferences.wantsOffPiste) {
    warnings.push("Off-Piste-Eignung ist nur eine grobe Orientierung. Lawinenlage und lokale Sicherheitshinweise müssen separat geprüft werden.");
  }
  if (scores.distance < 45 && preferences.tripType === "day_trip") warnings.push("Für einen Tagestrip ist die Anreise voraussichtlich ein klarer Nachteil.");

  return {
    reasons: Array.from(new Set(reasons)).slice(0, 5),
    warnings: Array.from(new Set(warnings)).slice(0, 3),
  };
}
