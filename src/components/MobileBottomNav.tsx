"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClientLocale } from "@/lib/clientLocale";
import { getLocaleText, type LocaleTextKey } from "@/components/LocaleText";

const items = [
  { href: "/", labelKey: "mobileStart" },
  { href: "/quiz", labelKey: "mobileMatch" },
  { href: "/trips", labelKey: "mobileTrips" },
  { href: "/checklist", labelKey: "mobileList" },
  { href: "/account", labelKey: "account" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useClientLocale();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/88 p-1 shadow-[0_18px_60px_rgba(2,6,23,0.5)] backdrop-blur-xl md:hidden"
      aria-label="Mobile Hauptnavigation"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const label = getLocaleText(locale, item.labelKey as LocaleTextKey);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 items-center justify-center rounded-xl px-2 text-xs font-semibold transition ${
              active ? "bg-sky-200 text-slate-950" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
