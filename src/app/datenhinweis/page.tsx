import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";

export default function DatenhinweisPage() {
  return (
    <Section className="space-y-5 py-10">
      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Datenhinweis</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Wie Alpivo Daten bewertet</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          Alpivo kombiniert öffentlich verfügbare Resortinformationen, geschätzte Kostenwerte und Nutzerpräferenzen. Alle Werte dienen
          als Orientierung und werden laufend verbessert. Preise, Öffnungszeiten, Schneelage, Wetter, Pistenstatus und Verfügbarkeiten
          müssen vor einer Buchung bei der offiziellen Quelle geprüft werden.
        </p>
        <div className="mt-6 grid gap-3 text-sm text-slate-200 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="font-semibold text-white">Beta-/Pilotdaten</div>
            <p className="mt-2 text-slate-400">Kuratierte Orientierung, wenn Live-Daten fehlen oder nicht laden.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="font-semibold text-white">Geschätzt</div>
            <p className="mt-2 text-slate-400">Plausible Annahmen für Kosten, Scores oder fehlende Detailwerte.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="font-semibold text-white">Verifiziert</div>
            <p className="mt-2 text-slate-400">Werte mit gepflegter Quelle oder direktem Import.</p>
          </div>
        </div>
        <Link className="mt-6 inline-flex rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" href="/quiz">
          Match starten
        </Link>
      </GlassCard>
    </Section>
  );
}
