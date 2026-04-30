import { NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const status = await getAdminStatus(req);
  return NextResponse.json(status, { status: status.isAdmin ? 200 : 403 });
}
