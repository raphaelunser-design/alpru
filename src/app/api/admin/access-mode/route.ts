import { NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/adminAuth";
import { getAccessMode, updateAccessMode } from "@/lib/accessMode";
import { normalizeAccessMode } from "@/lib/accessModeShared";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const status = await getAdminStatus(req);
  if (!status.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAccessMode();
  return NextResponse.json(access);
}

export async function PUT(req: Request) {
  const status = await getAdminStatus(req);
  if (!status.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const mode = normalizeAccessMode(body.mode);
  if (!mode) return NextResponse.json({ error: "Mode must be public or private" }, { status: 400 });

  try {
    const data = await updateAccessMode(mode, status.email);
    return NextResponse.json({
      mode,
      source: "supabase",
      updatedAt: data.updated_at ?? null,
      updatedBy: data.updated_by ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access mode could not be updated";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
