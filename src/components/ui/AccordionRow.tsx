import type { ReactNode } from "react";

type AccordionRowProps = {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  open?: boolean;
};

function ChevronIcon() {
  return (
    <svg className="h-5 w-5 transition group-open:rotate-180" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AccordionRow({ children, className = "", icon, open, title }: AccordionRowProps) {
  return (
    <details
      className={`group rounded-[var(--alpivo-radius-md)] border border-[var(--alpivo-border-subtle)] bg-white text-[var(--alpivo-deep-navy)] shadow-[var(--alpivo-shadow-sm)] ${className}`}
      open={open}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-semibold marker:hidden focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(47,107,255,0.5)]">
        {icon ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--alpivo-radius-sm)] bg-[rgba(47,107,255,0.08)] text-[var(--alpivo-alpine-blue)]" aria-hidden="true">{icon}</span> : null}
        <span className="min-w-0 flex-1">{title}</span>
        <ChevronIcon />
      </summary>
      <div className="border-t border-[var(--alpivo-border-subtle)] px-4 py-4 text-sm leading-6 text-[var(--alpivo-ink-muted)]">
        {children}
      </div>
    </details>
  );
}
