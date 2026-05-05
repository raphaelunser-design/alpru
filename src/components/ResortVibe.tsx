import type { ResortDecision, ResortVibeTag } from "@/lib/resortSignals";

type ResortVibeProps = {
  decision: Pick<ResortDecision, "vibeTags" | "apresScore" | "crowdScore" | "snowReliability" | "valueScore" | "bestFor">;
};

const meters = [
  { key: "apres", label: "Après-Ski", get: (d: ResortVibeProps["decision"]) => d.apresScore ?? 0.5 },
  { key: "quiet", label: "Ruhe", get: (d: ResortVibeProps["decision"]) => (d.crowdScore == null ? 0.5 : 1 - d.crowdScore) },
  { key: "snow", label: "Schnee", get: (d: ResortVibeProps["decision"]) => d.snowReliability },
  { key: "value", label: "Value", get: (d: ResortVibeProps["decision"]) => d.valueScore },
];

function tagClass(tag: ResortVibeTag) {
  if (tag.tone === "amber") return "border-amber-200/25 bg-amber-200/10 text-amber-50";
  if (tag.tone === "green") return "border-emerald-200/25 bg-emerald-200/10 text-emerald-50";
  if (tag.tone === "ice") return "border-sky-200/25 bg-sky-200/10 text-sky-50";
  return "border-white/10 bg-white/[0.08] text-slate-100";
}

export default function ResortVibe({ decision }: ResortVibeProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/50 p-6 shadow-[0_18px_48px_rgba(2,6,23,0.28)]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Resort Vibe</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Stimmungsbild aus strukturierten Signalen</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Diese Ebene ist vorbereitet für offizielle Review-Integrationen. Aktuell werden nur erlaubte, strukturierte
            Resort-Signale zu Vibe-Tags verdichtet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {decision.bestFor.map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {decision.vibeTags.map((tag) => (
          <span key={tag.label} className={`rounded-full border px-3 py-1.5 text-xs ${tagClass(tag)}`}>
            {tag.label}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {meters.map((meter) => {
          const value = Math.max(0, Math.min(1, meter.get(decision)));
          return (
            <div key={meter.key} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
                <span>{meter.label}</span>
                <span>{Math.round(value * 100)}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-sky-200" style={{ width: `${Math.round(value * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
