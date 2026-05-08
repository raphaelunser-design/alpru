import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

type LogoProps = {
  href?: string;
  variant?: "default" | "light";
};

function InlineLogoMark() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M9 47 27 16l10 17 7-11 11 25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m22 37 5-8 7 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ href = "/", variant = "default" }: LogoProps) {
  if (variant === "light") {
    return (
      <Link href={href} className="group inline-flex min-w-fit items-center gap-2 text-white" aria-label={`${brand.name} Startseite`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/16 bg-white/8 text-white shadow-[0_16px_38px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-transform duration-200 group-hover:-translate-y-0.5">
          <InlineLogoMark />
        </span>
        <span className="text-2xl font-extrabold tracking-[-0.02em] text-white drop-shadow-[0_8px_24px_rgba(2,6,23,0.36)]">
          alpivo
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex min-w-fit items-center gap-2" aria-label={`${brand.name} Startseite`}>
      <span className="relative inline-flex h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5 md:h-12 md:w-12">
        <Image src={brand.iconPath} alt="" fill sizes="48px" className="object-contain p-1" />
      </span>
      <span className="relative hidden h-11 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:inline-flex md:h-12 md:w-44 xl:w-48">
        <Image src={brand.logoPath} alt={brand.name} fill sizes="192px" className="object-contain px-2 py-1" priority />
      </span>
      <span className="text-base font-semibold text-slate-950 sm:hidden">{brand.shortName}</span>
    </Link>
  );
}
