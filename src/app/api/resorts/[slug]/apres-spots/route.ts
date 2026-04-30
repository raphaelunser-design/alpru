import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ slug: string }>;
};

const APRES_SELECT = [
  "id",
  "resort_slug",
  "name",
  "venue_type",
  "rank",
  "village",
  "address",
  "vibe_label",
  "best_for",
  "opening_note",
  "price_level",
  "website_url",
  "maps_url",
  "booking_url",
  "source_url",
  "source_label",
  "last_checked",
  "note",
].join(",");

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const safeSlug = decodeURIComponent(slug || "").trim();

  if (!safeSlug) {
    return NextResponse.json({ spots: [], configured: false });
  }

  const { data, error } = await supabaseAdmin
    .from("resort_apres_spots")
    .select(APRES_SELECT)
    .eq("resort_slug", safeSlug)
    .order("rank", { ascending: true })
    .order("name", { ascending: true })
    .limit(8);

  if (error) {
    const missingTable =
      error.message.includes("resort_apres_spots") ||
      error.message.includes("schema cache") ||
      error.code === "PGRST205";
    if (missingTable) {
      return NextResponse.json({
        spots: [],
        configured: false,
        hint: "Die Après-Ski-Adresstabelle ist noch nicht in Supabase angelegt.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ spots: data ?? [], configured: true });
}
