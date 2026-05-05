import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CreateTripPayload = {
  title: string;
  description: string | null;
  startRegion: string | null;
  participantTarget: number | null;
  budgetPerPerson: number | null;
  skiLevel: "beginner" | "mixed" | "advanced";
  focus: string[];
  preferredResortSlugs: string[];
  dateOption:
    | {
        label: string;
        startDate: string;
        endDate: string;
        note: string | null;
      }
    | null;
};

function deriveDisplayName(email: string | null | undefined) {
  if (!email) return "Trip Lead";
  return email.split("@")[0].replace(/[._-]+/g, " ") || "Trip Lead";
}

function getAccessToken(req: Request) {
  return req.headers.get("authorization")?.replace("Bearer ", "").trim() || "";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function isValidIsoDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(req: Request) {
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

  let body: CreateTripPayload;
  try {
    body = (await req.json()) as CreateTripPayload;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const title = body.title.trim() || "";
  if (!title) {
    return NextResponse.json({ error: "Ein Titel ist erforderlich." }, { status: 400 });
  }

  const skiLevel = body.skiLevel === "beginner" || body.skiLevel === "advanced" ? body.skiLevel : "mixed";
  const focus = normalizeStringArray(body.focus);
  const preferredResortSlugs = normalizeStringArray(body.preferredResortSlugs);

  const participantTarget =
    typeof body.participantTarget === "number" && Number.isFinite(body.participantTarget) && body.participantTarget > 0
      ? Math.round(body.participantTarget)
      : null;
  const budgetPerPerson =
    typeof body.budgetPerPerson === "number" && Number.isFinite(body.budgetPerPerson) && body.budgetPerPerson >= 0
      ? body.budgetPerPerson
      : null;

  let createdTripId: string | null = null;
  let createdMemberId: string | null = null;

  try {
    const { data: tripRow, error: tripError } = await supabaseAdmin
      .from("ski_trips")
      .insert({
        title,
        description: body.description?.trim() || null,
        start_region: body.startRegion?.trim() || null,
        participant_target: participantTarget,
        budget_per_person: budgetPerPerson,
        ski_level: skiLevel,
        focus,
        preferred_resort_slugs: preferredResortSlugs,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (tripError || !tripRow) {
      return NextResponse.json({ error: tripError.message ?? "Trip konnte nicht erstellt werden." }, { status: 500 });
    }

    createdTripId = String(tripRow.id);

    const { data: memberRow, error: memberError } = await supabaseAdmin
      .from("ski_trip_members")
      .insert({
        trip_id: createdTripId,
        user_id: user.id,
        display_name: deriveDisplayName(user.email),
        email: user.email ?? null,
        role: "admin",
        status: "joined",
        joined_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (memberError || !memberRow) {
      throw new Error(memberError.message ?? "Mitglied konnte nicht angelegt werden.");
    }

    createdMemberId = String(memberRow.id);

    if (body.dateOption && isValidIsoDate(body.dateOption.startDate) && isValidIsoDate(body.dateOption.endDate)) {
      const { error: dateError } = await supabaseAdmin.from("ski_trip_date_options").insert({
        trip_id: createdTripId,
        label: body.dateOption.label.trim() || "Erstes Zeitfenster",
        start_date: body.dateOption.startDate,
        end_date: body.dateOption.endDate,
        note: body.dateOption.note?.trim() || null,
        created_by: user.id,
      });

      if (dateError) {
        throw new Error(dateError.message);
      }
    }

    return NextResponse.json({ tripId: createdTripId });
  } catch (error) {
    if (createdMemberId) {
      await supabaseAdmin.from("ski_trip_members").delete().eq("id", createdMemberId);
    }
    if (createdTripId) {
      await supabaseAdmin.from("ski_trips").delete().eq("id", createdTripId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Trip konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}
