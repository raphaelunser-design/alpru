import { availabilityOptions, formatDateRange, getBestDateSummaries, type SkiTripBundle } from "@/lib/tripPlanner";

type BestDatesPanelProps = {
  bundle: SkiTripBundle;
};

function ratioWidth(available: number, maybe: number, total: number) {
  if (!total) return 0;
  return Math.max(4, Math.min(100, Math.round(((available + maybe * 0.5) / total) * 100)));
}

export default function BestDatesPanel({ bundle }: BestDatesPanelProps) {
  const summaries = getBestDateSummaries(bundle).slice(0, 4);
  const totalMembers = Math.max(bundle.members.filter((member) => member.status === "joined").length, 1);

  return (
    <div className="grid gap-3">
      {summaries.map((summary, index) => (
        <div key={summary.dateOption.id} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                #{index + 1} · {summary.fitLabel}
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                {summary.dateOption.label} · {formatDateRange(summary.dateOption.startDate, summary.dateOption.endDate)}
              </div>
              {summary.dateOption.note <div className="mt-1 text-sm text-slate-300">{summary.dateOption.note}</div> : null}
            </div>
            <div className="rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 text-xs text-white/85">
              Score {summary.score.toFixed(2)}
            </div>
          </div>

          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-300 via-emerald-300 to-emerald-200"
              style={{ width: `${ratioWidth(summary.availableCount, summary.maybeCount, totalMembers)}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {availabilityOptions.map((option) => {
              const value =
                option.value === "available"
                  summary.availableCount
                  : option.value === "maybe"
                    summary.maybeCount
                    : summary.unavailableCount;
              return (
                <span key={option.value} className={`rounded-full border px-3 py-1 ${option.chipClass}`}>
                  {value}x {option.label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

