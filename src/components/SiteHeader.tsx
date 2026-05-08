"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminNavLink from "@/components/AdminNavLink";
import GlobalSearch from "@/components/GlobalSearch";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";

const appLinks = [
  { href: "/quiz", label: "Match", primary: true },
  { href: "/resorts", label: "Resorts", badge: "Beta" },
  { href: "/trips", label: "Trips", badge: "Bald" },
  { href: "/map", label: "Karte", badge: "Beta" },
  { href: "/account", label: "Konto" },
];

const homeLinks = [
  { href: "#so-funktionierts", label: "So funktioniert Alpivo" },
  { href: "#alpivo-story", label: "Über uns" },
  { href: "/private-access", label: "Magazin" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950/18 text-white backdrop-blur-xl"
          : "sticky top-0 z-50 border-b border-white/35 bg-white/94 text-slate-700 shadow-sm backdrop-blur-xl"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
        <Logo variant={isHome ? "light" : "default"} />

        {isHome ? (
          <>
            <nav className="ml-auto hidden items-center gap-2 text-sm font-semibold lg:flex" aria-label="Landingpage Navigation">
              {homeLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2 text-white/84 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/quiz"
                className="button-lift ml-2 inline-flex min-h-11 items-center rounded-xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(14,165,233,0.28)] hover:bg-sky-400"
              >
                Match starten
              </Link>
            </nav>
            <Link
              href="/quiz"
              className="button-lift ml-auto inline-flex min-h-10 items-center rounded-xl bg-sky-500 px-4 text-sm font-bold text-white shadow-[0_16px_36px_rgba(14,165,233,0.25)] hover:bg-sky-400 lg:hidden"
            >
              Match starten
            </Link>
          </>
        ) : (
          <>
            <nav className="nav-scroll ml-auto hidden min-w-0 items-center gap-1.5 overflow-x-auto text-sm font-semibold lg:flex">
              {appLinks.map((item) => (
                <Link
                  key={item.href}
                  className={item.primary ? "nav-link border border-sky-200/70 bg-sky-100/80 text-slate-950 shadow-sm hover:bg-sky-200" : "nav-link text-slate-600"}
                  href={item.href}
                >
                  {item.label}
                  {item.badge ? <span className="alpivo-badge ml-1">{item.badge}</span> : null}
                </Link>
              ))}
              <AdminNavLink className="nav-link text-slate-600" />
            </nav>
            <GlobalSearch variant="compact" className="hidden lg:block" />
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
