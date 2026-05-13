"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import RoutePreview from "@/components/RoutePreview";
import type { BudgetStatus, CostEstimate, ResortDecision, ResortVibeTag } from "@/lib/resortSignals";

type CardResort = Partial<ResortDecision> & {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string | null;
};

type ResortDecisionCardProps = {
  resort: CardResort;
  peopleCount?: number;
  distanceKm?: number | null;
  driveHours?: number | null;
  routeSource?: "osrm" | "fallback" | null;
  origin?: { lat: number; lon: number; label: string } | null;
  compact?: boolean;
  priority?: boolean;
};

const number = new Intl.NumberFormat("de-DE");
const fallbackImage = "/bg/skilandschaft.png";

function budgetLabel(status: BudgetStatus | undefined) {
  if (status === "green") return "im Budget";
  if (status === "yellow") return "knapp darüber";
  if (status === "red") return "über Budget";
  return "Budget offen";
}

function budgetClass(status: BudgetStatus | undefined) {
  if (status === "green") return "border-emerald-300/30 bg-emerald-300/12 text-emerald-100";
  if (status === "yellow") return "border-amber-300/35 bg-amber-300/12 text-amber-100";
  if (status === "red") return "border-rose-300/35 bg-rose-300/12 text-rose-100";
  return "border-white/15 bg-white/10 text-slate-200";
}

function vibeClass(tag: ResortVibeTag | undefined) {
  if (!tag) return "border-white/10 bg-white/[0.08] text-slate-100";
  if (tag.tone === "amber") return "border-amber-200/25 bg-amber-200/10 text-amber-50";
  if (tag.tone === "green") return "border-emerald-200/25 bg-emerald-200/10 text-emerald-50";
  if (tag.tone === "ice") return "border-sky-200/25 bg-sky-200/10 text-sky-50";
  return "border-white/10 bg-white/[0.08] text-slate-100";
}

function cssImage(src: string) {
  return `url(${JSON.stringify(src)})`;
}

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCost(value: number | null | undefined) {
  const safe = safeNumber(value);
  if (safe === null) return "-";
  return `${number.format(Math.round(safe))} €`;
}

function qualityLabel(value: "real" | "estimated" | "missing" | undefined) {
  if (value === "real") return "echt";
  if (value === "estimated") return "geschaetzt";
  if (value === "missing") return "fehlt";
  return "geschaetzt";
}

function formatCostComponent(
  value: number | null | undefined,
  quality: "real" | "estimated" | "missing" | undefined,
  note: string | undefined,
  missingLabel: string
) {
  if (quality === "missing") return note || missingLabel;
  const safe = safeNumber(value);
  if (safe === null) return missingLabel;
  if (safe === 0 && quality !== "real") return note || missingLabel;
  return formatCost(safe);
}

function scoreDetailLabel(category: string) {
  const labels: Record<string, string> = {
    budget: "Budget",
    distance: "Anreise",
    weatherSnow: "Schnee",
    skillFit: "Fahrlevel",
    pisteFit: "Pisten",
    apresSki: "Après-Ski",
    crowd: "Ruhe",
    offPiste: "Off-Piste",
    infrastructure: "Infrastruktur",
    valueForMoney: "Preis-Leistung",
    tripTypeFit: "Trip-Fit",
    festivalFit: "Vibe & Events",
  };
  return labels[category] || category;
}

function confidenceLabel(value: string | undefined) {
  if (value === "high") return "hoch";
  if (value === "medium") return "mittel";
  if (value === "low") return "niedrig";
  return "mittel";
}

function estimateFuelPerPerson(distanceKm: number | null | undefined, peopleCount: number) {
  if (typeof distanceKm !== "number" || Number.isNaN(distanceKm) || distanceKm <= 0) return null;
  const roundTripKm = distanceKm * 2;
  const liters = (roundTripKm * 7.2) / 100;
  return Math.round((liters * 1.9) / Math.max(1, peopleCount));
}

function formatDriveHours(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const totalMinutes = Math.max(1, Math.round(value * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function fitPercent(value: number | null | undefined) {
  const safe = safeNumber(value);
  if (safe === null) return 0;
  return Math.max(0, Math.min(100, Math.round(safe * 100)));
}

function signalQualityLabel(value: number | null | undefined) {
  const safe = safeNumber(value);
  if (safe === null) return "offen";
  if (safe >= 0.72) return "sehr gut";
  if (safe >= 0.58) return "gut";
  if (safe >= 0.44) return "solide";
  return "saisonal";
}

function apresEnergyLabel(value: number | null | undefined) {
  const safe = safeNumber(value);
  if (safe === null) return "offen";
  if (safe >= 0.76) return "lebendig";
  if (safe >= 0.58) return "ausgewogen";
  return "ruhig";
}

function scoreToneClass(match: number) {
  if (match >= 78) return "from-emerald-300 to-sky-200 text-slate-950";
  if (match >= 62) return "from-sky-200 to-cyan-100 text-slate-950";
  return "from-white/90 to-slate-200 text-slate-950";
}

function pickSignal(value: number | null | undefined, fallback?: number | null) {
  const safe = safeNumber(value);
  if (safe !== null) return safe;
  const fallbackSafe = safeNumber(fallback);
  return fallbackSafe !== null ? fallbackSafe : 0;
}

function strongestSignal(resort: CardResort) {
  const fitProfile = (resort.fitProfile || {}) as Partial<ResortDecision["fitProfile"]>;
  const entries = [
    { label: "Pistenprofil", value: pickSignal(fitProfile.slope) },
    { label: "Vibe", value: pickSignal(fitProfile.vibe) },
    { label: "Events", value: pickSignal(fitProfile.festival, resort.festivalFitScore) },
    { label: "Schnee", value: pickSignal(fitProfile.snow, resort.snowReliability) },
    { label: "Sommer-Gletscher", value: pickSignal(fitProfile.summer, resort.summerGlacierScore) },
    { label: "Off-Piste", value: pickSignal(fitProfile.offPiste) },
    { label: "Value", value: pickSignal(fitProfile.value, resort.valueScore) },
    { label: "Komfort", value: pickSignal(fitProfile.comfort) },
  ].sort((a, b) => b.value - a.value);
  return entries[0];
}

function matchReadout(resort: CardResort) {
  const strongest = strongestSignal(resort);
  const match = displayMatchPct(resort.matchPct);
  if (resort.matchLabel && resort.recommendationType) return `${resort.matchLabel} · ${resort.recommendationType}.`;
  if (resort.matchLabel) return `${resort.matchLabel}, vor allem durch ${strongest.label}.`;
  if (match >= 75) return `Sehr starker Fit, vor allem durch ${strongest.label}.`;
  if (match >= 62) return `Guter Fit mit ${strongest.label} als wichtigstem Treiber.`;
  if (match >= 48) return "Solider Kandidat, aber die Haken sind wichtiger als der Score.";
  return "Eher ein Nischen-Fit. Nur spannend, wenn die konkreten Vorteile für dich zählen.";
}

function nextCheck(resort: CardResort) {
  const fitProfile = (resort.fitProfile || {}) as Partial<ResortDecision["fitProfile"]>;
  const snowSignal = pickSignal(fitProfile.snow, resort.snowReliability);
  const comfortSignal = pickSignal(fitProfile.comfort, 0.5);
  if (resort.budgetStatus === "red") return "Budget zuerst prüfen";
  if (resort.tripStyleHint === "Sommer-Gletscher" && pickSignal(fitProfile.summer, resort.summerGlacierScore) >= 0.58) {
    return "Sommerbetrieb offiziell prüfen";
  }
  if (resort.tripStyleHint === "Off-Piste Finder" && pickSignal(fitProfile.offPiste) >= 0.58) {
    return "Lawinenlage und lokale Regeln prüfen";
  }
  if (snowSignal < 0.45) return "Schneelage checken";
  if (comfortSignal < 0.42) return "Stressfaktoren prüfen";
  if (resort.pisteMapUrl || resort.openskimapUrl) return "Pistenkarte ansehen";
  return "Preise und Verfügbarkeit prüfen";
}

function displayMatchPct(value: number | null | undefined) {
  const safe = safeNumber(value);
  return safe === null ? 1 : Math.max(1, Math.min(100, Math.round(safe)));
}

export default function ResortDecisionCard({
  resort,
  peopleCount = 1,
  distanceKm,
  driveHours,
  routeSource,
  origin,
  compact = false,
}: ResortDecisionCardProps) {
  const [showRoute, setShowRoute] = useState(false);
  const reduceMotion = useReducedMotion();
  const cost = (resort.cost || {}) as Partial<CostEstimate>;
  const algorithmCosts = resort.estimatedCosts || (resort.alpivoScore && resort.alpivoScore.estimatedCosts) || null;
  const image = (resort.imageUrl || "").trim() || fallbackImage;
  const reasons = resort.reasons && resort.reasons.length ? resort.reasons : ["passt gut zu deinem Kriterienmix"];
  const drawbacks = resort.drawbacks && resort.drawbacks.length ? resort.drawbacks : ["Details vor Buchung prüfen"];
  const vibeTags = resort.vibeTags && resort.vibeTags.length ? resort.vibeTags : [];
  const pisteKm = safeNumber(resort.pisteKm) || (resort.slopeProfile ? safeNumber(resort.slopeProfile.total) : null);
  const totalMin = safeNumber(cost.totalMin);
  const totalMax = safeNumber(cost.totalMax);
  const routeFuelPerPerson = estimateFuelPerPerson(distanceKm, peopleCount);
  const adjustedTotalMin =
    typeof totalMin === "number" && typeof routeFuelPerPerson === "number"
      ? Math.max(0, totalMin - (cost.travelMin || 0) + routeFuelPerPerson)
      : totalMin;
  const adjustedTotalMax =
    typeof totalMax === "number" && typeof routeFuelPerPerson === "number"
      ? Math.max(adjustedTotalMin || 0, totalMax - (cost.travelMax || 0) + routeFuelPerPerson)
      : totalMax;
  const routeAdjustedAlgorithmCost =
    algorithmCosts && typeof routeFuelPerPerson === "number"
      ? Math.max(0, algorithmCosts.totalPerPerson - algorithmCosts.transportPerPerson + routeFuelPerPerson)
      : algorithmCosts
        ? algorithmCosts.totalPerPerson
        : null;
  const displayedCost = typeof routeAdjustedAlgorithmCost === "number" ? routeAdjustedAlgorithmCost : adjustedTotalMin;
  const displayedMaxCost = algorithmCosts ? null : adjustedTotalMax;
  const totalPeopleMin = typeof displayedCost === "number" ? displayedCost * Math.max(1, peopleCount) : null;
  const totalPeopleMax = typeof displayedMaxCost === "number" ? displayedMaxCost * Math.max(1, peopleCount) : null;
  const scoreSource = resort.categoryScores || (resort.alpivoScore && resort.alpivoScore.categoryScores) || {};
  const scoreDetails = Object.entries(scoreSource)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]))
    .sort(([, a], [, b]) => b - a)
    .slice(0, compact ? 3 : 5);
  const strongest = strongestSignal(resort);
  const canShowRoute = Boolean(
    !compact &&
      origin &&
      Number.isFinite(origin.lat) &&
      Number.isFinite(origin.lon) &&
      Number.isFinite(resort.lat) &&
      Number.isFinite(resort.lon)
  );
  const match = displayMatchPct(resort.matchPct);
  const location = [resort.region, resort.country].filter(Boolean).join(", ");
  const routeSummary =
    typeof driveHours === "number"
      ? formatDriveHours(driveHours)
      : typeof distanceKm === "number"
        ? `${number.format(Math.round(distanceKm))} km`
        : "-";
  const compactReasons = reasons.slice(0, compact ? 2 : 3);
  const primaryVibeTags = vibeTags.slice(0, compact ? 3 : 3);
  const eventBadges = resort.eventBadges?.slice(0, compact ? 2 : 4) ?? [];
  const layoutClass = compact ? "grid" : "grid lg:grid-cols-[minmax(230px,0.34fr)_1fr]";
  const imageClass = compact
    ? "relative block min-h-[168px] overflow-hidden bg-cover bg-center"
    : "relative block min-h-[185px] overflow-hidden bg-cover bg-center lg:min-h-full";
  const firstAssumption = algorithmCosts && algorithmCosts.assumptions ? algorithmCosts.assumptions[0] : null;
  const costQuality = algorithmCosts?.componentQuality;
  const costNotes = algorithmCosts?.componentNotes;
  const transportQuality = typeof routeFuelPerPerson === "number" ? "estimated" : costQuality?.transport;
  const transportNote = typeof routeFuelPerPerson === "number" ? "Transport berechnet" : costNotes?.transport;
  const transportValue =
    typeof routeFuelPerPerson === "number"
      ? routeFuelPerPerson
      : algorithmCosts
        ? algorithmCosts.transportPerPerson
        : cost.travelMin;
  const costQualityLabels = [
    `Skipass: ${qualityLabel(costQuality?.skiPass ?? (cost.passSource === "stored" ? "real" : "estimated"))}`,
    `Unterkunft: ${qualityLabel(costQuality?.accommodation)}`,
    `Transport: ${qualityLabel(transportQuality)}`,
    `Essen: ${qualityLabel(costQuality?.foodDrink)}`,
    `Leihmaterial: ${qualityLabel(costQuality?.rental)}`,
    `Extras: ${qualityLabel(costQuality?.extras)}`,
  ];

  if (compact) {
    return (
      <motion.article
        className="group overflow-hidden rounded-[1.35rem] border border-white/12 bg-slate-950/62 shadow-[0_26px_80px_rgba(2,6,23,0.30)] backdrop-blur-xl"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        whileHover={reduceMotion ? undefined : { y: -4 }}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <Link
          href={`/resort/${encodeURIComponent(resort.slug)}`}
          className="relative block min-h-[230px] overflow-hidden"
          aria-label={`${resort.name} öffnen`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.035]"
            style={{ backgroundImage: `${cssImage(image)}` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/42 to-slate-950/0" />
          <div className="absolute left-4 top-4 rounded-2xl border border-white/20 bg-slate-950/62 px-3 py-2 text-white shadow-lg backdrop-blur-xl">
            <div className={`rounded-xl bg-gradient-to-br px-3 py-2 text-center ${scoreToneClass(match)}`}>
              <div className="text-2xl font-extrabold leading-none">{match}%</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em]">Match</div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/72">{location || resort.country}</div>
            <h3 className="mt-1 text-2xl font-extrabold leading-tight text-white drop-shadow-lg">{resort.name}</h3>
          </div>
        </Link>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {primaryVibeTags.map((tag) => (
              <span key={tag.label} className={`rounded-full border px-2.5 py-1 text-[11px] ${vibeClass(tag)}`}>
                {tag.label}
              </span>
            ))}
            {resort.tripStyleHint ? (
              <span className="rounded-full border border-white/12 bg-white/[0.07] px-2.5 py-1 text-[11px] text-slate-100">
                {resort.tripStyleHint}
              </span>
            ) : null}
          </div>

          <div className="rounded-2xl border border-sky-200/16 bg-sky-200/[0.07] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100/75">Warum es passt</div>
              <div className="rounded-full border border-sky-100/18 px-2 py-1 text-[11px] text-sky-50">
                {strongest.label} {fitPercent(strongest.value)}%
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-100">
              {compactReasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Kosten p. P." value={formatCost(displayedCost)} />
            <Stat label="Schnee" value={signalQualityLabel(resort.snowReliability)} />
            <Stat label="Pisten" value={pisteKm ? `${number.format(pisteKm)} km` : "offen"} />
            <Stat label="Après" value={apresEnergyLabel(resort.apresScore)} />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-xs leading-5 text-slate-400">{nextCheck(resort)}</p>
            <Link
              className="button-lift shrink-0 rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
              href={`/resort/${encodeURIComponent(resort.slug)}`}
            >
              Details ansehen
            </Link>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/58 shadow-[0_24px_70px_rgba(2,6,23,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-200/30 hover:shadow-[0_26px_72px_rgba(56,189,248,0.14)]">
      <div className={layoutClass}>
        <Link
          href={`/resort/${encodeURIComponent(resort.slug)}`}
          className={imageClass}
          style={{ backgroundImage: `${cssImage(image)}` }}
          aria-label={`${resort.name} öffnen`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/10 via-slate-950/18 to-slate-950/78 transition duration-300 group-hover:from-slate-950/0" />
          <div className="absolute left-3 top-3 rounded-2xl border border-white/20 bg-slate-950/60 px-3 py-2 text-white shadow-lg backdrop-blur">
            <div className="text-2xl font-semibold leading-none">{match}%</div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-white/70">Alpivo Score</div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] backdrop-blur ${budgetClass(resort.budgetStatus)}`}>
              {budgetLabel(resort.budgetStatus)}
            </span>
            {resort.tripStyleHint ? (
              <span className="rounded-full border border-white/15 bg-slate-950/55 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                {resort.tripStyleHint}
              </span>
            ) : null}
            {resort.recommendationType ? (
              <span className="rounded-full border border-sky-200/25 bg-sky-200/15 px-2.5 py-1 text-[11px] text-sky-50 backdrop-blur">
                {resort.recommendationType}
              </span>
            ) : null}
          </div>
        </Link>

        <div className={compact ? "space-y-3 p-4" : "space-y-4 p-4 sm:p-5"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-slate-400">{location || resort.country}</div>
              <Link href={`/resort/${encodeURIComponent(resort.slug)}`} className="mt-1 block">
                <h3 className="text-xl font-semibold leading-tight text-white transition group-hover:text-sky-100 sm:text-2xl">
                  {resort.name}
                </h3>
              </Link>
            </div>
            {primaryVibeTags.length > 0 ? (
              <div className="flex max-w-full flex-wrap justify-start gap-2 sm:justify-end">
                {primaryVibeTags.map((tag) => (
                  <span key={tag.label} className={`rounded-full border px-2.5 py-1 text-[11px] ${vibeClass(tag)}`}>
                    {tag.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {eventBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {eventBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-sky-200/20 bg-sky-200/[0.09] px-2.5 py-1 text-[11px] text-sky-50">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          <div className="rounded-2xl border border-sky-200/15 bg-sky-200/[0.07] p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-sky-100/80">
              <span className="font-semibold uppercase tracking-wide">Alpivo-Urteil</span>
              {!compact ? (
                <>
                  <span className="rounded-full border border-sky-100/20 px-2 py-0.5 text-[11px]">
                    stärkstes Signal: {strongest.label} {fitPercent(strongest.value)}%
                  </span>
                  <span className="rounded-full border border-sky-100/20 px-2 py-0.5 text-[11px]">
                    {nextCheck(resort)}
                  </span>
                </>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-100">{matchReadout(resort)}</p>
            {scoreDetails.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {scoreDetails.map(([key, value]) => (
                  <span key={key} className="rounded-full border border-white/10 bg-slate-950/25 px-2 py-1 text-[11px] text-slate-100">
                    {scoreDetailLabel(key)} {Math.round(value)}%
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className={`grid grid-cols-2 gap-2 ${compact ? "" : "sm:grid-cols-4"}`}>
            <Stat label="Kosten p. P." value={formatCost(displayedCost)} />
            {!compact ? <Stat label="Route" value={routeSummary} /> : null}
            <Stat label="Pisten" value={pisteKm ? `${number.format(pisteKm)} km` : "-"} />
            <Stat label="Skipass" value={cost.passSource === "stored" ? "gepflegt" : "geschätzt"} />
          </div>

          {!compact && (resort.cost || algorithmCosts) ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kostenbreakdown p. P.</div>
                <div className="text-[11px] text-slate-500">
                  Essen: {cost.foodLevel === "budget" ? "sparsam" : cost.foodLevel === "comfort" ? "Komfort" : "Standard"}
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-6">
                <Stat
                  label="Unterkunft"
                  value={formatCostComponent(
                    algorithmCosts ? algorithmCosts.accommodationPerPerson : cost.accommodationMin,
                    costQuality?.accommodation,
                    costNotes?.accommodation,
                    "Unterkunft noch nicht berechnet"
                  )}
                />
                <Stat
                  label="Skipass"
                  value={formatCostComponent(
                    algorithmCosts ? algorithmCosts.skiPassPerPerson : cost.passMin,
                    costQuality?.skiPass ?? (cost.passSource === "stored" ? "real" : "estimated"),
                    costNotes?.skiPass,
                    "Skipass noch nicht berechnet"
                  )}
                />
                <Stat
                  label="Transport"
                  value={formatCostComponent(transportValue, transportQuality, transportNote, "Transport noch nicht berechnet")}
                />
                <Stat
                  label="Essen"
                  value={formatCostComponent(
                    algorithmCosts ? algorithmCosts.foodDrinkPerPerson : cost.foodMin,
                    costQuality?.foodDrink,
                    costNotes?.foodDrink,
                    "Essen & Trinken noch nicht berechnet"
                  )}
                />
                <Stat
                  label="Leihmaterial"
                  value={formatCostComponent(
                    algorithmCosts ? algorithmCosts.rentalPerPerson : cost.rentalMin,
                    costQuality?.rental,
                    costNotes?.rental,
                    "Leihmaterial noch nicht berechnet"
                  )}
                />
                <Stat
                  label="Extras"
                  value={formatCostComponent(
                    algorithmCosts ? algorithmCosts.extrasPerPerson : cost.parkingMin,
                    costQuality?.extras,
                    costNotes?.extras,
                    "Extras/Puffer noch nicht berechnet"
                  )}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                {costQualityLabels.map((label) => (
                  <span key={label} className="rounded-full border border-white/10 bg-slate-950/35 px-2 py-0.5">
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Vertrauen: {confidenceLabel(algorithmCosts ? algorithmCosts.confidence : undefined)}. {firstAssumption ? firstAssumption : `Unterkunft und Essen sind Länder-/Budget-Schätzungen, Skipass ist ${cost.passSource === "stored" ? "gepflegt" : "geschätzt"}.`}
              </div>
            </div>
          ) : null}

          <div className={`grid gap-3 text-sm text-slate-200 ${compact ? "" : "md:grid-cols-[1.15fr_0.85fr]"}`}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Warum passt es</div>
              <ul className="mt-2 space-y-1.5">
                {compactReasons.map((reason) => (
                  <li key={reason} className="flex gap-2 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.055] p-3">
              <div className="text-xs uppercase tracking-wide text-amber-100/75">Vor Buchung prüfen</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{drawbacks[0]}</p>
              {!compact && resort.missingDataNotes && resort.missingDataNotes[0] ? (
                <p className="mt-2 text-xs leading-relaxed text-amber-50/65">{resort.missingDataNotes[0]}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-stretch justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
            <div className="text-xs leading-relaxed text-slate-400">
              <div>
                {formatCost(displayedCost)}
                {displayedMaxCost && displayedMaxCost !== displayedCost ? ` bis ${formatCost(displayedMaxCost)}` : ""} p. P.
                {peopleCount > 1 ? ` · Gruppe: ${formatCost(totalPeopleMin)}${totalPeopleMax && totalPeopleMax !== totalPeopleMin ? ` bis ${formatCost(totalPeopleMax)}` : ""}` : ""}
              </div>
              {typeof routeFuelPerPerson === "number" ? (
                <div>Sprit/Route: ca. {formatCost(routeFuelPerPerson)} p. P. für Hin- und Rückfahrt, 7,2 l/100 km, 1,90 €/l.</div>
              ) : cost.travelSource === "fallback" ? (
                <div>Anreise ist als Fallback geschätzt, bis ein Startort gesetzt ist.</div>
              ) : null}
              {cost.passSource === "estimated" ? <div>Skipassanteil ist geschätzt, weil kein gepflegter Preis vorliegt.</div> : null}
              {typeof distanceKm === "number" ? (
                <div>
                  {number.format(Math.round(distanceKm))} km Route · {formatDriveHours(driveHours)}
                  {routeSource === "fallback" ? " geschätzt" : ""}
                </div>
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              {canShowRoute ? (
                <button
                  className="button-lift rounded-xl border border-white/15 px-4 py-2 text-center text-sm font-semibold text-white transition hover:border-sky-200/35 hover:bg-sky-200/10"
                  onClick={() => setShowRoute((prev) => !prev)}
                >
                  {showRoute ? "Route schließen" : "Route anzeigen"}
                </button>
              ) : null}
              <Link
                className="button-lift rounded-xl bg-sky-200 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-white"
                href={`/resort/${encodeURIComponent(resort.slug)}`}
              >
                Details ansehen
              </Link>
            </div>
          </div>

          {showRoute && canShowRoute ? (
            <RoutePreview
              origin={origin!}
              destination={{ lat: resort.lat as number, lon: resort.lon as number, label: resort.name }}
              resortName={resort.name}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
