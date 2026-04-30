"use client";

import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";

export default function FeedbackPage() {
  const [category, setCategory] = useState("feedback");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function submitFeedback() {
    setStatus("");
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus("Bitte kurz beschreiben, was dir aufgefallen ist.");
      return;
    }

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category, message: trimmed }),
    });

    if (!response.ok) {
      setStatus("Feedback konnte nicht gespeichert werden. Bitte später erneut versuchen.");
      return;
    }

    setMessage("");
    setStatus("Danke. Dein Feedback wurde gespeichert.");
  }

  return (
    <Section className="space-y-5 py-10">
      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Kontakt/Feedback</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Hilf Alpivo besser zu machen</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          Melde Bugs, fehlende Funktionen oder unklare Stellen. In der Beta ist genau dieses Feedback wertvoll.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="text-sm text-slate-300">
            Kategorie
            <select
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="feedback">Allgemeines Feedback</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature-Wunsch</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Nachricht
            <textarea
              className="mt-2 min-h-36 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/40"
              placeholder="Was fehlt, was ist unklar oder was funktioniert nicht"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <button
            className="w-fit rounded-lg bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
            type="button"
            onClick={submitFeedback}
          >
            Feedback senden
          </button>
          {status ? <div className="text-sm text-slate-300">{status}</div> : null}
        </div>
      </GlassCard>
    </Section>
  );
}
