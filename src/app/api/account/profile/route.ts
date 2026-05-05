import { NextResponse } from "next/server";
import { ensureProfileForUser, updateProfileName } from "@/lib/profiles";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function bearerToken(req: Request) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

async function getRequestUser(req: Request) {
  const token = bearerToken(req);
  if (!token) return { user: null, error: "Nicht eingeloggt." };
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { user: null, error: "Session ist abgelaufen. Bitte erneut anmelden." };
  return { user: data.user, error: null };
}

export async function GET(req: Request) {
  const { user, error } = await getRequestUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const profile = await ensureProfileForUser(user);
  const { data: feedback } = await supabaseAdmin
    .from("beta_feedback")
    .select("id,category,feedback_type,message,page_path,page_url,status,rating,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return NextResponse.json({
    profile,
    user: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
    },
    feedback: feedback ?? [],
  });
}

export async function PATCH(req: Request) {
  const { user, error } = await getRequestUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { displayName?: string };
  try {
    await ensureProfileForUser(user);
    const profile = await updateProfileName(user.id, String(body.displayName || ""));
    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Profil konnte nicht gespeichert werden.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
