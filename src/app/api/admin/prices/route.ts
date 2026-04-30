import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 200), 1), 1000);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

  let query = supabaseAdmin
    .from("resorts")
    .select(
      [
        "id",
        "slug",
        "name",
        "country",
        "region",
        "skipass_url",
        "skipass_price_from",
        "skipass_price_currency",
        "skipass_price_last_checked",
        "skipass_price_note",
      ].join(","),
      { count: "exact" }
    )
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) {
    const needle = q.replace(/[%_]/g, "");
    query = query.or(`name.ilike.%${needle}%,slug.ilike.%${needle}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0, offset, limit });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "").trim();
  const id = String(body.id || "").trim();

  if (!slug && !id) {
    return NextResponse.json({ error: "Missing slug or id" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  const fields = [
    "skipass_price_from",
    "skipass_price_currency",
    "skipass_price_last_checked",
    "skipass_price_note",
    "skipass_url",
  ];

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field] === "" ? null : body[field];
    }
  }

  if (payload.skipass_price_from !== undefined && payload.skipass_price_from !== null) {
    const price = Number(payload.skipass_price_from);
    payload.skipass_price_from = Number.isFinite(price) ? price : null;
  }

  let update = supabaseAdmin.from("resorts").update(payload);
  update = id ? update.eq("id", id) : update.eq("slug", slug);

  const { data, error } = await update
    .select("id,slug,name,skipass_price_from,skipass_price_currency,skipass_price_last_checked,skipass_price_note,skipass_url")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
