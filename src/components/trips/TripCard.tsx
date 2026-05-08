import Link from "next/link";
import GlassCard from "@/components/GlassCard";
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
    <GlassCard className="overflow-hidden">
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
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.05] p-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Mitglieder</div>
              <div className="mt-2 text-xl font-semibold text-white">{joinedCount}</div>
              <div className="text-xs text-slate-400">aktiv im Trip</div>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.05] p-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Bestes Fenster</div>
              <div className="mt-2 text-base font-semibold leading-6 text-white">
                {bestDate ? formatDateRange(bestDate.dateOption.startDate, bestDate.dateOption.endDate) : "Noch offen"}
              </div>
              <div className="text-xs leading-5 text-slate-400">
          {bestDate ? `${bestDateLabel}, ${bestDate.availableCount}x verfügbar` : "Termine abstimmen"}
              </div>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.05] p-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Plan-Budget</div>
              <div className="mt-2 text-xl font-semibold text-white">{formatCurrency(budget.total)}</div>
              <div className="text-xs text-slate-400">{formatCurrency(budget.perPerson)} pro Person</div>
            </div>
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
            className="button-lift flex min-h-[3.25rem] items-center justify-center rounded-lg bg-sky-200 px-4 py-3 text-center text-sm font-semibold text-slate-950 hover:bg-white"
          >
            Trip Öffnen
          </Link>
          <Link
            href={buildTripRoute(bundle.trip.id, "compare")}
            className="button-lift flex min-h-[3.25rem] items-center justify-center rounded-lg border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
          >
            Preisvergleich
          </Link>
          <Link
            href={buildTripRoute(bundle.trip.id, "expenses")}
            className="button-lift flex min-h-[3.25rem] items-center justify-center rounded-lg border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
          >
            Gruppenkosten
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
