"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import BrandLogo from "@/components/premium/BrandLogo";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

const navItems = [
  { href: "/", label: "Startseite", icon: "home" },
  { href: "/quiz", label: "Match starten", icon: "target" },
  { href: "/results", label: "Ergebnisse", icon: "chart" },
  { href: "/resorts", label: "Resorts", icon: "mountain" },
  { href: "/map", label: "Karte", icon: "map", badge: "Beta" },
  { href: "/trips", label: "Trips", icon: "briefcase", badge: "Beta" },
  { href: "/checklist", label: "Checkliste", icon: "check" },
  { href: "/account", label: "Konto", icon: "user" },
  { href: "/feedback", label: "Feedback", icon: "message" },
];

const mobileNavItems = [
  { href: "/", label: "Start", icon: "home" },
  { href: "/quiz", label: "Match", icon: "target" },
  { href: "/results", label: "Ergebnis", icon: "chart" },
  { href: "/trips", label: "Trips", icon: "briefcase" },
  { href: "/account", label: "Konto", icon: "user" },
];

function NavIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icon =
    name === "home" ? (
      <path {...common} d="m4 11 8-7 8 7v9h-5v-6H9v6H4v-9Z" />
    ) : name === "target" ? (
      <path {...common} d="M12 21a9 9 0 1 0-9-9m9 5a5 5 0 1 0-5-5m5 1a1 1 0 1 0-1-1m-8 8 4-4" />
    ) : name === "chart" ? (
      <path {...common} d="M4 19h16M7 16V9m5 7V5m5 11v-4" />
    ) : name === "mountain" ? (
      <path {...common} d="m3 19 7-12 4 6 2-3 5 9H3Zm7-12 2 12" />
    ) : name === "map" ? (
      <path {...common} d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6" />
    ) : name === "briefcase" ? (
      <path {...common} d="M9 7V5h6v2m-10 4h14M5 7h14v12H5V7Z" />
    ) : name === "check" ? (
      <path {...common} d="M9 11h6M9 15h4M8 4h8l2 2v14H6V6l2-2Zm1 4 1.5 1.5L14 6" />
    ) : name === "user" ? (
      <path {...common} d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
    ) : (
      <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
    );

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      {icon}
    </svg>
  );
}

export default function AppShell({ children, className = "" }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className={`min-h-screen bg-[#020817] text-white md:grid md:grid-cols-[236px_minmax(0,1fr)] ${className}`}>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(2,8,23,0.98),rgba(3,18,34,0.96))] px-5 py-7 shadow-[18px_0_60px_rgba(2,6,23,0.28)] md:flex">
        <BrandLogo className="text-white" />
        <nav className="mt-8 flex flex-1 flex-col gap-1.5" aria-label="Alpivo App Navigation">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition ${
                  active
                    ? "bg-[linear-gradient(135deg,#075fd8,#0ea5e9)] text-white shadow-[0_18px_36px_rgba(14,165,233,0.22)]"
                    : "text-slate-300 hover:bg-white/[0.075] hover:text-white"
                }`}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold ${active ? "bg-white/16 text-white" : "bg-emerald-300/14 text-emerald-100"}`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-4 border-t border-white/10 pt-5">
          <div className="rounded-3xl border border-white/14 bg-white/[0.065] p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-300/16 text-[10px] text-amber-100">Pro</span>
              Alpivo Premium
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">Geplant: mehr Details, bessere Filter und transparentere Vergleichsansichten.</p>
            <Link href="/feedback" className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/14 text-xs font-bold text-white hover:bg-white/10">
              Feedback geben
            </Link>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/54 p-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-200 text-sm font-black text-slate-950">RU</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">Raphael U.</span>
              <span className="block text-xs text-slate-400">Kostenloser Plan</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="min-w-0 overflow-x-hidden pb-24 md:pb-0">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-white/10 bg-slate-950/88 px-4 backdrop-blur-xl md:hidden">
          <BrandLogo className="text-white" />
          <Link href="/quiz" className="hidden rounded-2xl bg-sky-500 px-4 py-2 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(14,165,233,0.28)] sm:inline-flex">
            <span className="hidden sm:inline">Match starten</span>
            <span className="sm:hidden">Match</span>
          </Link>
        </header>
        {children}
        <nav
          className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.35rem] border border-white/12 bg-slate-950/92 p-2 shadow-[0_24px_80px_rgba(2,6,23,0.48)] backdrop-blur-xl md:hidden"
          aria-label="Mobile Alpivo Navigation"
        >
          {mobileNavItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-extrabold transition ${
                  active ? "bg-sky-500 text-white shadow-[0_12px_28px_rgba(14,165,233,0.24)]" : "text-slate-400 hover:bg-white/[0.075] hover:text-white"
                }`}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
