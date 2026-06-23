import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type SharedButtonProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type NativeButtonProps = SharedButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkButtonProps = SharedButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ButtonProps = NativeButtonProps | LinkButtonProps;

const variantClassName: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-[var(--alpivo-deep-navy)] text-white shadow-[var(--alpivo-shadow-sm)] hover:bg-[#0B244A]",
  secondary:
    "border-[var(--alpivo-border-subtle)] bg-white text-[var(--alpivo-deep-navy)] shadow-[var(--alpivo-shadow-sm)] hover:border-[var(--alpivo-border-strong)] hover:bg-[var(--alpivo-snow-white)]",
  ghost: "border-transparent bg-transparent text-[var(--alpivo-deep-navy)] hover:bg-[rgba(7,27,58,0.06)]",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "min-h-10 gap-2 rounded-[var(--alpivo-radius-md)] px-3 text-sm",
  md: "min-h-12 gap-2.5 rounded-[var(--alpivo-radius-md)] px-5 text-sm",
  lg: "min-h-14 gap-3 rounded-[var(--alpivo-radius-lg)] px-6 text-base",
};

export default function Button({
  children,
  className = "",
  icon,
  iconAfter,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = [
    "inline-flex shrink-0 items-center justify-center border font-semibold transition duration-150",
    "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(47,107,255,0.5)]",
    "disabled:pointer-events-none disabled:opacity-55",
    sizeClassName[size],
    variantClassName[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon ? <span className="grid shrink-0 place-items-center" aria-hidden="true">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
      {iconAfter ? <span className="grid shrink-0 place-items-center" aria-hidden="true">{iconAfter}</span> : null}
    </>
  );

  if ("href" in props && props.href) {
    const { href, ...anchorProps } = props;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
