import Link from "next/link";
import DataStatusBadge, { type DataStatus } from "@/components/DataStatusBadge";
import { getCanonicalResortBySlug } from "@/data/resorts";
import type { DataConfidence } from "@/types/alpivo";

type DataStatusPanelProps = {
  resortSlug: string;
  className?: string;
};

function toStatus(status: DataConfidence): DataStatus {
  if (status === "official" || status === "verified") return "verified";
  if (status === "estimated") return "estimated";
  if (status === "demo") return "demo";
  if (status === "missing") return "stale";
  return "unknown";
}

export default function DataStatusPanel({ resortSlug, className = "" }: DataStatusPanelProps) {
  const resort = getCanonicalResortBySlug(resortSlug);
  if (!resort) return null;

  const rows = [
    { label: "Kosten", confidence: resort.price.confidence, text: "Kosten sind geschätzt und dienen als Orientierung." },
    { label: "Anreise", confidence: resort.travelFromMunich.confidence, text: "Fahrzeit und Strecke vor Abfahrt gegenprüfen." },
    { label: "Schnee", confidence: resort.snow.confidence, text: "Live-Schnee ist keine Garantie für deinen Reisetag." },
    { label: "Pisten", confidence: resort.skiArea.confidence, text: "Gebietsdaten können sich saisonal ändern." },
    { label: "Vibe", confidence: resort.vibe.confidence, text: "Vibe- und Eventsignale sind Beta-Orientierung." },
  ];

  return (
    <section className={`rounded-[1.7rem] border border-white/12 bg-slate-950/70 p-4 text-white shadow-[0_24px_80px_rgba(2,6,23,0.3)] ${className}`}>
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-200/76">Datenstatus</p>
      <h3 className="mt-2 text-xl font-black">{resort.dataStatus.summary}</h3>
      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-extrabold">{row.label}</p>
              <DataStatusBadge status={toStatus(row.confidence)} compact />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">{row.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-300/[0.08] p-4 text-sm leading-6 text-amber-50/90">
        Offizielle Angaben vor Buchung prüfen. Unterkunftsbeispiele sind Orientierung, keine geprüfte Live-Verfügbarkeit.
      </div>
      {resort.dataStatus.missingFields.length ? (
        <div className="mt-4">
          <p className="text-sm font-black">Noch nicht live angebunden</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
            {resort.dataStatus.missingFields.map((field) => (
              <li key={field}>• {field}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link
        href={`/feedback?category=daten-fehlen&resort=${encodeURIComponent(resort.slug)}`}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.055] px-4 text-sm font-extrabold text-slate-100 hover:bg-white/10"
      >
        Daten fehlen? Feedback senden
      </Link>
    </section>
  );
}
