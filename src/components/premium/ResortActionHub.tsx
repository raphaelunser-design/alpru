import Link from "next/link";
import { flattenResortActionLinks, getResortActionLinks } from "@/data/resortActionLinks";
import type { ExternalActionLink } from "@/types/alpivo";

export type ResortActionHubVariant = "detail" | "compact" | "mapPanel" | "trip" | "checklist";

type ResortActionHubProps = {
  resortSlug: string;
  variant?: ResortActionHubVariant;
  title?: string;
  subtitle?: string;
  limit?: number;
  className?: string;
  showMissingReport?: boolean;
  onActionClick?: (link: ExternalActionLink) => void;
};

const actionCopy: Record<ExternalActionLink["kind"], { label: string; helper: string }> = {
  official: {
    label: "Offizielle Infos öffnen",
    helper: "öffnet offizielle Website",
  },
  skipass_shop: {
    label: "Skipass offiziell kaufen",
    helper: "öffnet offiziellen Ticketshop",
  },
  ticket_info: {
    label: "Preise prüfen",
    helper: "öffnet offizielle Preisinfos",
  },
  live_status: {
    label: "Live-Schnee / Liftstatus prüfen",
    helper: "öffnet offizielle Live-Infos",
  },
  webcam: {
    label: "Webcams ansehen",
    helper: "öffnet offizielle Webcams",
  },
  piste_map: {
    label: "Pistenplan öffnen",
    helper: "öffnet offizielle Skigebietsinfos",
  },
  accommodation: {
    label: "Unterkunft suchen",
    helper: "öffnet offizielle Unterkunftssuche",
  },
  travel: {
    label: "Anreise planen",
    helper: "öffnet offizielle Anreiseinfos",
  },
  ski_school: {
    label: "Skischule prüfen",
    helper: "öffnet offizielle Anbieterinfos",
  },
  rental: {
    label: "Verleih prüfen",
    helper: "öffnet offizielle Anbieterinfos",
  },
  events: {
    label: "Events / Après prüfen",
    helper: "öffnet offizielle Eventinfos",
  },
  weather: {
    label: "Wetter prüfen",
    helper: "öffnet offizielle Wetterinfos",
  },
};

function ExternalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MissingIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function variantClasses(variant: ResortActionHubVariant) {
  if (variant === "checklist") {
    return {
      shell: "border-slate-200 bg-white text-slate-950 shadow-sm",
      eyebrow: "text-sky-700",
      text: "text-slate-600",
      item: "border-slate-200 bg-slate-50 text-slate-950 hover:border-sky-200 hover:bg-white",
      icon: "bg-sky-50 text-sky-700",
      helper: "text-slate-500",
    };
  }

  return {
    shell: "border-white/12 bg-slate-950/70 text-white shadow-[0_24px_80px_rgba(2,6,23,0.3)]",
    eyebrow: "text-sky-200/76",
    text: "text-slate-300",
    item: "border-white/12 bg-white/[0.055] text-white hover:border-sky-200/30 hover:bg-white/[0.09]",
    icon: "bg-sky-400/14 text-sky-200",
    helper: "text-slate-400",
  };
}

function gridClass(variant: ResortActionHubVariant) {
  if (variant === "compact" || variant === "mapPanel") return "grid gap-2";
  if (variant === "trip" || variant === "checklist") return "grid gap-2 sm:grid-cols-2";
  return "grid gap-2 sm:grid-cols-2 xl:grid-cols-3";
}

export default function ResortActionHub({
  resortSlug,
  variant = "detail",
  title = "Offizielle nächste Schritte",
  subtitle = "Alpivo erklärt den Match. Tickets, Live-Status, Webcams, Unterkunft und Anreise prüfst du anschließend bei offiziellen Quellen.",
  limit,
  className = "",
  showMissingReport = true,
  onActionClick,
}: ResortActionHubProps) {
  const links = flattenResortActionLinks(getResortActionLinks(resortSlug), limit);
  const styles = variantClasses(variant);

  if (!links.length && !showMissingReport) return null;

  return (
    <section className={`rounded-[1.7rem] border p-4 ${styles.shell} ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`text-xs font-extrabold uppercase tracking-[0.2em] ${styles.eyebrow}`}>Planungsaktionen</p>
          <h3 className="mt-2 text-xl font-black">{title}</h3>
          {subtitle ? <p className={`mt-2 max-w-3xl text-sm leading-6 ${styles.text}`}>{subtitle}</p> : null}
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-extrabold ${variant === "checklist" ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/12 bg-white/[0.06] text-slate-300"}`}>
          extern
        </span>
      </div>

      {links.length ? (
        <div className={`mt-4 ${gridClass(variant)}`}>
          {links.map((link) => {
            const copy = actionCopy[link.kind];
            return (
              <a
                key={`${link.kind}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onActionClick?.(link)}
                aria-label={`${copy?.label ?? link.label} für ${resortSlug} öffnen, externe offizielle Quelle`}
                className={`group flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${styles.item}`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold">{copy?.label ?? link.label}</span>
                  <span className={`mt-0.5 block text-xs font-semibold ${styles.helper}`}>
                    {copy?.helper ?? "öffnet offizielle Website"} · {link.sourceName}
                  </span>
                  {link.note ? <span className={`mt-1 block text-xs leading-5 ${styles.helper}`}>{link.note}</span> : null}
                </span>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${styles.icon}`}>
                  <ExternalIcon />
                </span>
              </a>
            );
          })}
        </div>
      ) : null}

      {showMissingReport ? (
        <Link
          href={`/feedback?category=link-fehlt&feature=resort-action-links&resort=${encodeURIComponent(resortSlug)}`}
          className={`mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-extrabold transition ${
            variant === "checklist"
              ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
              : "border-white/12 bg-white/[0.045] text-slate-200 hover:bg-white/[0.08]"
          }`}
        >
          <MissingIcon />
          Link fehlt melden
        </Link>
      ) : null}
    </section>
  );
}
