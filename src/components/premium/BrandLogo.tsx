import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

const fullLogoPath = "/brand/logo-v2.png";
const compactLogoPath = "/brand/icon-v2.png";

export function AlpivoLogo({ href = "/", compact = false, className = "" }: BrandLogoProps) {
  const frameClassName = compact
    ? "relative block h-11 w-11 overflow-hidden rounded-2xl bg-white shadow-[0_12px_34px_rgba(2,6,23,0.24)] ring-1 ring-white/20"
    : "relative block h-12 w-[158px] overflow-hidden rounded-2xl bg-white shadow-[0_12px_34px_rgba(2,6,23,0.2)] ring-1 ring-white/20 sm:w-[184px]";

  return (
    <Link
      href={href}
      aria-label="Alpivo Startseite"
      className={`inline-flex shrink-0 items-center transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40 ${className}`}
    >
      <span className={frameClassName}>
        <Image
          src={compact ? compactLogoPath : fullLogoPath}
          alt="Alpivo"
          fill
          sizes={compact ? "44px" : "184px"}
          className={`${compact ? "scale-[1.55] object-contain" : "object-cover"} object-center`}
          priority={false}
        />
      </span>
    </Link>
  );
}

export default AlpivoLogo;
