import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function AlpivoLogo({ href = "/", compact = false, className = "" }: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="Alpivo Startseite"
      className={`inline-flex shrink-0 items-center gap-2 text-current transition hover:opacity-88 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40 ${className}`}
    >
      <span
        aria-hidden="true"
        className={compact ? "block h-10 w-10 bg-current" : "block h-9 w-9 bg-current sm:h-10 sm:w-10"}
        style={{
          WebkitMask: "url(/icon.png) center / contain no-repeat",
          mask: "url(/icon.png) center / contain no-repeat",
        }}
      />
      {!compact ? <span className="text-2xl font-black leading-none tracking-[-0.01em] sm:text-3xl">Alpivo</span> : null}
    </Link>
  );
}

export default AlpivoLogo;
