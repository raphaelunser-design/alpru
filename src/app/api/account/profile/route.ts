import { NextResponse } from "next/server";
import { getUserFromAccessToken } from "@/lib/authUser";
import { buildMatchPayload, buildResortQuery } from "@/lib/matching/matchPayload";
import { ensureProfileForUser, updateProfileName } from "@/lib/profiles";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ProfilePatchBody = {
  displayName?: string;
  preferences?: unknown;
  filters?: unknown;
  exclusions?: unknown;
};

function bearerToken(req: Request) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

async function getRequestUser(req: Request) {
  const token = bearerToken(req);
  if (!token) return { user: null, error: "Nicht eingeloggt." };
  const user = await getUserFromAccessToken(token);
  if (!user) return { user: null, error: "Session ist abgelaufen. Bitte erneut anmelden." };
  return { user, error: null };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function compactLastResults(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).map((entry) => {
    const row = asRecord(entry);
    return {
      id: String(row.id || ""),
      slug: String(row.slug || ""),
      name: String(row.name || ""),
      country: String(row.country || ""),
      region: typeof row.region === "string" ? row.region : null,
      matchPct: Number.isFinite(Number(row.matchPct)) ? Number(row.matchPct) : 0,
      budgetStatus: typeof row.budgetStatus === "string" ? row.budgetStatus : null,
      tripStyleHint: typeof row.tripStyleHint === "string" ? row.tripStyleHint : null,
      pisteKm: Number.isFinite(Number(row.pisteKm)) ? Number(row.pisteKm) : null,
      reasons: Array.isArray(row.reasons) ? row.reasons.filter((item): item is string => typeof item === "string").slice(0, 3) : [],
    };
  }).filter((entry) => entry.id && entry.slug && entry.name);
}

export async function GET(req: Request) {
  const { user, error } = await getRequestUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const profile = await ensureProfileForUser(user);
  const [feedbackResult, preferencesResult] = await Promise.all([
    supabaseAdmin
      .from("beta_feedback")
      .select("id,category,feedback_type,message,page_path,page_url,status,rating,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("profile_preferences")
      .select("preferences,filters,exclusions,updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    profile,
    preferences: preferencesResult.data ?? null,
    user: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
    },
    feedback: feedbackResult.data ?? [],
  });
}

export async function PATCH(req: Request) {
  const { user, error } = await getRequestUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as ProfilePatchBody;
  let profile: Awaited<ReturnType<typeof ensureProfileForUser>> = null;
  let preferences = null;
  try {
    profile = await ensureProfileForUser(user);
    if (typeof body.displayName === "string") {
      profile = await updateProfileName(user.id, body.displayName);
    }

    if ("preferences" in body || "filters" in body || "exclusions" in body) {
      const exclusions = asRecord(body.exclusions);
      const lastResults = compactLastResults(exclusions.lastResults);
      const lastExcludedCount = Number.isFinite(Number(exclusions.lastExcludedCount)) ? Number(exclusions.lastExcludedCount) : 0;
      const { data, error: preferencesError } = await supabaseAdmin
        .from("profile_preferences")
        .upsert(
          {
            user_id: user.id,
            preferences: buildMatchPayload(body.preferences),
            filters: buildResortQuery(body.filters),
            exclusions: {
              ...exclusions,
              lastResults,
              lastExcludedCount,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select("preferences,filters,exclusions,updated_at")
        .maybeSingle();

      if (preferencesError) throw new Error(preferencesError.message);
      preferences = data ?? null;
    }

    return NextResponse.json({ profile, preferences });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Konto konnte nicht gespeichert werden.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
