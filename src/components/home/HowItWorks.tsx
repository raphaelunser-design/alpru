"use client";

import Reveal from "@/components/Reveal";

const steps = [
  ["01", "Präferenzen angeben", "Profil, Zeitraum, Budget, Gruppe und Vibe setzen den Rahmen."],
  ["02", "Faktoren gewichten", "Budget, Schnee, Anreise, Pisten und Events zählen je nach Trip anders."],
  ["03", "Daten analysieren", "Resort-, Wetter-, Kosten- und Reise-Signale werden zusammengeführt."],
  ["04", "Score berechnen", "Jedes Gebiet erhält einen nachvollziehbaren Match Score."],
  ["05", "Top-Empfehlungen erhalten", "Ihr seht Kosten, Gründe, Haken und die besten Alternativen."],
] as const;

function StepIcon({ index }: { index: number }) {
  const paths = [
    "M5 12h14M8 7h8M9 17h6",
    "M4 7h10m4 0h2M4 17h3m4 0h9M14 5v4M7 15v4",
    "M5 19V5m0 14h14M8 15l3-4 3 2 4-6",
    "M12 3v18M6 7h9a3 3 0 0 1 0 6h-5a3 3 0 0 0 0 6h8",
    "M5 13l4 4L19 7",
  ];

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[index] ?? paths[0]} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <section id="so-funktionierts" className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#07101e] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#07101e_0%,#0a1829_48%,#07101e_100%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-[-0.01em] text-white md:text-5xl">
              So entsteht euer Match Score
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-slate-300">
              Transparente Gewichtung, ehrliche Empfehlungen und ein Score, der nicht nur sortiert, sondern erklärt.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-12 grid gap-4 md:grid-cols-5 md:gap-0">
          <div className="ski-track-line absolute left-[10%] right-[10%] top-7 hidden h-px bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-300 md:block" />
          <div className="absolute bottom-6 left-7 top-8 w-px bg-gradient-to-b from-sky-300 via-cyan-200 to-emerald-300 md:hidden" />
          {steps.map(([number, title, text], index) => (
            <Reveal key={number} delay={index * 0.05}>
              <article className="relative grid gap-4 rounded-[1.25rem] border border-white/12 bg-white/[0.06] p-5 shadow-[0_18px_55px_rgba(2,6,23,0.16)] md:border-transparent md:bg-transparent md:p-3 md:shadow-none">
                <div className="flex items-center gap-4 md:flex-col md:text-center">
                  <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-[#07101e] bg-sky-400 text-slate-950 shadow-[0_16px_36px_rgba(14,165,233,0.28)]">
                    <StepIcon index={index} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-sky-200">{number}</div>
                    <h3 className="mt-1 text-base font-extrabold leading-tight text-white">{title}</h3>
                  </div>
                </div>
                <p className="border-l border-sky-200/18 pl-4 text-sm leading-6 text-slate-300 md:border-l-0 md:pl-0 md:text-center">
                  {text}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
