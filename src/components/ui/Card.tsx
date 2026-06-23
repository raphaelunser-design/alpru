import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type CardTone = "default" | "soft" | "navy";

type CardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  tone?: CardTone;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const toneClassName: Record<CardTone, string> = {
  default: "border-[var(--alpivo-border-subtle)] bg-white text-[var(--alpivo-deep-navy)]",
  soft: "border-[rgba(217,226,240,0.9)] bg-[var(--alpivo-snow-white)] text-[var(--alpivo-deep-navy)]",
  navy: "border-white/10 bg-[var(--alpivo-deep-navy)] text-white",
};

export default function Card<T extends ElementType = "div">({
  as,
  children,
  className = "",
  interactive = false,
  tone = "default",
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";
  const classes = [
    "rounded-[var(--alpivo-radius-xl)] border shadow-[var(--alpivo-shadow-sm)]",
    "transition duration-150",
    interactive ? "hover:-translate-y-0.5 hover:shadow-[var(--alpivo-shadow-md)]" : "",
    toneClassName[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
