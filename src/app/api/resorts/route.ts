import { NextResponse } from "next/server";
import { loadPublicResorts } from "@/lib/publicResortCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadPublicResorts();
  return NextResponse.json(result);
}
