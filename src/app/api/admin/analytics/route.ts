import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

async function countFrom(table: string, options: { since?: string; statusIn?: string[] } = {}) {
  let query = supabaseAdmin.from(table).select("id", { count: "exact", head: true });
  if (options.since) query = query.gte("created_at", options.since) as typeof query;
  if (options.statusIn?.length) query = query.in("status", options.statusIn) as typeof query;
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const today = startOfTodayIso();
    const sevenDays = isoDaysAgo(7);
    const thirtyDays = isoDaysAgo(30);

    const [
      totalPageViews,
      pageViewsToday,
      pageViews7d,
      pageViews30d,
      totalUsers,
      newUsers7d,
      totalFeedback,
      openFeedback,
      recentEventsResult,
      recentUsersResult,
      recentFeedbackResult,
      eventRowsResult,
    ] = await Promise.all([
      countFrom("page_events"),
      countFrom("page_events", { since: today }),
      countFrom("page_events", { since: sevenDays }),
      countFrom("page_events", { since: thirtyDays }),
      countFrom("profiles"),
      countFrom("profiles", { since: sevenDays }),
      countFrom("beta_feedback"),
      countFrom("beta_feedback", { statusIn: ["new", "reviewed", "planned"] }),
      supabaseAdmin
        .from("page_events")
        .select("id,user_id,user_email,path,referrer,event_type,session_id,device_type,browser,created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("profiles")
        .select("id,email,display_name,role,created_at,last_seen_at")
        .order("created_at", { ascending: false })
        .limit(12),
      supabaseAdmin
        .from("beta_feedback")
        .select("id,user_id,user_email,display_name,category,feedback_type,message,page_path,page_url,status,created_at")
        .order("created_at", { ascending: false })
        .limit(12),
      supabaseAdmin
        .from("page_events")
        .select("path,created_at,user_id,session_id")
        .gte("created_at", thirtyDays)
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    for (const result of [recentEventsResult, recentUsersResult, recentFeedbackResult, eventRowsResult]) {
      if (result.error) throw new Error(result.error.message);
    }

    const eventRows = eventRowsResult.data ?? [];
    const topPageMap = new Map<string, number>();
    const seriesMap = new Map<string, number>();
    const uniqueSessions = new Set<string>();
    const activeUsers = new Set<string>();

    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      seriesMap.set(key, 0);
    }

    for (const row of eventRows) {
      const path = String(row.path || "/");
      topPageMap.set(path, (topPageMap.get(path) || 0) + 1);
      const day = String(row.created_at || "").slice(0, 10);
      if (seriesMap.has(day)) seriesMap.set(day, (seriesMap.get(day) || 0) + 1);
      if (row.session_id) uniqueSessions.add(String(row.session_id));
      if (row.user_id) activeUsers.add(String(row.user_id));
    }

    const topPages = Array.from(topPageMap.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const timeSeries = Array.from(seriesMap.entries()).map(([date, views]) => ({ date, views }));

    return NextResponse.json({
      kpis: {
        totalPageViews,
        pageViewsToday,
        pageViews7d,
        pageViews30d,
        totalUsers,
        newUsers7d,
        totalFeedback,
        openFeedback,
        uniqueSessions30d: uniqueSessions.size,
        activeUsers30d: activeUsers.size,
      },
      topPages,
      timeSeries,
      recentEvents: recentEventsResult.data ?? [],
      recentUsers: recentUsersResult.data ?? [],
      recentFeedback: recentFeedbackResult.data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analytics konnten nicht geladen werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
