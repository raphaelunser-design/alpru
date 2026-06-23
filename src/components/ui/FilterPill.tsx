import type { ButtonHTMLAttributes, ReactNode } from "react";

type FilterPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  removable?: boolean;
};

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function FilterPill({
  active = false,
  children,
  className = "",
  icon,
  removable = false,
  type = "button",
  ...props
}: FilterPillProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-[var(--alpivo-radius-md)] border px-4 text-sm font-medium transition",
        "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(47,107,255,0.5)]",
        active
          ? "border-[var(--alpivo-alpine-blue)] bg-[rgba(47,107,255,0.08)] text-[var(--alpivo-deep-navy)]"
          : "border-[var(--alpivo-border-subtle)] bg-white text-[var(--alpivo-deep-navy)] hover:border-[var(--alpivo-border-strong)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={props.onClick ? active : undefined}
      {...props}
    >
      {icon ? <span className="grid shrink-0 place-items-center text-[var(--alpivo-alpine-blue)]" aria-hidden="true">{icon}</span> : null}
      <span className="min-w-0 truncate">{children}</span>
      {removable ? <CloseIcon /> : null}
    </button>
  );
}
