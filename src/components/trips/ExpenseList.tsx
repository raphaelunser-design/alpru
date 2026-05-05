import { budgetCategoryLabels, formatCurrency, getTripMemberName, type SkiTripBundle } from "@/lib/tripPlanner";

type ExpenseListProps = {
  bundle: SkiTripBundle;
};

export default function ExpenseList({ bundle }: ExpenseListProps) {
  return (
    <div className="grid gap-3">
      {bundle.expenses.map((expense) => {
        const payer = bundle.members.find((member) => member.id === expense.paidByMemberId) ?? null;
        const splits = bundle.expenseSplits.filter((split) => split.expenseId === expense.id);
        return (
          <div key={expense.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{expense.description}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {budgetCategoryLabels[expense.category]}
                  {expense.incurredOn ? ` · bezahlt am ${expense.incurredOn}` : ""}
                  {expense.dueDate ? ` · fällig bis ${expense.dueDate}` : ""}
                  {payer ? ` · gezahlt von ${getTripMemberName(payer)}` : ""}
                </div>
                {expense.note ? <div className="mt-2 text-sm text-slate-300">{expense.note}</div> : null}
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-white">{formatCurrency(expense.amount)}</div>
                <div
                  className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] ${
                    expense.isSettled
                      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      : "border-amber-300/35 bg-amber-300/10 text-amber-100"
                  }`}
                >
                  {expense.isSettled ? "ausgeglichen" : "offen"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {splits.map((split) => {
                const member = bundle.members.find((entry) => entry.id === split.memberId) ?? null;
                return (
                  <span key={split.id} className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs text-slate-200">
                    {member ? getTripMemberName(member) : "Mitglied"} · {formatCurrency(split.amount)}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
