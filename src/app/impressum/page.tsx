import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";

export default function ImpressumPage() {
  return (
    <Section className="space-y-5 py-10">
      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Rechtliches</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Impressum</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          Diese Seite ist als Platzhalter für die finalen Anbieterangaben vorbereitet. Bitte vor der vollständigen Veröffentlichung
          mit den korrekten Pflichtangaben ergänzen.
        </p>
        <div className="mt-6 rounded-xl border border-amber-200/20 bg-amber-200/10 p-4 text-sm text-amber-50">
          TODO: Name/Firma, Anschrift, Kontakt, Vertretungsberechtigte und ggf. Umsatzsteuer-ID eintragen.
        </div>
      </GlassCard>
    </Section>
  );
}
