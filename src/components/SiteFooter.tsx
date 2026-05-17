"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlpivoLogo } from "@/components/premium/BrandLogo";
import { brand } from "@/config/brand";

const appShellRoutes = ["/results", "/resorts", "/resort", "/trips", "/checklist", "/account", "/feedback", "/quiz", "/map", "/admin"];

export default function SiteFooter() {
  const pathname = usePathname();
  const usesAppShell = appShellRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (usesAppShell) return null;

  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 text-xs text-slate-300 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
          <AlpivoLogo className="text-white" />
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
