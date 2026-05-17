import type { ReactNode } from "react";

type TripsStateCardProps = {
  title: string;
  text: string;
  tone?: "default" | "error" | "muted";
  action?: ReactNode;
};

export default function TripsStateCard({ title, text, tone = "default", action }: TripsStateCardProps) {
  const toneClass =
    tone === "error"
      ? "border-rose-300/25 bg-rose-400/10 text-rose-100"
      : tone === "muted"
        ? "border-white/10 bg-white/[0.05] text-slate-300"
        : "border-sky-200/20 bg-sky-200/10 text-slate-100";

  return (
    <section className={`animate-rise rounded-[1.8rem] border p-5 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-xl md:p-6 ${toneClass}`}>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
