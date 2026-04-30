import { computeSettlementSuggestions, formatCurrency, getTripMemberName, type SkiTripBundle } from "@/lib/tripPlanner";

type SettlementCardProps = {
  bundle: SkiTripBundle;
};

export default function SettlementCard({ bundle }: SettlementCardProps) {
  const suggestions = computeSettlementSuggestions(bundle);

  return (
    <div className="grid gap-3">
      {suggestions.length > 0 (
        suggestions.map((suggestion) => (
          <div key={`${suggestion.fromMemberId}-${suggestion.toMemberId}`} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-sm text-slate-300">
              <span className="font-semibold text-white">{suggestion.fromName}</span> zahlt{" "}
              <span className="font-semibold text-white">{suggestion.toName}</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(suggestion.amount)}</div>
            <div className="mt-1 text-xs text-slate-500">empfohlener Ausgleich aus den aktuellen Splits</div>
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300">
          Keine offenen Salden. Die aktuellen Splits wirken ausgeglichen.
        </div>
      )}

      {bundle.settlements.length > 0 (
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Hinterlegte Settlements</div>
          <div className="mt-3 grid gap-3">
            {bundle.settlements.map((settlement) => {
              const from = bundle.members.find((member) => member.id === settlement.fromMemberId) null;
              const to = bundle.members.find((member) => member.id === settlement.toMemberId) null;
              return (
                <div key={settlement.id} className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
                  <div className="text-sm text-slate-100">
                    {getTripMemberName(from)} → {getTripMemberName(to)}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">{formatCurrency(settlement.amount)}</div>
                  <div className="mt-1 text-xs text-slate-500">{settlement.status === "paid" "bezahlt" : "offen"}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

