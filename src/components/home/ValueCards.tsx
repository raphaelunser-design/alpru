"use client";

import { useClientLocale } from "@/lib/clientLocale";
import { homeCopy } from "./homeCopy";

const icons = ["budget", "mountain", "score"] as const;

function ValueIcon({ icon }: { icon: (typeof icons)[number] }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (icon === "budget") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 7h16v12H4V7Zm2-3h12v3H6V4Zm3 9h.01M15 11h3m-3 4h3" />
      </svg>
    );
  }

  if (icon === "mountain") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="m3 19 7-13 3.2 5.8L16 8l5 11H3Zm7-13 1.6 6 2.5-.2" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path {...common} d="M12 3v18m6-15H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H6m11-8 3 3-3 3" />
    </svg>
  );
}

export default function ValueCards() {
  const locale = useClientLocale();
  const values = homeCopy[locale].values;

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-3 px-4 pt-6 md:grid-cols-3 md:px-6 md:pt-8">
      {values.map(([title, text], index) => (
        <article
          key={title}
          className="surface-lift rounded-2xl p-5 transition hover:-translate-y-1 hover:border-sky-200/28 md:p-6"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-sky-200/24 bg-sky-200/12 text-sky-100">
            <ValueIcon icon={icons[index] ?? "score"} />
          </div>
          <h2 className="mt-5 text-lg font-semibold leading-tight text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
        </article>
      ))}
    </section>
  );
}
