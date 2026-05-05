import { budgetCategoryLabels, formatCurrency, type BudgetSummary as BudgetSummaryType, type SkiTripBudgetItemRecord } from "@/lib/tripPlanner";

type BudgetSummaryProps = {
  summary: BudgetSummaryType;
  items: SkiTripBudgetItemRecord[];
};

export default function BudgetSummary({ summary, items }: BudgetSummaryProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Gesamt</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.total)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Bezahlt</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.paid)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Offen</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.open)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Pro Person</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.perPerson)}</div>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{item.description}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {budgetCategoryLabels[item.category]}
                  {item.dueDate ? ` · fällig ${item.dueDate}` : " · kein Fälligkeitsdatum"}
                </div>
                {item.note ? <div className="mt-2 text-sm text-slate-300">{item.note}</div> : null}
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-white">{formatCurrency(item.amount)}</div>
                <div
                  className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] ${
                    item.isPaid
                      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      : "border-amber-300/35 bg-amber-300/10 text-amber-100"
                  }`}
                >
                  {item.isPaid ? "bezahlt" : "offen"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
