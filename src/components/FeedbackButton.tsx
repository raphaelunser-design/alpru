"use client";

import { useState } from "react";

const categories = [
  { value: "general", label: "Feedback" },
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idee" },
] as const;

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof categories)[number]["value"]>("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit() {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setError("Bitte kurz beschreiben, was dir aufgefallen ist.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError("");
    const token = await import("@/lib/supabase")
      .then(({ supabase }) => supabase.auth.getSession())
      .then(({ data }) => data.session?.access_token ?? "")
      .catch(() => "");

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        category,
        feedbackType: category,
        message: trimmed,
        pagePath: window.location.pathname,
        pageUrl: window.location.href,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error: string } | null;
      setStatus("error");
      setError(body?.error ?? "Feedback konnte nicht gespeichert werden.");
      return;
    }

    setStatus("done");
    setMessage("");
    window.setTimeout(() => {
      setOpen(false);
      setStatus("idle");
    }, 1100);
  }

  return (
    <div className="fixed bottom-20 right-3 z-40 hidden md:block md:bottom-5 md:right-5">
      {open ? (
        <div className="mb-3 w-[min(calc(100vw-1.5rem),360px)] rounded-2xl border border-white/15 bg-slate-950/94 p-4 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Beta Feedback</div>
              <div className="mt-1 text-lg font-semibold text-white">Was sollen wir verbessern</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
            >
              Schließen
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  category === item.value
                    ? "border-sky-200 bg-sky-200 text-slate-950"
                    : "border-white/10 bg-white/[0.05] text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <textarea
            className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-white/[0.06] p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Was gefällt dir, was fehlt oder wo ist etwas kaputt"
            maxLength={2000}
          />

          {status === "error" && error ? <div className="mt-2 text-xs text-red-200">{error}</div> : null}
          {status === "done" ? <div className="mt-2 text-xs text-emerald-200">Danke, Feedback gespeichert.</div> : null}

          <button
            type="button"
            onClick={submit}
            disabled={status === "sending"}
            className="button-lift mt-3 w-full rounded-xl bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
          >
            {status === "sending" ? "Sendet..." : "Feedback senden"}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="button-lift rounded-full border border-sky-100/30 bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(56,189,248,0.26)] hover:bg-white"
      >
        Feedback
      </button>
    </div>
  );
}
