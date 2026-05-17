import Link from "next/link";
import MetricChip from "@/components/premium/MetricChip";
import { repairText } from "@/lib/mvpResorts";
import {
  buildTripRoute,
  computeBudgetSummary,
  formatCurrency,
  formatDateRange,
  getBestDateSummaries,
  tripLevelLabels,
  type SkiTripBundle,
} from "@/lib/tripPlanner";

type TripCardProps = {
  bundle: SkiTripBundle;
};

export default function TripCard({ bundle }: TripCardProps) {
  const bestDate = getBestDateSummaries(bundle)[0];
  const budget = computeBudgetSummary(bundle);
  const joinedCount = bundle.members.filter((member) => member.status === "joined").length;
  const heroResort =
    bundle.resorts[bundle.favorites.find((favorite) => favorite.isPinned)?.resortSlug ?? ""] ??
    bundle.resorts[bundle.favorites[0]?.resortSlug ?? ""] ??
    null;
  const imageUrl = heroResort?.imageUrl ?? "/bg/skilandschaft.png";
  const title = repairText(bundle.trip.title) ?? bundle.trip.title;
  const description = repairText(bundle.trip.description) ?? "Gruppenplanung für Ski, Resorts und Kosten.";
  const favoriteNames = bundle.favorites.map((favorite) => repairText(bundle.resorts[favorite.resortSlug]?.name) ?? favorite.resortSlug);
  const levelLabel = repairText(tripLevelLabels[bundle.trip.skiLevel]) ?? tripLevelLabels[bundle.trip.skiLevel];
  const bestDateLabel = bestDate ? repairText(bestDate.fitLabel) ?? bestDate.fitLabel : null;

  return (
    <article className="group overflow-hidden rounded-[1.7rem] border border-white/12 bg-slate-950/74 text-white shadow-[0_28px_90px_rgba(2,6,23,0.34)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-sky-200/34">
      <div
        className="relative min-h-[190px] border-b border-white/10 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(8,17,31,0.04), rgba(8,17,31,0.88)), url("${imageUrl}")` }}
      >
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="rounded-full border border-white/15 bg-slate-950/55 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/80">
            Ski Trip
          </span>
          <span className="rounded-full border border-white/15 bg-slate-950/55 px-3 py-1 text-xs text-white/85">
            {bundle.isDemo ? "Demo" : "Live"}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/70">{levelLabel}</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-xl text-sm text-white/78">{description}</p>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricChip icon="vibe" value={String(joinedCount)} label="aktiv im Trip" variant="glass" />
            <MetricChip
              icon="time"
              value={bestDate ? formatDateRange(bestDate.dateOption.startDate, bestDate.dateOption.endDate) : "Noch offen"}
              label={bestDate ? `${bestDateLabel}, ${bestDate.availableCount}x verfügbar` : "Termine abstimmen"}
              variant="glass"
            />
            <MetricChip icon="cost" value={formatCurrency(budget.total)} label={`${formatCurrency(budget.perPerson)} p. P.`} variant="glass" />
          </div>

          <div className="flex flex-wrap gap-2">
            {bundle.trip.focus.map((focus) => (
              <span
                key={focus}
                className="rounded-full border border-sky-200/15 bg-sky-200/[0.08] px-3 py-1 text-xs text-sky-50"
              >
                {focus}
              </span>
            ))}
          </div>

          <div className="text-sm text-slate-300">
            {bundle.favorites.length > 0 ? (
              <span>
                Aktuelle Resort-Favoriten:{" "}
                <span className="text-white">{favoriteNames.join(", ")}</span>
              </span>
            ) : (
              <span>Noch keine Resort-Favoriten gepflegt.</span>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={buildTripRoute(bundle.trip.id, "overview")}
            className="button-lift flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-center text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.25)] hover:bg-sky-400"
          >
            Trip Öffnen
          </Link>
          <Link
            href={buildTripRoute(bundle.trip.id, "compare")}
            className="button-lift flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
          >
            Preisvergleich
          </Link>
          <Link
            href={buildTripRoute(bundle.trip.id, "expenses")}
            className="button-lift flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
          >
            Gruppenkosten
          </Link>
        </div>
      </div>
    </article>
  );
}
