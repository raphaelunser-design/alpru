"use client";

import { useEffect, useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";

export default function AdminMediaPage() {
  const [token, setToken] = useState("");
  const [folder, setFolder] = useState("uploads");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; path: string } | null>(null);

  useEffect(() => {
    const run = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? "");
    };
    run();
  }, []);

  const upload = async () => {
    if (!file) {
      setError("Bitte eine Datei auswählen");
      return;
    }
    setUploading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder || "uploads");

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Upload fehlgeschlagen");
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[220px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[220px] w-full max-w-6xl items-end px-4 pb-8 pt-10 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Admin</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Media Upload</h1>
            <p className="mt-2 text-sm text-white/70">Lade Bilder hoch und nutze die URLs im Content.</p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <GlassCard className="p-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Ordner (z.B. backgrounds)"
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <button
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            onClick={upload}
            disabled={uploading}
          >
            {uploading ? "Lade hoch..." : "Upload"}
          </button>

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          {result ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <div className="text-xs text-slate-400">Public URL</div>
              <div className="mt-2 break-all text-white">{result.url}</div>
            </div>
          ) : null}
        </GlassCard>
      </Section>
    </div>
  );
}
