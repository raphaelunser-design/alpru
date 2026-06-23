"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import GlobalSearch from "@/components/GlobalSearch";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import { hidesGlobalHeader } from "@/config/appChrome";

const AdminNavLink = dynamic(() => import("@/components/AdminNavLink"), { ssr: false });

const appLinks = [
  { href: "/quiz", label: "Match", primary: true },
  { href: "/resorts", label: "Resorts", badge: "Beta" },
  { href: "/trips", label: "Trips", badge: "Beta" },
  { href: "/map", label: "Karte", badge: "Beta" },
  { href: "/account", label: "Konto" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  if (hidesGlobalHeader(pathname)) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/35 bg-white/94 text-slate-700 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
        <Logo />

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
      </div>
    </header>
  );
}
