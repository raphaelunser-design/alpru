import { formatCurrency, formatDateRange, type ComparisonRow } from "@/lib/tripPlanner";

type ComparisonTableProps = {
  rows: ComparisonRow[];
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value: number) {
  return `${Math.round(clamp(value))}%`;
}

function getGroupFit(row: ComparisonRow) {
  const totalVotes = Math.max(row.availability.participationCount, row.availability.availableCount + row.availability.maybeCount + row.availability.unavailableCount, 1);
  return ((row.availability.availableCount + row.availability.maybeCount * 0.5) / totalVotes) * 100;
}

function getBudgetFit(row: ComparisonRow, cheapestTotal: number) {
  if (!row.total || !cheapestTotal) return 0;
  return (cheapestTotal / row.total) * 100;
}

function getSnowScore(row: ComparisonRow) {
  const elevation = row.resort ? row.resort.elevationMaxM : null;
  if (typeof elevation !== "number") return null;
  return clamp(45 + ((elevation - 1200) / 1700) * 55);
}

function getDecisionChips(row: ComparisonRow, cheapestTotal: number, bestAvailability: number, bestMix: number) {
  const chips: Array<{ label: string; className: string }> = [];
  if (row.total === cheapestTotal) chips.push({ label: "günstigster Slot", className: "border-sky-200/25 bg-sky-200/10 text-sky-50" });
  if (row.availability.score === bestAvailability) chips.push({ label: "beste Überschneidung", className: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" });
  if (row.combinedScore === bestMix) chips.push({ label: "bester Mix", className: "border-amber-300/30 bg-amber-300/10 text-amber-100" });
  return chips;
}

export default function ComparisonTable({ rows }: ComparisonTableProps) {
  const cheapestTotal = rows.length ? Math.min(...rows.map((row) => row.total)) : 0;
  const bestMix = rows.length ? Math.max(...rows.map((row) => row.combinedScore)) : 0;
  const bestAvailability = rows.length ? Math.max(...rows.map((row) => row.availability.score)) : 0;
  const winner = rows.find((row) => row.combinedScore === bestMix) || rows[0] || null;
  const cheapest = rows.find((row) => row.total === cheapestTotal) || null;
  const bestDate = rows.find((row) => row.availability.score === bestAvailability) || null;

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-950/55 p-5 text-sm text-slate-300">
        Noch kein Vergleich möglich. Füge Favoriten und mindestens einen Zeitraum hinzu.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/55">
      {winner ? (
        <div className="border-b border-white/10 bg-sky-200/[0.07] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-sky-100/75">Warum gewinnt dieses Resort</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {winner.resort ? winner.resort.name : winner.favorite.resortSlug} gewinnt für {formatDateRange(winner.dateOption.startDate, winner.dateOption.endDate)}
          </div>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            Ausschlaggebend ist {winner.decisionReason}: {formatCurrency(winner.totalPerPerson)} pro Person,{" "}
            {formatPercent(getGroupFit(winner))} Gruppen-Fit und {winner.resort && typeof winner.resort.matchPct === "number" ? winner.resort.matchPct : 52}% Alpivo-Fit.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Günstigste Kombi</div>
              <div className="mt-1 text-sm font-semibold text-white">{cheapest ? (cheapest.resort ? cheapest.resort.name : cheapest.favorite.resortSlug) : "-"}</div>
              <div className="mt-1 text-xs text-slate-400">{cheapest ? formatCurrency(cheapest.totalPerPerson) : "-"} pro Person</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Beste Verfügbarkeit</div>
              <div className="mt-1 text-sm font-semibold text-white">{bestDate ? formatDateRange(bestDate.dateOption.startDate, bestDate.dateOption.endDate) : "-"}</div>
              <div className="mt-1 text-xs text-slate-400">{bestDate ? formatPercent(getGroupFit(bestDate)) : "-"} Gruppen-Fit</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Ski-Fit</div>
              <div className="mt-1 text-sm font-semibold text-white">{winner.resort && typeof winner.resort.matchPct === "number" ? winner.resort.matchPct : 52}% Alpivo-Fit</div>
              <div className="mt-1 text-xs text-slate-400">Preis, Verfügbarkeit und Resortdaten kombiniert</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[980px] border-collapse text-sm">
          <thead className="bg-white/[0.04] text-left text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Skigebiet</th>
              <th className="px-4 py-3 font-medium">Zeitraum</th>
              <th className="px-4 py-3 font-medium">Entscheidung</th>
              <th className="px-4 py-3 font-medium">Kosten</th>
              <th className="px-4 py-3 font-medium">Ski-Fit</th>
              <th className="px-4 py-3 font-medium">Gruppe</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const snapshot = (row.snapshot || {}) as Partial<NonNullable<ComparisonRow["snapshot"]>>;
              const otherCosts = (snapshot.rental || 0) + (snapshot.skiSchool || 0) + (snapshot.food || 0) + (snapshot.buffer || 0);
              const groupFit = getGroupFit(row);
              const budgetFit = getBudgetFit(row, cheapestTotal);
              const snowScore = getSnowScore(row);
              const chips = getDecisionChips(row, cheapestTotal, bestAvailability, bestMix);

              return (
                <tr key={`${row.favorite.id}-${row.dateOption.id}`} className="border-t border-white/10 text-slate-200">
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-white">{row.resort ? row.resort.name : row.favorite.resortSlug}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.resort ? [row.resort.region, row.resort.country].filter(Boolean).join(", ") || "Resort-Favorit" : "Resort-Favorit"}</div>
                    {chips.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {chips.map((chip) => (
                          <span key={chip.label} className={`rounded-full border px-2 py-1 text-[11px] ${chip.className}`}>
                            {chip.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-white">{formatDateRange(row.dateOption.startDate, row.dateOption.endDate)}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.dateOption.label}</div>
                  </td>
                  <td className="max-w-[240px] px-4 py-4 align-top">
                    <div className="text-sm text-slate-200">{row.decisionReason}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      Gesamt-Score {formatPercent(row.combinedScore * 100)}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-base font-semibold text-white">{formatCurrency(row.totalPerPerson)} p. P.</div>
                    <div className="mt-1 text-xs text-slate-500">gesamt {formatCurrency(row.total)}</div>
                    <div className="mt-2 grid gap-1 text-xs text-slate-400">
                      <span>Skipass {formatCurrency(snapshot.skipass || 0)}</span>
                      <span>Unterkunft {formatCurrency(snapshot.accommodation || 0)}</span>
                      <span>Anreise {formatCurrency(snapshot.travel || 0)}</span>
                      <span>Sonstiges {formatCurrency(otherCosts)}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">Budget-Fit {formatPercent(budgetFit)}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-white">{row.resort && typeof row.resort.matchPct === "number" ? row.resort.matchPct : 52}% Alpivo</div>
                    <div className="mt-2 grid gap-1 text-xs text-slate-400">
                      <span>{row.resort && row.resort.pisteKm ? `${row.resort.pisteKm} km Pisten` : "Pisten-km offen"}</span>
          <span>{row.resort && row.resort.elevationMaxM ? `bis ${row.resort.elevationMaxM} m` : "Höhenlage offen"}</span>
                      <span>{snowScore !== null ? `Schneesicherheit ${formatPercent(snowScore)}` : "Schneesicherheit offen"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-white">{formatPercent(groupFit)} Gruppen-Fit</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {row.availability.availableCount} verfügbar · {row.availability.maybeCount} vielleicht · {row.availability.unavailableCount} nicht
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{row.availability.fitLabel}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
