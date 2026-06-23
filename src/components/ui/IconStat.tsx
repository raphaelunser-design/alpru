import type { ReactNode } from "react";

type IconStatProps = {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
  tone?: "default" | "blue";
};

export default function IconStat({ icon, label, value, className = "", tone = "default" }: IconStatProps) {
  return (
    <div
      className={[
        "flex min-h-20 items-center gap-4 rounded-[var(--alpivo-radius-lg)] border px-4 py-3",
        tone === "blue"
          ? "border-[rgba(47,107,255,0.18)] bg-[rgba(47,107,255,0.06)]"
          : "border-[var(--alpivo-border-subtle)] bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--alpivo-radius-md)] bg-[rgba(47,107,255,0.08)] text-[var(--alpivo-alpine-blue)]" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-[var(--alpivo-ink-muted)]">{label}</span>
        <span className="mt-1 block truncate text-base font-semibold text-[var(--alpivo-deep-navy)]">{value}</span>
      </span>
    </div>
  );
}
