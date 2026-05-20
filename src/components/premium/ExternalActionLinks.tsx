import type { ExternalActionLink, ResortActionLinks } from "@/types/alpivo";
import { flattenResortActionLinks } from "@/data/resortActionLinks";

type ExternalActionLinksProps = {
  links: ResortActionLinks;
  title?: string;
  subtitle?: string;
  limit?: number;
  variant?: "dark" | "light";
  className?: string;
};

const kindLabels: Record<ExternalActionLink["kind"], string> = {
  official: "Offiziell",
  skipass_shop: "Skipass",
  ticket_info: "Tickets",
  live_status: "Live",
  webcam: "Webcam",
  piste_map: "Pistenplan",
  accommodation: "Unterkunft",
  travel: "Anreise",
  ski_school: "Skischule",
  rental: "Verleih",
  events: "Events",
  weather: "Wetter",
};

function ExternalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ExternalActionLinks({
  links,
  title = "Offizielle nächste Schritte",
  subtitle = "Alpivo führt dich zu offiziellen Quellen. Preise, Live-Status und Verfügbarkeit bitte dort final prüfen.",
  limit,
  variant = "dark",
  className = "",
}: ExternalActionLinksProps) {
  const visibleLinks = flattenResortActionLinks(links, limit);
  const isLight = variant === "light";

  if (!visibleLinks.length) return null;

  return (
    <section
      className={`rounded-[1.7rem] border p-4 ${
        isLight
          ? "border-slate-200 bg-white text-slate-950 shadow-sm"
          : "border-white/12 bg-white/[0.055] text-white"
      } ${className}`}
    >
      <div>
        <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-sky-200/76"}`}>
          Produktlinks
        </p>
        <h3 className="mt-2 text-xl font-black">{title}</h3>
        {subtitle ? <p className={`mt-2 text-sm leading-6 ${isLight ? "text-slate-600" : "text-slate-300"}`}>{subtitle}</p> : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {visibleLinks.map((link) => (
          <a
            key={`${link.kind}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
              isLight
                ? "border-slate-200 bg-slate-50 text-slate-950 hover:border-sky-200 hover:bg-white"
                : "border-white/12 bg-slate-950/38 text-white hover:border-sky-200/30 hover:bg-white/[0.08]"
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold">{link.label}</span>
              <span className={`mt-0.5 block text-xs font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {kindLabels[link.kind]} · {link.sourceName}
              </span>
            </span>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isLight ? "bg-sky-50 text-sky-700" : "bg-sky-400/14 text-sky-200"}`}>
              <ExternalIcon />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
