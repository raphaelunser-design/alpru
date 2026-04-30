"use client";

import { useState } from "react";
import Link from "next/link";
import {
  formatCurrency,
  getFavoriteComments,
  getFavoriteVoteSummary,
  getTripMemberName,
  type SkiTripBundle,
  type SkiTripFavoriteRecord,
  type SkiTripMemberRecord,
  type SkiTripVoteKind,
} from "@/lib/tripPlanner";

type ResortFavoriteCardProps = {
  bundle: SkiTripBundle;
  favorite: SkiTripFavoriteRecord;
  currentMember: SkiTripMemberRecord | null;
  onVote: (favoriteId: string, kind: SkiTripVoteKind) => Promise<void> | void;
  onComment: (favoriteId: string, body: string) => Promise<void> | void;
  onPin: (favoriteId: string, nextPinned: boolean) => Promise<void> | void;
};

export default function ResortFavoriteCard({
  bundle,
  favorite,
  currentMember,
  onVote,
  onComment,
  onPin,
}: ResortFavoriteCardProps) {
  const [comment, setComment] = useState("");
  const resort = bundle.resorts[favorite.resortSlug] null;
  const voteSummary = getFavoriteVoteSummary(bundle, favorite.id);
  const comments = getFavoriteComments(bundle, favorite.id);
  const proposer = bundle.members.find((member) => member.id === favorite.proposedByMemberId) null;

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/55">
      <div
        className="relative min-h-[180px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(8,17,31,0.15), rgba(8,17,31,0.88)), url("${resort.imageUrl "/bg/skilandschaft.png"}")`,
        }}
      >
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="rounded-full border border-white/15 bg-slate-950/55 px-3 py-1 text-xs text-white/85">
            {voteSummary.favorites} Favoriten · {voteSummary.likes} Likes
          </span>
          <button
            className={`rounded-full border px-3 py-1 text-xs ${
              favorite.isPinned
                "border-sky-200/25 bg-sky-200/12 text-sky-50"
                : "border-white/15 bg-slate-950/55 text-white/85"
            }`}
            onClick={() => onPin(favorite.id, !favorite.isPinned)}
          >
            {favorite.isPinned "angeheftet" : "anpinnen"}
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/70">{resort.country "Resort"}</div>
          <h3 className="mt-2 text-2xl font-semibold text-white">{resort.name favorite.resortSlug}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/75">
            {typeof resort.pisteKm === "number" <span>{Math.round(resort.pisteKm)} km Pisten</span> : null}
            {typeof resort.elevationMaxM === "number" <span>Top {Math.round(resort.elevationMaxM)} m</span> : null}
            {typeof resort.skipassPriceFrom === "number" <span>ab {formatCurrency(resort.skipassPriceFrom)}</span> : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="text-sm text-slate-300">
          {favorite.note "Noch kein Team-Kommentar hinterlegt."}
          {proposer <div className="mt-2 text-xs text-slate-500">Vorgeschlagen von {getTripMemberName(proposer)}</div> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-100 transition hover:bg-white/[0.1]"
            onClick={() => onVote(favorite.id, "like")}
          >
            Like geben
          </button>
          <button
            type="button"
            className="rounded-full border border-sky-200/20 bg-sky-200/10 px-3 py-2 text-xs text-sky-50 transition hover:bg-sky-200/15"
            onClick={() => onVote(favorite.id, "favorite")}
          >
            Als Favorit markieren
          </button>
          <Link
            href={`/resort/${encodeURIComponent(favorite.resortSlug)}`}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-100 transition hover:bg-white/[0.1]"
          >
            Resort ansehen
          </Link>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Team-Kommentare</div>
          <div className="mt-3 grid gap-3">
            {comments.length > 0 (
              comments.map((entry) => {
                const author = bundle.members.find((member) => member.id === entry.memberId) null;
                return (
                  <div key={entry.id} className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
                    <div className="text-sm text-slate-100">{entry.body}</div>
                    <div className="mt-2 text-xs text-slate-500">{author getTripMemberName(author) : "Mitglied"}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-400">Noch keine Kommentare.</div>
            )}
          </div>
          {currentMember (
            <div className="mt-3 grid gap-2">
              <textarea
                className="min-h-[76px] rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-500"
                placeholder="Kurze Einschätzung für die Gruppe..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <button
                className="button-lift justify-self-start rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
                onClick={async () => {
                  const trimmed = comment.trim();
                  if (!trimmed) return;
                  await onComment(favorite.id, trimmed);
                  setComment("");
                }}
              >
                Kommentar speichern
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
