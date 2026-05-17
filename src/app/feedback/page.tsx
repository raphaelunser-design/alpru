"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/premium/AppShell";
import PageHeader from "@/components/premium/PageHeader";
import TrustPoint from "@/components/premium/TrustPoint";
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
    <AppShell>
      <main className="alpivo-page-shell min-h-screen px-4 py-7 md:px-8 md:py-10">
        <div className="mx-auto grid w-full max-w-[1480px] gap-7">
          <PageHeader
            eyebrow="Feedback & Vertrauen"
            title="Sag uns, was besser werden soll."
            subtitle="Jede Rückmeldung verbessert den Match. Bugs, Design-Reibung, fehlende Daten und falsche Ergebnisse landen mit Seitenkontext im Admin-Bereich."
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-[1.8rem] border border-white/12 bg-slate-950/72 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.36)] md:p-7">
              <div>
                <div className="text-sm font-extrabold text-white">Kategorie</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`button-lift min-h-12 rounded-2xl border px-4 text-sm font-bold transition ${
                        category === item.value
                          ? "border-sky-300/60 bg-sky-500 text-white shadow-[0_14px_34px_rgba(14,165,233,0.24)]"
                          : "border-white/12 bg-white/[0.055] text-slate-200 hover:border-sky-200/30 hover:bg-white/10"
                      }`}
                      onClick={() => setCategory(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-extrabold text-white" htmlFor="feedback-rating">Wie hilfreich ist Alpivo für deine Planung?</label>
                  <span className="rounded-full border border-white/12 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">{rating}/5</span>
                </div>
                <div id="feedback-rating" className="mt-3 grid grid-cols-5 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045]">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`min-h-12 border-r border-white/10 text-sm font-extrabold last:border-r-0 ${
                        rating === value ? "bg-sky-500 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                      onClick={() => setRating(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-6 block text-sm font-extrabold text-white">
                Seite oder Funktion <span className="font-semibold text-slate-400">(optional)</span>
                <input
                  className="mt-2 min-h-13 w-full rounded-2xl border border-white/12 bg-white/[0.055] px-4 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
                  placeholder="z. B. Ergebnisseite, Karte, Match Wizard ..."
                  value={pagePath}
                  onChange={(event) => setPagePath(event.target.value)}
                />
              </label>

              <label className="mt-6 block text-sm font-extrabold text-white">
                Deine Nachricht
                <textarea
                  className="mt-2 min-h-52 w-full resize-y rounded-2xl border border-white/12 bg-white/[0.055] p-4 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
                  placeholder="Beschreibe bitte kurz, was dir aufgefallen ist oder was wir verbessern können ..."
                  value={message}
                  maxLength={1000}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xs leading-5 text-slate-400">
                Account-ID und Browserinfos werden nur zur Fehleranalyse genutzt.
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <button
                  className="button-lift min-h-13 rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400 disabled:cursor-wait disabled:opacity-70"
                  type="button"
                  disabled={submitting}
                  onClick={submitFeedback}
                >
                  {submitting ? "Wird gesendet..." : "Feedback senden"}
                </button>
                <div className="text-right text-xs font-semibold text-slate-500">{message.length} / 1000</div>
              </div>

              {status.text ? (
                <div
                  className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
                    status.tone === "error"
                      ? "border-red-300/30 bg-red-500/10 text-red-100"
                      : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                  }`}
                >
                  {status.text}
                </div>
              ) : null}
            </section>

            <aside className="grid content-start gap-4">
              <TrustPoint icon="shield" title="Unabhängig & objektiv" text="Dein Feedback hilft, Match-Gründe und Haken klarer zu erklären." />
              <TrustPoint icon="lock" title="Sicher & transparent" text="Wir nutzen technische Infos nur, um Fehler schneller einzugrenzen." />
              <TrustPoint icon="data" title="Aktuelle Daten" text="Hinweise zu Preisen, Schnee und fehlenden Resortdaten fließen in die Beta-Priorisierung." />
              <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.065] p-5">
                <div className="text-lg font-black text-white">Beta-Roadmap</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Map, Tripboards und Resortdaten werden schrittweise erweitert. Dein Hinweis hilft bei der Reihenfolge.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
