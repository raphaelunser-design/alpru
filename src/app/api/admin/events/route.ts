import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const quality = (searchParams.get("quality") || "all").trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 100), 1), 300);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

  let query = supabaseAdmin
    .from("resort_events")
    .select(
      [
        "id",
        "resort_id",
        "name",
        "event_type",
        "music_genres",
        "vibe_tags",
        "start_date",
        "end_date",
        "recurring_month",
        "location_name",
        "altitude_m",
        "ticket_required",
        "ticket_price_from",
        "official_url",
        "short_description",
        "best_for",
        "not_ideal_for",
        "data_quality",
        "last_checked_at",
        "resorts(name,slug,country,region)",
      ].join(","),
      { count: "exact" }
    )
    .order("start_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (quality && quality !== "all") {
    query = query.eq("data_quality", quality);
  }

  if (q) {
    const needle = q.replace(/[%_]/g, "");
    query = query.or(`name.ilike.%${needle}%,event_type.ilike.%${needle}%,location_name.ilike.%${needle}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    count: count ?? 0,
    offset,
    limit,
  });
}
