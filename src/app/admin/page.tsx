import Link from "next/link";
import AccessModeCard from "@/components/admin/AccessModeCard";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";

export default function AdminHome() {
  return (
    <Section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin Center</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Inhalte verwalten</h1>
        <p className="mt-2 text-sm text-slate-300">
          Resorts, Preise, Texte und Medien direkt im Frontend pflegen.
        </p>
      </div>

      <AccessModeCard />

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="text-lg font-semibold text-white">Resorts</h2>
          <p className="mt-2 text-sm text-slate-300">Stammdaten, Links, Scores, Koordinaten.</p>
          <Link className="mt-4 inline-flex text-sm text-white underline" href="/admin/resorts">
            Resorts bearbeiten
          </Link>
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="text-lg font-semibold text-white">Skipass Preise</h2>
          <p className="mt-2 text-sm text-slate-300">Manuelle Tagespreise + Stand aktualisieren.</p>
          <Link className="mt-4 inline-flex text-sm text-white underline" href="/admin/prices">
            Preise pflegen
          </Link>
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="text-lg font-semibold text-white">Content</h2>
          <p className="mt-2 text-sm text-slate-300">Hero-Texte, Sections und Buttons.</p>
          <Link className="mt-4 inline-flex text-sm text-white underline" href="/admin/content">
            Content bearbeiten
          </Link>
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="text-lg font-semibold text-white">Media</h2>
          <p className="mt-2 text-sm text-slate-300">Bilder hochladen und URLs kopieren.</p>
          <Link className="mt-4 inline-flex text-sm text-white underline" href="/admin/media">
            Media verwalten
          </Link>
        </GlassCard>
      </div>
    </Section>
  );
}
