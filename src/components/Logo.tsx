import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

export default function Logo({ href = "/" }: { href: string }) {
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
