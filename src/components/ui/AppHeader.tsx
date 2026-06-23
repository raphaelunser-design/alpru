import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { brand } from "@/config/brand";

export type AppHeaderNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

type AppHeaderProps = {
  actions?: ReactNode;
  className?: string;
  ctaHref?: string;
  ctaLabel?: string;
  navItems?: AppHeaderNavItem[];
};

const defaultNavItems: AppHeaderNavItem[] = [
  { href: "/resorts", label: "Resorts" },
  { href: "/map", label: "3D Karte" },
  { href: "/#so-funktionierts", label: "So funktioniert's" },
];

export default function AppHeader({
  actions,
  className = "",
  ctaHref = "/quiz",
  ctaLabel = "Match starten",
  navItems = defaultNavItems,
}: AppHeaderProps) {
  return (
    <header className={`sticky top-0 z-50 border-b border-[var(--alpivo-border-subtle)] bg-white/92 backdrop-blur-xl ${className}`}>
      <div className="mx-auto flex min-h-20 w-full max-w-[1480px] items-center gap-4 px-[var(--alpivo-space-page-x)]">
        <Link
          href="/"
          aria-label="Alpivo Startseite"
          className="relative block h-11 w-[150px] shrink-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(47,107,255,0.5)] sm:w-[174px]"
        >
          <Image src={brand.logoPath} alt="Alpivo" fill sizes="174px" className="object-contain object-left" priority={false} />
        </Link>
        <nav className="ml-auto hidden items-center gap-2 text-sm font-medium text-[var(--alpivo-deep-navy)] md:flex" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`rounded-[var(--alpivo-radius-md)] px-4 py-2 transition hover:bg-[rgba(7,27,58,0.06)] ${
                item.active ? "bg-[rgba(47,107,255,0.08)] text-[var(--alpivo-alpine-blue)]" : ""
              }`}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-3">
          {actions}
          <Button href={ctaHref} size="md" variant="primary">
            {ctaLabel}
          </Button>
        </div>
      </div>
      <nav
        className="flex gap-1 overflow-x-auto border-t border-[rgba(7,27,58,0.08)] px-[var(--alpivo-space-page-x)] py-2 text-sm font-medium text-[var(--alpivo-deep-navy)] [scrollbar-width:none] md:hidden"
        aria-label="Mobile Hauptnavigation"
      >
        {navItems.map((item) => (
          <Link
            key={`mobile-${item.href}-${item.label}`}
            href={item.href}
            className={`shrink-0 rounded-[var(--alpivo-radius-md)] px-3 py-2 transition hover:bg-[rgba(7,27,58,0.06)] ${
              item.active ? "bg-[rgba(47,107,255,0.08)] text-[var(--alpivo-alpine-blue)]" : ""
            }`}
            aria-current={item.active ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
