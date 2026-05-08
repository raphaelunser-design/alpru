"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { supabase } from "@/lib/supabase";

const categories = [
  { value: "bug", label: "Bug" },
  { value: "design", label: "Design" },
  { value: "feedback", label: "Ergebnis falsch" },
  { value: "idea", label: "Daten fehlen" },
  { value: "feature", label: "Feature-Wunsch" },
  { value: "general", label: "Allgemein" },
];

export default function FeedbackPage() {
  const [category, setCategory] = useState("general");
  const [rating, setRating] = useState(4);
  const [pagePath, setPagePath] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ tone: "success" | "error" | "idle"; text: string }>({ tone: "idle", text: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPagePath(window.location.pathname);
  }, []);

  async function submitFeedback() {
    setStatus({ tone: "idle", text: "" });
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus({ tone: "error", text: "Bitte kurz beschreiben, was dir aufgefallen ist." });
      return;
    }

    setSubmitting(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        category,
        feedbackType: category,
        rating,
        pagePath: pagePath.trim() || window.location.pathname,
        pageUrl: window.location.href,
        message: trimmed,
        browserInfo: {
          language: navigator.language,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          platform: navigator.platform,
        },
      }),
    });

    setSubmitting(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus({ tone: "error", text: body?.error || "Feedback konnte nicht gespeichert werden. Bitte später erneut versuchen." });
      return;
    }

    setMessage("");
    setStatus({ tone: "success", text: "Danke. Dein Feedback wurde gespeichert." });
  }

  return (
    <Section className="space-y-5 py-10">
      <GlassCard className="overflow-hidden p-0">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_16%_0%,rgba(125,211,252,0.20),transparent_36%)] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Kontakt/Feedback</p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Hilf Alpivo besser zu machen</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
            Melde Bugs, Design-Reibung, fehlende Daten oder falsche Ergebnisse. In der Beta landet dein Hinweis mit Seitenkontext im Admin-Bereich.
          </p>
        </div>

        <div className="grid gap-5 p-6 md:p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">
            <label className="text-sm text-slate-300">
              Kategorie
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Bewertung
              <div className="mt-2 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`min-h-11 rounded-xl border text-sm font-semibold ${
                      rating === value
                        ? "border-sky-200 bg-sky-200 text-slate-950"
                        : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/10"
                    }`}
                    onClick={() => setRating(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </label>

            <label className="text-sm text-slate-300">
              Seite oder Funktion (optional)
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/40"
                placeholder="/quiz, Kalender, Ergebnis-Card ..."
                value={pagePath}
                onChange={(event) => setPagePath(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4">
            <label className="text-sm text-slate-300">
              Nachricht
              <textarea
                className="mt-2 min-h-48 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/40"
                placeholder="Was fehlt, was ist unklar oder was funktioniert nicht?"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                className="button-lift min-h-12 rounded-xl bg-sky-200 px-5 text-sm font-semibold text-slate-950 hover:bg-white disabled:cursor-wait disabled:opacity-70"
                type="button"
                disabled={submitting}
                onClick={submitFeedback}
              >
                {submitting ? "Wird gesendet..." : "Feedback senden"}
              </button>
              {status.text ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    status.tone === "error"
                      ? "border-red-300/30 bg-red-500/10 text-red-100"
                      : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                  }`}
                >
                  {status.text}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}
