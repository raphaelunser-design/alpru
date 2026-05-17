"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClientLocale } from "@/lib/clientLocale";
import { getLocaleText, type LocaleTextKey } from "@/components/LocaleText";

const items = [
  { href: "/quiz", labelKey: "mobileMatch" },
  { href: "/resorts", labelKey: "resorts", badge: "Beta" },
  { href: "/trips", labelKey: "mobileTrips", badge: "Bald" },
  { href: "/map", labelKey: "map", badge: "Beta" },
  { href: "/account", labelKey: "account" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useClientLocale();
  const usesImmersiveShell = pathname === "/map/3d" || pathname === "/karte/3d";
  const usesPremiumShell = ["/results", "/resorts", "/resort", "/trips", "/checklist", "/account", "/feedback", "/quiz", "/map", "/admin"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (pathname === "/" || usesImmersiveShell || usesPremiumShell) return null;

  return (
    <nav
      className="fixed bottom-3 left-3 z-40 grid w-[366px] max-w-[calc(100vw-1.5rem)] grid-cols-[repeat(5,minmax(0,1fr))] overflow-hidden rounded-2xl border border-white/15 bg-slate-950/88 p-1.5 shadow-[0_18px_60px_rgba(2,6,23,0.5)] backdrop-blur-xl md:hidden"
      aria-label="Mobile Hauptnavigation"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const label = getLocaleText(locale, item.labelKey as LocaleTextKey);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex min-h-12 items-center justify-center overflow-hidden rounded-xl px-1 text-[11px] font-semibold transition ${
              active ? "bg-sky-200 text-slate-950" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {label}
            {"badge" in item && item.badge ? (
              <span className={`absolute right-1 top-1 rounded-full px-1 text-[8px] font-bold ${active ? "bg-slate-950/12 text-slate-800" : "bg-sky-200/15 text-sky-100"}`}>
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
