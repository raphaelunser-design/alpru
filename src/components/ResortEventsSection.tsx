import GlassCard from "@/components/GlassCard";
import {
  dataQualityHint,
  dataQualityLabel,
  eventTripFit,
  eventTypeLabel,
  formatEventPeriod,
  normalizeResortEvents,
  type ResortEvent,
} from "@/lib/resortEvents";

type ResortEventsSectionProps = {
  events: ResortEvent[] | null | undefined;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
};

function qualityClass(value: string | null | undefined) {
  if (value === "official") return "border-emerald-200/25 bg-emerald-200/10 text-emerald-50";
  if (value === "outdated") return "border-amber-200/25 bg-amber-200/10 text-amber-50";
  if (value === "missing") return "border-rose-200/25 bg-rose-200/10 text-rose-50";
  return "border-sky-200/20 bg-sky-200/10 text-sky-50";
}

function tripFitLabel(event: ResortEvent, tripStartDate?: string | null, tripEndDate?: string | null) {
  const fit = eventTripFit(event, tripStartDate, tripEndDate);
  if (fit === "exact") return "im Reisezeitraum";
  if (fit === "seasonal") return "saisonal passend";
  return null;
}

export default function ResortEventsSection({ events, tripStartDate, tripEndDate }: ResortEventsSectionProps) {
  const normalized = normalizeResortEvents(events);

  if (!normalized.length) {
    return (
      <GlassCard id="events" className="scroll-mt-24 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Vibe & Events</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Festival-Fit</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Für dieses Skigebiet sind aktuell keine größeren Events hinterlegt.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard id="events" className="scroll-mt-24 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Vibe & Events</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Festival-Fit</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Musik, Après-Ski und Eventwochen werden als Entscheidungshilfe angezeigt. Preise, Line-up und Verfügbarkeit bitte
            immer offiziell prüfen.
          </p>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs text-slate-200">
          {normalized.length} Event{normalized.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {normalized.map((event) => {
          const tripLabel = tripFitLabel(event, tripStartDate, tripEndDate);
          return (
            <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full border border-white/10 bg-slate-950/25 px-2.5 py-1 text-slate-200">
                      {eventTypeLabel(event.event_type)}
                    </span>
                    {tripLabel ? (
                      <span className="rounded-full border border-sky-200/25 bg-sky-200/10 px-2.5 py-1 text-sky-50">
                        {tripLabel}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-tight text-white">{event.name}</h3>
                  <div className="mt-1 text-sm text-slate-400">{formatEventPeriod(event)}</div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${qualityClass(event.data_quality)}`}>
                  {dataQualityLabel(event.data_quality)}
                </span>
              </div>

              {event.music_genres?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.music_genres.slice(0, 5).map((genre) => (
                    <span key={genre} className="rounded-full border border-white/10 bg-slate-950/22 px-2.5 py-1 text-[11px] text-slate-200">
                      {genre}
                    </span>
                  ))}
                </div>
              ) : null}

              {event.short_description ? <p className="mt-3 text-sm leading-6 text-slate-300">{event.short_description}</p> : null}

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                {event.best_for ? (
                  <div className="rounded-xl border border-emerald-200/15 bg-emerald-200/[0.055] p-3 text-slate-200">
                    <div className="text-xs uppercase tracking-wide text-emerald-100/75">Passt für</div>
                    <p className="mt-1 leading-5">{event.best_for}</p>
                  </div>
                ) : null}
                {event.not_ideal_for ? (
                  <div className="rounded-xl border border-amber-200/15 bg-amber-200/[0.055] p-3 text-slate-200">
                    <div className="text-xs uppercase tracking-wide text-amber-100/75">Eher nicht ideal</div>
                    <p className="mt-1 leading-5">{event.not_ideal_for}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-400">{dataQualityHint(event.data_quality)}</p>
                {event.official_url ? (
                  <a
                    className="button-lift rounded-lg border border-sky-200/30 px-3 py-2 text-center text-xs font-semibold text-sky-50 hover:bg-sky-200/10"
                    href={event.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Offizielle Eventseite öffnen
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </GlassCard>
  );
}
