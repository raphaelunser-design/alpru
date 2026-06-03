import type { AlpivoResort } from "@/data/resorts";
import { getResortActionLinks } from "@/data/resortActionLinks";
import { DEFAULT_GUEST_PREFERENCES } from "@/lib/guestState";
import { getSkipassRecommendation } from "@/lib/skipassAssistant";
import type { MatchPayload } from "@/lib/matching/matchPayload";
import type { TripPreferences } from "@/types/alpivo";

type SkipassAssistantVariant = "detail" | "compact" | "trip" | "checklist";

type SkipassAssistantProps = {
  resort: AlpivoResort;
  preferences?: Partial<TripPreferences> | MatchPayload;
  groupSize?: number;
  variant?: SkipassAssistantVariant;
  completed?: boolean;
  className?: string;
  onComplete?: () => void;
};

function ExternalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function variantClasses(variant: SkipassAssistantVariant) {
  if (variant === "checklist") {
    return {
      shell: "border-slate-200 bg-white text-slate-950 shadow-sm",
      eyebrow: "text-sky-700",
      text: "text-slate-600",
      panel: "border-slate-200 bg-slate-50",
      buttonSecondary: "border-slate-200 bg-slate-50 text-slate-800 hover:bg-white",
    };
  }

  return {
    shell: "border-white/12 bg-slate-950/70 text-white shadow-[0_24px_80px_rgba(2,6,23,0.3)]",
    eyebrow: "text-sky-200/76",
    text: "text-slate-300",
    panel: "border-white/10 bg-white/[0.055]",
    buttonSecondary: "border-white/14 bg-white/[0.06] text-white hover:bg-white/10",
  };
}

export default function SkipassAssistant({
  resort,
  preferences = DEFAULT_GUEST_PREFERENCES,
  groupSize,
  variant = "detail",
  completed = false,
  className = "",
  onComplete,
}: SkipassAssistantProps) {
  const recommendation = getSkipassRecommendation(preferences, groupSize);
  const actionLinks = getResortActionLinks(resort.slug);
  const primaryTicketLink = actionLinks.skipassShop ?? actionLinks.ticketInfo;
  const priceLink = actionLinks.ticketInfo && actionLinks.ticketInfo.url !== primaryTicketLink?.url ? actionLinks.ticketInfo : null;
  const styles = variantClasses(variant);

  return (
    <section className={`rounded-[1.7rem] border p-4 ${styles.shell} ${className}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={`text-xs font-extrabold uppercase tracking-[0.2em] ${styles.eyebrow}`}>Skipass-Assistent</p>
          <h3 className="mt-2 text-2xl font-black">{recommendation.ticketTypeLabel}</h3>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${styles.text}`}>{recommendation.dateHint}</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${completed ? "border-emerald-200/35 bg-emerald-200/12 text-emerald-100" : variant === "checklist" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-amber-200/30 bg-amber-300/10 text-amber-100"}`}>
          {completed ? <CheckIcon /> : null}
          {completed ? "erledigt" : "offiziell prüfen"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className={`rounded-2xl border p-4 ${styles.panel}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.14em] ${styles.text}`}>volle Skitage</p>
          <p className="mt-2 text-3xl font-black">{recommendation.fullSkiDays}</p>
          <p className={`mt-1 text-xs leading-5 ${styles.text}`}>ohne An-/Abreisetag gerechnet</p>
        </div>
        <div className={`rounded-2xl border p-4 ${styles.panel}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.14em] ${styles.text}`}>Ticket prüfen</p>
          <p className="mt-2 text-3xl font-black">{recommendation.possibleTicketDays}</p>
          <p className={`mt-1 text-xs leading-5 ${styles.text}`}>maximal sinnvoller Korridor</p>
        </div>
        <div className={`rounded-2xl border p-4 ${styles.panel}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.14em] ${styles.text}`}>Gruppe</p>
          <p className="mt-2 text-3xl font-black">{groupSize ?? preferences.peopleCount ?? 1}</p>
          <p className={`mt-1 text-xs leading-5 ${styles.text}`}>Altersgruppen offiziell prüfen</p>
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border p-4 text-sm leading-6 ${styles.panel} ${styles.text}`}>
        <p>{recommendation.groupHint}</p>
        <p className="mt-2 font-semibold">{recommendation.officialCheckHint}</p>
        <p className="mt-2">
          Alpivo erfindet hier keine Ticketpreise. Verbindlich sind Preis, Altersgruppen, KeyCard-/Smartphone-Regeln und Saisonzeiten nur im offiziellen Shop.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {primaryTicketLink ? (
          <a
            href={primaryTicketLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="button-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
          >
            Skipass offiziell kaufen
            <ExternalIcon />
          </a>
        ) : null}
        {priceLink ? (
          <a
            href={priceLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-extrabold ${styles.buttonSecondary}`}
          >
            Preise prüfen
            <ExternalIcon />
          </a>
        ) : null}
        {onComplete ? (
          <button
            type="button"
            onClick={onComplete}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-extrabold ${completed ? "border-emerald-200/30 bg-emerald-300/10 text-emerald-100" : styles.buttonSecondary}`}
          >
            <CheckIcon />
            {completed ? "Als erledigt markiert" : "Als erledigt markieren"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
