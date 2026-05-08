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
    text: "Wetter, Pisten, Events, Unterkunft – alles an einem Ort bisher Fehlanzeige.",
    icon: "eye",
  },
] as const;

const factors = [
  ["Budget", "budget"],
  ["Anreise", "car"],
  ["Wetter & Schnee", "snow"],
  ["Pisten", "mountain"],
  ["Unterkunft", "bed"],
  ["Après-Ski", "drink"],
  ["Events", "calendar"],
  ["Vibe", "spark"],
  ["Gruppenbedürfnisse", "group"],
] as const;

function Icon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    mountain: <path {...common} d="m3 19 7-13 3.2 5.8L16 8l5 11H3Z" />,
    tag: <path {...common} d="M20 13 12 21l-9-9V4h8l9 9ZM7 8h.01" />,
    eye: <path {...common} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
    budget: <path {...common} d="M12 4v16M8 7h6.5a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h7" />,
    car: <path {...common} d="M5 16h14M7 16l1.4-5h7.2L17 16M7 19h.01M17 19h.01M4 16v3h16v-3" />,
    snow: <path {...common} d="M12 3v18M5 7l14 10M19 7 5 17" />,
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
    <section id="alpivo-story" className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white text-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.01em] text-slate-950 md:text-4xl">
              Zu viele Optionen. Zu wenig Klarheit.
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-slate-600">
              Alpivo bringt Struktur in die Ski-Trip-Planung.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {problemCards.map((card, index) => (
            <Reveal key={card.title} delay={index * 0.05}>
              <article className="h-full rounded-[1.35rem] border border-slate-200 bg-white p-6 text-center shadow-[0_22px_70px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_28px_80px_rgba(14,165,233,0.12)]">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-sky-700">
                  <Icon name={card.icon} />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-slate-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-extrabold tracking-[-0.01em] text-slate-950 md:text-4xl">
              Ein Match. Alle Faktoren.
            </h2>
            <p className="mt-3 text-base font-medium text-slate-600">Alpivo kombiniert, was für euch zählt.</p>
          </div>
        </Reveal>

        <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
          {factors.map(([label, icon], index) => (
            <Reveal key={label} delay={index * 0.025}>
              <div className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-center text-slate-800 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:bg-white">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-sky-700 shadow-sm">
                  <Icon name={icon} />
                </span>
                <span className="text-xs font-extrabold leading-tight">{label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
