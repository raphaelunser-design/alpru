"use client";

import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

const problemCards = [
  {
    title: "Zu viele Skigebiete",
    text: "Hunderte Optionen, unendliche Tabs und am Ende immer noch unsicher?",
    icon: "mountain",
  },
  {
    title: "Preise schwer vergleichbar",
    text: "Versteckte Kosten und unterschiedliche Angebote machen den Vergleich schwer.",
    icon: "tag",
  },
  {
    title: "Zu wenig Überblick",
    text: "Wetter, Pisten, Events, Unterkunft - alles an einem Ort bisher Fehlanzeige.",
    icon: "eye",
  },
] as const;

const factors = [
  {
    label: "Budget",
    icon: "budget",
    text: "Kosten pro Person, Skipass, Unterkunft und Puffer in einem realistischen Fenster.",
    className: "md:col-span-3 lg:col-span-2 lg:row-span-2",
  },
  {
    label: "Wetter & Schnee",
    icon: "snow",
    text: "Schneesicherheit, Höhenlage und Saison-Fit werden sichtbar.",
    className: "md:col-span-3 lg:col-span-2",
  },
  {
    label: "Anreise",
    icon: "car",
    text: "Fahrzeit und Startort fließen direkt in den Match ein.",
    className: "md:col-span-2 lg:col-span-2",
  },
  {
    label: "Vibe",
    icon: "spark",
    text: "Ruhig, lebendig, sportlich oder Premium - die Stimmung zählt mit.",
    className: "md:col-span-2 lg:col-span-2",
  },
  {
    label: "Pisten",
    icon: "mountain",
    text: "Pistenkilometer, Level-Fit und sportlicher Anspruch.",
    className: "md:col-span-2 lg:col-span-1",
  },
  {
    label: "Unterkunft",
    icon: "bed",
    text: "Budgetnähe und Komfort werden nicht getrennt gedacht.",
    className: "md:col-span-2 lg:col-span-1",
  },
  {
    label: "Après-Ski",
    icon: "drink",
    text: "Hütten, Abend-Vibe und Crew-Momente.",
    className: "md:col-span-2 lg:col-span-1",
  },
  {
    label: "Events",
    icon: "calendar",
    text: "Festivals und besondere Wochenenden als klare Signale.",
    className: "md:col-span-2 lg:col-span-1",
  },
  {
    label: "Gruppenbedürfnisse",
    icon: "group",
    text: "Familie, Freunde, Paartrip oder Club werden unterschiedlich gewichtet.",
    className: "md:col-span-2 lg:col-span-2",
  },
] as const;

function Icon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    mountain: <path {...common} d="m3 19 7-13 3.2 5.8L16 8l5 11H3Z" />,
    tag: <path {...common} d="M20 13 12 21l-9-9V4h8l9 9ZM7 8h.01" />,
    eye: <path {...common} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
    budget: <path {...common} d="M12 4v16M8 7h6.5a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h7" />,
    car: <path {...common} d="M5 16h14M7 16l1.4-5h7.2L17 16M7 19h.01M17 19h.01M4 16v3h16v-3" />,
    snow: <path {...common} d="M12 3v18M5 7l14 10M19 7 5 17M7 4l1 4-4-1M17 4l-1 4 4-1M7 20l1-4-4 1M17 20l-1-4 4 1" />,
    bed: <path {...common} d="M4 18V7M20 18v-5a3 3 0 0 0-3-3H9v8M4 13h5M4 18h16" />,
    drink: <path {...common} d="M7 4h10l-1 8a4 4 0 0 1-8 0L7 4Zm5 12v4M9 20h6" />,
    calendar: <path {...common} d="M7 3v4M17 3v4M4 8h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" />,
    spark: <path {...common} d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
    group: <path {...common} d="M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.2a3 3 0 0 0-2.2-2.9M17 5.3a2.7 2.7 0 0 1 0 5.4M4 19v-1.2a3 3 0 0 1 2.2-2.9M7 5.3a2.7 2.7 0 0 0 0 5.4" />,
  };

  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] ?? paths.spark}
    </svg>
  );
}

export default function ValueCards() {
  return (
    <section
      id="alpivo-story"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#07101e] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_82%_34%,rgba(45,212,191,0.10),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <div>
              <h2 className="max-w-[13ch] text-3xl font-extrabold leading-tight tracking-[-0.01em] text-white md:text-5xl">
                Zu viele Optionen. Zu wenig Klarheit.
              </h2>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-300">
                Alpivo bringt Struktur in die Ski-Trip-Planung: weniger Preis-Chaos, weniger Gruppenchat-Raten, mehr nachvollziehbare Entscheidungen.
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.5rem] border border-white/12 bg-white/[0.055] p-4 shadow-[0_30px_90px_rgba(2,6,23,0.28)]">
              <div className="grid gap-3 sm:grid-cols-3">
                {["Skipass €?", "Schnee?", "Anreise?", "Vibe?", "Hotel?", "Pisten?"].map((chip) => (
                  <span key={chip} className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3 text-center text-sm font-bold text-slate-200">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="rounded-2xl border border-sky-200/20 bg-sky-200/10 px-4 py-3 text-sm font-semibold text-sky-50">
                Alpivo verdichtet die Signale zu einem erklärbaren Match-Score.
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {problemCards.map((card, index) => (
            <Reveal key={card.title} delay={index * 0.05}>
              <article className="interactive-card h-full rounded-[1.35rem] border border-white/12 bg-white/[0.065] p-6 shadow-[0_22px_70px_rgba(2,6,23,0.18)]">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-sky-200/20 bg-sky-200/10 text-sky-100">
                  <Icon name={card.icon} />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{card.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-16 max-w-3xl">
            <h2 className="text-3xl font-extrabold tracking-[-0.01em] text-white md:text-5xl">
              Ein Match. Alle Faktoren.
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-slate-300">
              Budget, Anreise, Schnee, Pisten, Unterkunft und Vibe werden gemeinsam bewertet - transparent gewichtet, nicht einfach sortiert.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid auto-rows-[minmax(148px,auto)] gap-4 md:grid-cols-6">
          {factors.map((factor, index) => (
            <Reveal key={factor.label} delay={index * 0.025} className={factor.className}>
              <article className="bento-card group flex h-full flex-col justify-between overflow-hidden rounded-[1.35rem] border border-white/12 bg-white/[0.06] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.18)] transition duration-200 hover:-translate-y-1 hover:border-sky-200/35 hover:bg-white/[0.09]">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-200/20 bg-sky-200/10 text-sky-100 shadow-[0_16px_40px_rgba(14,165,233,0.12)]">
                    <Icon name={factor.icon} />
                  </span>
                  <span className="rounded-full border border-white/10 bg-slate-950/38 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-300">
                    Faktor
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-extrabold text-white">{factor.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{factor.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
