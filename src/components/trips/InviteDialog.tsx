"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Toast from "@/components/Toast";

type InviteDialogProps = {
  onCreateInvite: (payload: { email: string; role: "admin" | "member"; note: string }) => Promise<{ url: string } | null>;
};

export default function InviteDialog({ onCreateInvite }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [toast, setToast] = useState("");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Einladen</div>
      <h3 className="mt-2 text-lg font-semibold text-white">Invite-Link für die Gruppe</h3>
      <p className="mt-2 text-sm text-slate-300">
        Für MVP erzeugt Alpivo einen sauberen Join-Link. Wenn du eine Mail hinterlegst, kannst du den Link direkt weitergeben.
      </p>

      <div className="mt-4 grid gap-3">
        <input
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          placeholder="E-Mail optional"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          placeholder="Kurze Notiz für den Invite"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="button-lift rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const created = await onCreateInvite({ email: email.trim(), role: "member", note: note.trim() });
              setBusy(false);
              if (!created.url) return;
              setInviteUrl(created.url);
              setToast("Invite-Link erzeugt.");
            }}
          >
            {busy "Erzeuge..." : "Invite-Link erzeugen"}
          </button>
          {inviteUrl (
            <button
              className="button-lift rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              onClick={async () => {
                await navigator.clipboard.writeText(inviteUrl);
                setToast("Link kopiert.");
              }}
            >
              Link kopieren
            </button>
          ) : null}
        </div>
        {inviteUrl (
          <div className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-3 text-xs text-slate-300 break-all">{inviteUrl}</div>
        ) : null}
      </div>

      <AnimatePresence>{toast <Toast message={toast} /> : null}</AnimatePresence>
    </div>
  );
}

