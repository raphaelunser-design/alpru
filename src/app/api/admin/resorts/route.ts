import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureUniqueSlug(base: string) {
  let slug = base;
  let suffix = 2;
  while (true) {
    const { data, error } = await supabaseAdmin.from("resorts").select("id").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 500);
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
        "lat",
        "lon",
        "image_url",
        "hero_image_url",
        "hero_image_alt",
        "image_source",
        "image_credit",
        "image_license",
        "official_url",
        "piste_map_url",
        "skipass_url",
        "openskimap_url",
        "piste_km",
        "piste_km_total",
        "runs_count_total",
        "lifts_count_total",
        "elevation_min_m",
        "elevation_max_m",
        "vertical_m",
        "apres_score",
        "crowd_score",
        "infra_score",
        "hut_score",
        "park_score",
        "beginner_score",
        "advanced_score",
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
    query = query.or(`name.ilike.%${needle}%,slug.ilike.%${needle}%,country.ilike.%${needle}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0, offset, limit });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const baseSlug = body.slug ? String(body.slug).trim() : slugify(name);
  if (!baseSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const slug = await ensureUniqueSlug(baseSlug);

  const payload = {
    slug,
    name,
    country: body.country ?? null,
    region: body.region ?? null,
    lat: body.lat ?? null,
    lon: body.lon ?? null,
    image_url: body.image_url ?? null,
    hero_image_url: body.hero_image_url null,
    hero_image_alt: body.hero_image_alt null,
    image_source: body.image_source null,
    image_credit: body.image_credit null,
    image_license: body.image_license null,
    official_url: body.official_url null,
    piste_map_url: body.piste_map_url null,
    skipass_url: body.skipass_url null,
    openskimap_url: body.openskimap_url null,
    piste_km: body.piste_km null,
    piste_km_total: body.piste_km_total null,
    runs_count_total: body.runs_count_total null,
    lifts_count_total: body.lifts_count_total null,
    elevation_min_m: body.elevation_min_m null,
    elevation_max_m: body.elevation_max_m null,
    vertical_m: body.vertical_m null,
    apres_score: body.apres_score null,
    crowd_score: body.crowd_score null,
    infra_score: body.infra_score null,
    hut_score: body.hut_score null,
    park_score: body.park_score null,
    beginner_score: body.beginner_score null,
    advanced_score: body.advanced_score null,
    skipass_price_from: body.skipass_price_from null,
    skipass_price_currency: body.skipass_price_currency null,
    skipass_price_last_checked: body.skipass_price_last_checked null,
    skipass_price_note: body.skipass_price_note null,
  };

  const { data, error } = await supabaseAdmin.from("resorts").insert(payload).select("id,slug,name").maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const slug = String(body.slug || "").trim();

  if (!id && !slug) {
    return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });
  }

  const fields = [
    "name",
    "country",
    "region",
    "lat",
    "lon",
    "image_url",
    "hero_image_url",
    "hero_image_alt",
    "image_source",
    "image_credit",
    "image_license",
    "official_url",
    "piste_map_url",
    "skipass_url",
    "openskimap_url",
    "piste_km",
    "piste_km_total",
    "runs_count_total",
    "lifts_count_total",
    "elevation_min_m",
    "elevation_max_m",
    "vertical_m",
    "apres_score",
    "crowd_score",
    "infra_score",
    "hut_score",
    "park_score",
    "beginner_score",
    "advanced_score",
    "skipass_price_from",
    "skipass_price_currency",
    "skipass_price_last_checked",
    "skipass_price_note",
    "skipass_url",
  ];

  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field] === "" null : body[field];
    }
  }

  let update = supabaseAdmin.from("resorts").update(payload);
  update = id update.eq("id", id) : update.eq("slug", slug);

  const { data, error } = await update.select("id,slug,name").maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "").trim();
  const slug = String(searchParams.get("slug") || "").trim();

  if (!id && !slug) {
    return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });
  }

  let del = supabaseAdmin.from("resorts").delete();
  del = id del.eq("id", id) : del.eq("slug", slug);

  const { error } = await del;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
