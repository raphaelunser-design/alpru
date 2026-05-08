"use client";

import Image from "next/image";
import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricIcon({ type }: { type: "cost" | "time" | "snow" | "vibe" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths = {
    cost: <path {...common} d="M12 4v16M8 7h6.5a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h7" />,
    time: <path {...common} d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    snow: <path {...common} d="M12 3v18M5 7l14 10M19 7 5 17M7 4l1 4-4-1M17 4l-1 4 4-1M7 20l1-4-4 1M17 20l-1-4 4 1" />,
    vibe: <path {...common} d="M5 19V9m7 10V5m7 14v-7M3 19h18M4 9h2m5-4h2m5 7h2" />,
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const metrics = [
  { icon: "cost" as const, label: "Kosten", value: "€ 520", hint: "pro Person" },
  { icon: "time" as const, label: "Fahrzeit", value: "3:45 h", hint: "ab München" },
  { icon: "snow" as const, label: "Schneesicher", value: "sehr gut", hint: "Dez. bis April" },
  { icon: "vibe" as const, label: "Vibe & Events", value: "lebendig", hint: "Après, Hütten" },
];

const reasons = [
  "Schneesicher von Dez. bis April",
  "Top Pistenvielfalt für jedes Level",
  "Legendäres Après-Ski & Events",
];

export default function HomeHero() {
  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-[780px] w-screen overflow-hidden bg-slate-950 md:min-h-[820px]">
      <Image
        src="/bg/banner-bild-4k.png"
        alt="Verschneite Alpenlandschaft mit Skifahrer in den Alpen"
        fill
        priority
        sizes="100vw"
        className="hero-media object-cover"
        style={{ objectPosition: "center 42%" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.30)_48%,rgba(2,6,23,0.82)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,12,28,0.86)_0%,rgba(2,12,28,0.48)_47%,rgba(2,12,28,0.12)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/84 to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[780px] w-full max-w-6xl items-center gap-9 px-4 pb-16 pt-28 md:min-h-[820px] md:px-6 md:pt-32 lg:grid-cols-[0.95fr_0.82fr]">
        <div className="hero-content max-w-3xl">
          <h1 className="max-w-[12.5ch] text-4xl font-extrabold leading-[1.02] tracking-[-0.01em] text-white drop-shadow-[0_18px_46px_rgba(2,6,23,0.45)] sm:text-5xl md:text-6xl">
            Findet den Ski-Trip, der wirklich zu euch passt.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/88 md:text-xl md:leading-8">
            Budget, Anreise, Wetter, Après-Ski, Pisten und Unterkunft – in einem Match.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/quiz"
              className="button-lift inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-sky-500 px-7 text-base font-extrabold text-white shadow-[0_24px_60px_rgba(14,165,233,0.34)] hover:bg-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-200/45"
            >
              Match starten
              <ArrowIcon />
            </Link>
            <a
              href="#so-funktionierts"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/28 bg-white/10 px-6 text-base font-bold text-white shadow-[0_18px_44px_rgba(2,6,23,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/16 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              So funktioniert Alpivo
              <DownArrow />
            </a>
          </div>
        </div>

        <article className="animate-rise overflow-hidden rounded-[1.65rem] border border-white/40 bg-white text-slate-950 shadow-[0_32px_100px_rgba(2,8,23,0.45)]">
          <div className="relative h-56 overflow-hidden sm:h-64">
            <Image
              src="/bg/site-hero.jpg"
              alt="Obertauern Resort-Panorama bei Abendlicht"
              fill
              sizes="(min-width: 1024px) 520px, 92vw"
              className="object-cover"
              style={{ objectPosition: "center 48%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/12 via-slate-950/20 to-slate-950/70" />
            <div className="absolute left-5 top-5 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-950 shadow-lg">
              Top Match
            </div>
            <div className="absolute bottom-5 left-5 right-28">
              <h2 className="text-3xl font-extrabold leading-tight text-white drop-shadow-lg">Obertauern</h2>
              <p className="mt-1 text-sm font-semibold text-white/88">Salzburg, Österreich</p>
            </div>
            <div className="absolute bottom-4 right-4">
              <ScoreRing value={94} size="sm" label="Match" />
            </div>
          </div>

          <div className="grid divide-y divide-slate-200 border-b border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex min-h-20 items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
                  <MetricIcon type={metric.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-500">{metric.label}</span>
                  <strong className="mt-0.5 block text-sm font-extrabold text-slate-950">{metric.value}</strong>
                  <span className="block text-[11px] text-slate-500">{metric.hint}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-[1fr_0.78fr] md:p-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950">3 Gründe, warum es passt</h3>
              <ul className="mt-3 space-y-2">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                    <span className="mt-1 text-emerald-600">
                      <CheckIcon />
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-extrabold text-slate-950">Ein möglicher Nachteil</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                In der Hochsaison kann es an Wochenenden voller sein.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
