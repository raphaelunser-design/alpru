import { NextResponse } from "next/server";
import {
  deriveResortDecision,
  resolveBudgetCap,
  type ResortDecision,
} from "@/lib/resortSignals";
import { buildMatchPayload } from "@/lib/matching/matchPayload";
import { loadAllResortRows } from "@/lib/resortRepository";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawPrefs = await req.json().catch(() => ({}));
    const prefs = buildMatchPayload(rawPrefs);
    const budgetCap = resolveBudgetCap(prefs);

    const source = await loadAllResortRows(supabaseAdmin, { orderBy: "name" });
    const sourceResorts = source.resorts;

    const allScored: ResortDecision[] = sourceResorts.map((resort) =>
      deriveResortDecision(resort, prefs, budgetCap)
    );
    const scored = allScored.filter((resort) => resort.exclusionReasons.length === 0);
    const excluded = allScored.filter((resort) => resort.exclusionReasons.length > 0);

    if (process.env.NODE_ENV !== "production" && (source.usingFallback || scored.length === 0)) {
      console.warn("[alpivo-match] match completed with fallback or empty result set", {
        params: prefs,
        source: source.source,
        fallbackReason: source.fallbackReason,
        supabaseError: source.error,
        loaded: source.loaded,
        scored: scored.length,
        excluded: excluded.length,
      });
    }

    scored.sort((a, b) => {
      if (b.matchPct !== a.matchPct) return b.matchPct - a.matchPct;
      if (prefs.tripStyle === "family") {
        const comfort = (b.fitProfile.comfort ?? 0) - (a.fitProfile.comfort ?? 0);
        if (comfort !== 0) return comfort;
        return a.cost.totalMax - b.cost.totalMax;
      }
      if (prefs.tripStyle === "budget") {
        const value = (b.fitProfile.value ?? 0) - (a.fitProfile.value ?? 0);
        if (value !== 0) return value;
        return a.cost.totalMax - b.cost.totalMax;
      }
      if (prefs.tripStyle === "quiet") {
        const comfort = (b.fitProfile.comfort ?? 0) - (a.fitProfile.comfort ?? 0);
        if (comfort !== 0) return comfort;
      }
      if (prefs.tripStyle === "glacier") {
        const summer = (b.summerGlacierScore ?? b.fitProfile.summer ?? 0) - (a.summerGlacierScore ?? a.fitProfile.summer ?? 0);
        if (summer !== 0) return summer;
      }
      if (prefs.tripStyle === "offpiste") {
        const offPiste = (b.fitProfile.offPiste ?? 0) - (a.fitProfile.offPiste ?? 0);
        if (offPiste !== 0) return offPiste;
      }
      if (prefs.partyPreference === "festival_event" || prefs.partyPreference === "party_places") {
        const festival = (b.fitProfile.festival ?? b.festivalFitScore ?? 0) - (a.fitProfile.festival ?? a.festivalFitScore ?? 0);
        if (festival !== 0) return festival;
      }
      if (prefs.partyPreference === "quiet_no_events") {
        const quietA = a.crowdScore == null ? 0.5 : 1 - a.crowdScore;
        const quietB = b.crowdScore == null ? 0.5 : 1 - b.crowdScore;
        if (quietB !== quietA) return quietB - quietA;
      }
      const pisteA = a.pisteKm ?? 0;
      const pisteB = b.pisteKm ?? 0;
      if (pisteB !== pisteA) return pisteB - pisteA;
      return a.name.localeCompare(b.name, "de-DE");
    });

    return NextResponse.json({
      results: scored,
      excluded,
      source: source.source,
      usingFallback: source.usingFallback,
      fallbackReason: source.fallbackReason,
      total: source.total,
      loaded: source.loaded,
      filteredOut: excluded.length,
      note: source.usingFallback
        ? "Supabase-Daten konnten nicht geladen werden oder waren leer. Matching nutzt sichtbar gekennzeichnete Fallback-Daten."
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    if (process.env.NODE_ENV !== "production") {
      console.error("[alpivo-match] match request failed", { error: message, stack });
    }
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
