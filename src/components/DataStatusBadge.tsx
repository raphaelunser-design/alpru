import type { ReactNode } from "react";

export type DataStatus = "verified" | "curated" | "estimated" | "demo" | "beta" | "unknown" | "stale";

const statusConfig: Record<DataStatus, { label: string; className: string }> = {
  verified: {
    label: "Verifiziert",
    className: "border-emerald-200/35 bg-emerald-200/12 text-emerald-50",
  },
  curated: {
    label: "Kuratierter Wert",
    className: "border-sky-200/35 bg-sky-200/12 text-sky-50",
  },
  estimated: {
    label: "Schätzung",
    className: "border-amber-200/35 bg-amber-200/12 text-amber-50",
  },
  demo: {
    label: "Demo-Schätzung",
    className: "border-violet-200/35 bg-violet-200/12 text-violet-50",
  },
  beta: {
    label: "Beta-Daten",
    className: "border-cyan-200/35 bg-cyan-200/12 text-cyan-50",
  },
  unknown: {
    label: "Datenstand unbekannt",
    className: "border-slate-200/25 bg-white/[0.08] text-slate-100",
  },
  stale: {
    label: "Bitte prüfen",
    className: "border-rose-200/35 bg-rose-200/10 text-rose-50",
  },
};

type DataStatusBadgeProps = {
  status: DataStatus;
  label?: string;
  compact?: boolean;
  className?: string;
};

export default function DataStatusBadge({ status, label, compact = false, className = "" }: DataStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full border font-semibold leading-none",
        compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
        config.className,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label ?? config.label}
    </span>
  );
}

export function dataStatusLabel(status: DataStatus) {
  return statusConfig[status].label;
}

export function DataFreshnessNote({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3 text-xs leading-relaxed text-slate-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children ?? "Preise, Schneelage und Verfügbarkeiten bitte vor Buchung bei offiziellen Quellen prüfen."}
    </div>
  );
}
