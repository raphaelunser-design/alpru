"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

type HeroTheme = {
  id: string;
  label: string;
  title: string;
  text: string;
  traits: string[];
  image: string;
  accent: string;
  glow: string;
  icon: "tag" | "glass" | "family" | "calendar" | "snow" | "skier" | "mountain" | "leaf";
};

type InteractiveHomeHeroProps = {
  badge: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  fallbackImage: string;
};

const themes: HeroTheme[] = [
  {
    id: "budget",
    label: "Günstig",
    title: "Smart Budget",
    text: "Gebiete mit gutem Verhältnis aus Skipass, Anreise, Pistenkilometern und Nebenkosten.",
    traits: ["Value", "kurze Trips", "Kostenblick"],
    image: "/bg/skilandschaft.png",
    accent: "border-emerald-200/45 bg-emerald-200/18 text-emerald-50",
    glow: "rgba(110,231,183,0.36)",
    icon: "tag",
  },
  {
    id: "apres",
    label: "Après-Ski",
    title: "Après-Ski",
    text: "Lebendige Orte mit Bars, Hütten und Stimmung nach dem Skitag. Ideal für Gruppen und Wochenendtrips.",
    traits: ["Bars", "Gruppen", "Abends Stimmung"],
    image: "/bg/banner-bild-4k.png",
    accent: "border-amber-200/45 bg-amber-200/18 text-amber-50",
    glow: "rgba(251,191,36,0.42)",
    icon: "glass",
  },
  {
    id: "family",
    label: "Familie",
    title: "Family Calm",
    text: "Ruhigere Resorts mit leichteren Pisten, planbarer Infrastruktur und weniger Stress im Tagesablauf.",
    traits: ["Einfach", "Planbar", "Ruhiger"],
    image: "/images/ski.jpg",
    accent: "border-sky-200/45 bg-sky-200/18 text-sky-50",
    glow: "rgba(125,211,252,0.38)",
    icon: "family",
  },
  {
    id: "weekend",
    label: "Wochenende",
    title: "Weekend Fit",
    text: "Gebiete, die sich für kurze Zeiträume lohnen: gute Erreichbarkeit, klare Kosten und genug Piste.",
    traits: ["2-3 Tage", "Anreise", "kompakt"],
    image: "/bg/site-hero.jpg",
    accent: "border-indigo-200/45 bg-indigo-200/18 text-indigo-50",
    glow: "rgba(165,180,252,0.34)",
    icon: "calendar",
  },
  {
    id: "snow",
    label: "Schneesicher",
    title: "Schnee zuerst",
    text: "Höhenlage, Gletscher-Nähe und Schneesicherheit bekommen mehr Gewicht als reine Größe.",
    traits: ["Höhe", "Saison", "Sicherheit"],
    image: "/bg/skilandschaft.png",
    accent: "border-cyan-200/45 bg-cyan-200/18 text-cyan-50",
    glow: "rgba(103,232,249,0.36)",
    icon: "snow",
  },
  {
    id: "beginner",
    label: "Anfänger",
    title: "Easy Runs",
    text: "Mehr Gewicht für einfache Pisten, Übersichtlichkeit, Skischulen und entspannte Infrastruktur.",
    traits: ["Blaue Pisten", "Skischule", "ruhig"],
    image: "/images/ski.jpg",
    accent: "border-lime-200/45 bg-lime-200/18 text-lime-50",
    glow: "rgba(190,242,100,0.3)",
    icon: "skier",
  },
  {
    id: "glacier",
    label: "Gletscher",
    title: "Gletscher-Option",
    text: "Für hohe Lagen, lange Saisonfenster und Resorts, bei denen Sommer-Ski realistischer ist.",
    traits: ["Hochlage", "Sommer", "Schnee"],
    image: "/bg/site.jpg",
    accent: "border-white/40 bg-white/16 text-white",
    glow: "rgba(226,232,240,0.34)",
    icon: "mountain",
  },
  {
    id: "quiet",
    label: "Ruhig",
    title: "Quiet Escape",
    text: "Mehr Fokus auf Panorama, weniger Trubel und Orte, die sich nicht wie Massenabfertigung anfühlen.",
    traits: ["Panorama", "Ruhe", "Charme"],
    image: "/bg/skilandschaft.png",
    accent: "border-teal-200/45 bg-teal-200/18 text-teal-50",
    glow: "rgba(94,234,212,0.32)",
    icon: "leaf",
  },
];

function ThemeIcon({ icon }: { icon: HeroTheme["icon"] }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (icon === "glass") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path {...common} d="m7 3 5 7 5-7H7Zm5 7v9m-4 2h8M8.5 14.5 5 18m10.5-3.5L19 18" />
      </svg>
    );
  }
  if (icon === "family") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path {...common} d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 20a5.5 5.5 0 0 1 11 0m1-6a4.5 4.5 0 0 1 5 4" />
      </svg>
    );
  }
  if (icon === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path {...common} d="M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm4 8h2m3 0h2m-7 4h2m3 0h2" />
      </svg>
    );
  }
  if (icon === "snow") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path {...common} d="M12 3v18m7.8-13.5L4.2 16.5m0-9 15.6 9M8 5.5 12 8l4-2.5M8 18.5l4-2.5 4 2.5" />
      </svg>
    );
  }
  if (icon === "skier") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path {...common} d="M13 4.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm-2 5 3.5 2.5-2 3 3.5 3M8 13l3-3.5M4 20c5.5 1.2 10.8 1.2 16 0" />
      </svg>
    );
  }
  if (icon === "mountain") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path {...common} d="m3 19 7-13 3.5 6L16 8l5 11H3Zm7-13 1.8 6.2L14 12" />
      </svg>
    );
  }
  if (icon === "leaf") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path {...common} d="M20 4C11 4 5 9.5 5 17.5c0 1.3.4 2.4 1.1 3.2C7.4 14 12 9.5 20 4ZM6 20c5.5.5 10-2.7 12-9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path {...common} d="m20 12-8 8-8-8V4h8l8 8Zm-12-4h.01" />
    </svg>
  );
}

export default function InteractiveHomeHero({
  badge,
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  fallbackImage,
}: InteractiveHomeHeroProps) {
  const [activeThemeId, setActiveThemeId] = useState("apres");
  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === activeThemeId) themes[0],
    [activeThemeId]
  );

  return (
    <section className="hero-shell relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-[82vh] w-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <Image src={fallbackImage} alt="" fill className="object-cover" priority sizes="100vw" style={{ objectPosition: "center 42%" }} />
        {themes.map((theme) => (
          <Image
            key={theme.id}
            src={theme.image}
            alt=""
            fill
            className={`object-cover transition duration-700 ${
              activeTheme.id === theme.id "scale-[1.045] opacity-100" : "scale-[1.02] opacity-0"
            }`}
            priority={theme.id === "apres"}
            sizes="100vw"
            style={{ objectPosition: theme.id === "apres" "center 42%" : "center" }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/42 to-slate-950/86" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/78 via-slate-950/36 to-slate-950/18" />
        <div
          className="absolute inset-y-0 right-0 w-[58vw] blur-3xl transition duration-500"
          style={{ background: `radial-gradient(circle at 65% 45%, ${activeTheme.glow}, transparent 54%)` }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[82vh] w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-16 md:px-6">
        <div className="grid items-end gap-8 lg:grid-cols-[0.95fr_0.85fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/85 backdrop-blur">
              {badge}
            </div>

            <h1 className="mt-6 max-w-[13ch] break-words text-4xl font-semibold leading-tight text-white sm:max-w-3xl md:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-[38rem] text-base leading-relaxed text-white/82 md:text-lg">{subtitle}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="button-lift inline-flex items-center gap-2 rounded-lg bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
              >
                <ThemeIcon icon="snow" />
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="button-lift rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-lg border border-white/22 bg-white/[0.11] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.42)] backdrop-blur-2xl">
              <div className="flex items-start gap-4">
                <div
                  className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border shadow-[0_0_34px_var(--theme-glow)] ${activeTheme.accent}`}
                  style={{ "--theme-glow": activeTheme.glow } as CSSProperties}
                >
                  <ThemeIcon icon={activeTheme.icon} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{activeTheme.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/82">{activeTheme.text}</p>
                </div>
              </div>
              <div className="mt-6 border-t border-white/16 pt-5">
                <div className="flex flex-wrap gap-3">
                  {activeTheme.traits.map((trait) => (
                    <span key={trait} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-slate-950/28 px-3 py-1.5 text-sm text-white/86">
                      <ThemeIcon icon={activeTheme.icon} />
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="nav-scroll mt-10 flex gap-2 overflow-x-auto pb-2">
          {themes.map((theme) => {
            const active = activeTheme.id === theme.id;
            return (
              <Link
                key={theme.id}
                href="/quiz"
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold backdrop-blur transition duration-200 ${
                  active
                    `${theme.accent} shadow-[0_0_28px_var(--theme-glow)]`
                    : "border-white/18 bg-slate-950/34 text-white/86 hover:border-white/34 hover:bg-white/12"
                }`}
                style={{ "--theme-glow": theme.glow } as CSSProperties}
                onMouseEnter={() => setActiveThemeId(theme.id)}
                onFocus={() => setActiveThemeId(theme.id)}
              >
                <ThemeIcon icon={theme.icon} />
                {theme.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
