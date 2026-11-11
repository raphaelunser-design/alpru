import type { ResortDecision } from "@/lib/resortSignals";

export function formatTripCost(min: number, max: number) {
  const format = (value: number) => Math.round(value).toLocaleString("de-DE");

  let priceNote = "Kosten offen";
  if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
    priceNote = `ca. ${format(min)}–${format(max)} € p. P.`;
  } else if (Number.isFinite(min)) {
    priceNote = `ca. ${format(min)} € p. P.`;
  } else if (Number.isFinite(max)) {
    priceNote = `bis ${format(max)} € p. P.`;
  }

  return priceNote;
}

export function presentMatch(result: ResortDecision, originLabel: string) {
  const snow = result.snowReliability;
  const snowLabel = !Number.isFinite(snow) ? "Offen" : snow >= 0.76 ? "Sehr hoch" : snow >= 0.6 ? "Hoch" : snow >= 0.44 ? "Mittel" : "Niedrig";
  return {
    score: Math.max(0, Math.min(100, Math.round(result.matchPct))),
    priceNote: formatTripCost(result.cost?.totalMin, result.cost?.totalMax),
    travelLabel: originLabel ? `ab ${originLabel}` : "Anreise",
    travelTime: "Route prüfen",
    snow: snowLabel,
    reasons: (result.reasons ?? []).slice(0, 3).map((reason) => reason.replaceAll("EUR", "€").replaceAll("p. P.", "pro Person")),
  };
}
