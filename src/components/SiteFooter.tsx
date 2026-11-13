"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { hidesGlobalFooter } from "@/config/appChrome";

export default function SiteFooter() {
  const pathname = usePathname();

  if (hidesGlobalFooter(pathname)) return null;

  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 text-xs text-slate-300 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            aria-label="Alpivo Startseite"
            className="self-start shrink-0 rounded-sm transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 sm:self-auto"
          >
            <Image
              src="/brand/alpivo-logo-v2-transparent.png"
              alt=""
              width={132}
              height={48}
              className="h-auto brightness-0 invert"
            />
          </Link>
          <span>{brand.name} befindet sich in der Beta. Einige Kosten- und Resortdaten sind geschätzt und als Orientierung gedacht.</span>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Rechtliches">
          <Link className="hover:text-white" href="/impressum">Impressum</Link>
          <Link className="hover:text-white" href="/datenschutz">Datenschutz</Link>
          <Link className="hover:text-white" href="/datenhinweis">Datenhinweis</Link>
          <Link className="hover:text-white" href="/feedback">Kontakt/Feedback</Link>
          <Link className="hover:text-white" href="/quiz">Match starten</Link>
        </nav>
      </div>
    </footer>
  );
}
