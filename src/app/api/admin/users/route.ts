import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id,email,display_name,avatar_url,role,created_at,updated_at,last_seen_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  const userIds = (profiles ?? []).map((profile) => profile.id).filter(Boolean);
  const feedbackCounts = new Map<string, number>();
  const pageCounts = new Map<string, number>();

  if (userIds.length) {
    const [{ data: feedbackRows }, { data: pageRows }] = await Promise.all([
      supabaseAdmin.from("beta_feedback").select("user_id").in("user_id", userIds).limit(10000),
      supabaseAdmin.from("page_events").select("user_id").in("user_id", userIds).limit(10000),
    ]);

    for (const row of feedbackRows ?? []) {
      if (row.user_id) feedbackCounts.set(row.user_id, (feedbackCounts.get(row.user_id) || 0) + 1);
    }
    for (const row of pageRows ?? []) {
      if (row.user_id) pageCounts.set(row.user_id, (pageCounts.get(row.user_id) || 0) + 1);
    }
  }

  return NextResponse.json({
    data: (profiles ?? []).map((profile) => ({
      ...profile,
      feedback_count: feedbackCounts.get(profile.id) || 0,
      page_event_count: pageCounts.get(profile.id) || 0,
    })),
  });
}
