import type { ReactNode } from "react";
import GlassCard from "@/components/GlassCard";

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
    <GlassCard className={`p-6 ${toneClass}`}>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </GlassCard>
  );
}