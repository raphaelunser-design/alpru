import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export default function BrandLogo({ href = "/", compact = false, className = "" }: BrandLogoProps) {
  const asset = compact ? "/brand/icon.svg" : "/brand/logo.svg";

  return (
    <Link
      href={href}
      aria-label="Alpivo Startseite"
      className={`inline-flex shrink-0 items-center text-current transition hover:opacity-88 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40 ${className}`}
    >
      <span
        aria-hidden="true"
        className={compact ? "block h-10 w-10 bg-current" : "block h-10 w-28 bg-current sm:h-12 sm:w-40"}
        style={{
          WebkitMask: `url(${asset}) center / contain no-repeat`,
          mask: `url(${asset}) center / contain no-repeat`,
        }}
      />
    </Link>
  );
}
