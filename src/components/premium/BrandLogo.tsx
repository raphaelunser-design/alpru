import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

const fullLogoPath = "/brand/alpivo-logo-v2-transparent.png";
const compactLogoPath = "/brand/alpivo-mark-v2-transparent.png";

function shouldInvertForDarkSurface(className: string) {
  return /\btext-(white|slate-50|slate-100|sky-50|cyan-50|zinc-50|neutral-50)\b/.test(className);
}

export function AlpivoLogo({ href = "/", compact = false, className = "" }: BrandLogoProps) {
  const imageClassName = shouldInvertForDarkSurface(className) ? "brightness-0 invert" : "";

  return (
    <Link
      href={href}
      aria-label="Alpivo Startseite"
      className={`inline-flex shrink-0 items-center transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40 ${className}`}
    >
      <Image
        src={compact ? compactLogoPath : fullLogoPath}
        alt="Alpivo"
        width={compact ? 96 : 216}
        height={compact ? 96 : 78}
        className={`${compact ? "h-10 w-10" : "h-10 w-auto sm:h-12"} object-contain ${imageClassName}`}
        priority={false}
      />
    </Link>
  );
}

export default AlpivoLogo;
