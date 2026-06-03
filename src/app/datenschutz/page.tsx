import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";

export default function DatenschutzPage() {
  return (
    <Section className="space-y-5 py-10">
      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Datenschutz</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Datenschutzhinweise</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          Alpivo nutzt Supabase für Authentifizierung und Speicherung von Profil-, Trip- und Feedbackdaten. Resort- und Wetterdaten
          dienen der Orientierung. Im Gastmodus speichert Alpivo Planungsdaten lokal auf diesem Gerät. Die finale Datenschutzerklärung
          muss vor einem öffentlichen Launch juristisch geprüft und mit den tatsächlichen Diensten, Kontaktangaben und Speicherfristen
          ergänzt werden.
        </p>
        <div className="mt-6 rounded-xl border border-amber-200/20 bg-amber-200/10 p-4 text-sm leading-6 text-amber-50">
          <div className="font-semibold">Launch-Blocker</div>
          <p className="mt-1">
            Fehlende Pflichtangaben: Verantwortlicher, Rechtsgrundlagen, Empfänger, Speicherdauer, Betroffenenrechte und Tracking-/Cookie-Hinweise.
          </p>
        </div>
      </GlassCard>
    </Section>
  );
}
