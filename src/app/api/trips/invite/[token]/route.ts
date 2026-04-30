import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function deriveDisplayName(email: string | null | undefined) {
  if (!email) return "Trip Member";
  return email.split("@")[0].replace(/[._-]+/g, " ") || "Trip Member";
}

function getAccessToken(req: Request) {
  return req.headers.get("authorization").replace("Bearer ", "").trim() || "";
}

export async function GET(_req: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const inviteToken = decodeURIComponent(token);

  const { data: invite, error } = await supabaseAdmin
    .from("ski_trip_invites")
    .select("id,trip_id,email,role,note,status,expires_at")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json({ error: "Invite nicht gefunden." }, { status: 404 });
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite ist abgelaufen." }, { status: 410 });
  }

  const { data: trip } = await supabaseAdmin.from("ski_trips").select("title").eq("id", invite.trip_id).maybeSingle();

  return NextResponse.json({
    tripTitle: trip?.title ?? "Ski Trip",
    email: invite.email,
    role: invite.role === "admin" ? "admin" : "member",
    note: invite.note,
    status: invite.status === "joined" || invite.status === "open" ? invite.status : "invited",
  });
}

export async function POST(req: Request, context: { params: Promise<{ token: string }> }) {
  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return NextResponse.json({ error: "Login erforderlich." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Session konnte nicht verifiziert werden." }, { status: 401 });
  }

  const { token } = await context.params;
  const inviteToken = decodeURIComponent(token);

  const { data: invite, error } = await supabaseAdmin
    .from("ski_trip_invites")
    .select("id,trip_id,email,role,note,status,expires_at")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json({ error: "Invite nicht gefunden." }, { status: 404 });
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite ist abgelaufen." }, { status: 410 });
  }

  if (invite.email && invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return NextResponse.json({ error: "Dieser Invite ist für eine andere E-Mail gedacht." }, { status: 403 });
  }

  const { data: existingMember } = await supabaseAdmin
    .from("ski_trip_members")
    .select("id,role")
    .eq("trip_id", invite.trip_id)
    .eq("user_id", user.id)
    .maybeSingle();

  let memberId = existingMember?.id ?? null;

  if (existingMember) {
    const { error: updateMemberError } = await supabaseAdmin
      .from("ski_trip_members")
      .update({
        role: invite.role === "admin" ? "admin" : existingMember.role,
        status: "joined",
        joined_at: new Date().toISOString(),
        email: user.email ?? invite.email,
      })
      .eq("id", existingMember.id);

    if (updateMemberError) {
      return NextResponse.json({ error: updateMemberError.message }, { status: 500 });
    }
  } else {
    const { data: insertedMember, error: insertMemberError } = await supabaseAdmin
      .from("ski_trip_members")
      .insert({
        trip_id: invite.trip_id,
        user_id: user.id,
        display_name: deriveDisplayName(user.email),
        email: user.email ?? invite.email,
        role: invite.role === "admin" ? "admin" : "member",
        status: "joined",
        joined_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertMemberError || !insertedMember) {
      return NextResponse.json({ error: insertMemberError.message ?? "Mitglied konnte nicht angelegt werden." }, { status: 500 });
    }

    memberId = insertedMember.id;
  }

  const { error: inviteUpdateError } = await supabaseAdmin
    .from("ski_trip_invites")
    .update({ status: "joined" })
    .eq("id", invite.id);

  if (inviteUpdateError) {
    return NextResponse.json({ error: inviteUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ tripId: invite.trip_id, memberId });
}
