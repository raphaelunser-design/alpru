import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "all";
  const status = searchParams.get("status") ?? "all";

  let query = supabaseAdmin
    .from("beta_feedback")
    .select("id,user_id,user_email,category,message,page_path,user_agent,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (category !== "all") query = query.eq("category", category);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { id: string; status: string };
  if (!body.id || !["new", "reviewed", "done", "archived"].includes(body.status ?? "")) {
    return NextResponse.json({ error: "Ungültiger Feedback-Status." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("beta_feedback").update({ status: body.status }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
