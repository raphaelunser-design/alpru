import type { ComponentPropsWithoutRef, ReactNode } from "react";

type SectionContainerProps = ComponentPropsWithoutRef<"section"> & {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  contentClassName?: string;
};

export default function SectionContainer({
  children,
  className = "",
  contentClassName = "",
  eyebrow,
  title,
  subtitle,
  actions,
  ...props
}: SectionContainerProps) {
  return (
    <section className={`px-[var(--alpivo-space-page-x)] py-[var(--alpivo-space-section-y)] ${className}`} {...props}>
      <div className={`mx-auto w-full max-w-[1480px] ${contentClassName}`}>
        {title || subtitle || eyebrow || actions ? (
          <div className="mb-8 flex flex-col gap-5 md:mb-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--alpivo-alpine-blue)]">{eyebrow}</p>
              ) : null}
              {title ? (
                <h2 className="alpivo-ui-heading mt-3 text-3xl leading-[1.05] md:text-5xl">{title}</h2>
              ) : null}
              {subtitle ? (
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--alpivo-ink-muted)] md:text-lg">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
