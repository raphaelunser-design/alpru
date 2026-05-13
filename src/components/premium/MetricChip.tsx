import type { ReactNode } from "react";

export type MetricIconName = "cost" | "time" | "snow" | "vibe" | "piste" | "route" | "height" | "shield" | "data" | "lock";

type MetricChipProps = {
  icon?: MetricIconName;
  label: string;
  value: string;
  variant?: "dark" | "light" | "glass";
  className?: string;
};

export function MetricIcon({ name }: { name: MetricIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<MetricIconName, ReactNode> = {
    cost: <path {...common} d="M12 4v16M8 7h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h7" />,
    time: <path {...common} d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    snow: <path {...common} d="M12 3v18M5 7l14 10M19 7 5 17M7 4l1 4-4-1M17 4l-1 4 4-1M7 20l1-4-4 1M17 20l-1-4 4 1" />,
    vibe: <path {...common} d="M4 19h16M7 19V9m5 10V5m5 14v-7M6 9h2m3-4h2m3 7h2" />,
    piste: <path {...common} d="m4 18 7-12 4 7 2-3 3 8H4Zm7-12 1.5 12" />,
    route: <path {...common} d="M6 18c4-7 8 1 12-6M7 7h.01M17 17h.01M7 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />,
    height: <path {...common} d="M4 19h16L12 5 4 19Zm8-14v14" />,
    shield: <path {...common} d="M12 3 5 6v5c0 4.5 2.8 8.4 7 10 4.2-1.6 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-5" />,
    data: <path {...common} d="M4 7c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3Zm0 0v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5" />,
    lock: <path {...common} d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Zm6 4v2" />,
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export default function MetricChip({ icon, label, value, variant = "dark", className = "" }: MetricChipProps) {
  const variantClass =
    variant === "light"
      ? "border-slate-200 bg-white text-slate-950 shadow-sm"
      : variant === "glass"
        ? "border-white/14 bg-white/[0.08] text-white backdrop-blur-xl"
        : "border-white/10 bg-slate-950/52 text-white";

  return (
    <div className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3.5 py-3 ${variantClass} ${className}`}>
      {icon ? <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-400/14 text-sky-200"><MetricIcon name={icon} /></span> : null}
      <span className="min-w-0">
        <span className="block text-base font-extrabold leading-tight">{value}</span>
        <span className="mt-0.5 block text-xs font-semibold text-current/64">{label}</span>
      </span>
    </div>
  );
}
