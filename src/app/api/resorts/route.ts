import { NextResponse } from "next/server";
import { loadAllResortRows } from "@/lib/resortRepository";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadAllResortRows(supabaseAdmin, { orderBy: "name" });
  return NextResponse.json(result);
}
