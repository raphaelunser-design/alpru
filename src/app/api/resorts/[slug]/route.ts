import { NextResponse } from "next/server";
import { loadResortDetailRow } from "@/lib/resortRepository";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await loadResortDetailRow(supabaseAdmin, decodeURIComponent(slug));

  if (!result.resort) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
