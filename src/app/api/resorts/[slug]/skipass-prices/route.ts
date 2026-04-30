import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ slug: string }>;
};

const PRICE_SELECT = [
  "id",
  "resort_slug",
  "ticket_name",
  "ticket_category",
  "age_group",
  "age_label",
  "min_age",
  "max_age",
  "season_label",
  "valid_from",
  "valid_to",
  "currency",
  "price",
  "price_type",
  "source_url",
  "source_label",
  "affiliate_url",
  "last_checked",
  "note",
].join(",");

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const safeSlug = decodeURIComponent(slug || "").trim();

  if (!safeSlug) {
    return NextResponse.json({ prices: [], configured: false });
  }

  const { data, error } = await supabaseAdmin
    .from("resort_skipass_prices")
    .select(PRICE_SELECT)
    .eq("resort_slug", safeSlug)
    .order("ticket_category", { ascending: true })
    .order("ticket_name", { ascending: true })
    .order("age_group", { ascending: true })
    .order("price", { ascending: true });

  if (error) {
    const missingTable =
      error.message.includes("resort_skipass_prices") ||
      error.message.includes("schema cache") ||
      error.code === "PGRST205";
    if (missingTable) {
      return NextResponse.json({
        prices: [],
        configured: false,
        hint: "Die neue Preis-Kategorietabelle ist noch nicht in Supabase angelegt.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prices: data ?? [], configured: true });
}
