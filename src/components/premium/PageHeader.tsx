import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ eyebrow, title, subtitle, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between ${className}`}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-extrabold uppercase tracking-[0.26em] text-sky-200/80">{eyebrow}</p> : null}
        <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.02em] text-white md:text-6xl">{title}</h1>
        {subtitle ? <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
