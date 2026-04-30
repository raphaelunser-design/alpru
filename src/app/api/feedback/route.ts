import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const categories = new Set(["bug", "feature", "feedback"]);

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      category: string;
      message: string;
      pagePath: string;
    };

    const category = categories.has(body.category ?? "") ? body.category! : "feedback";
    const message = cleanText(body.message, 2000);
    const pagePath = cleanText(body.pagePath, 300);

    if (message.length < 3) {
      return NextResponse.json({ error: "Bitte etwas Feedback eingeben." }, { status: 400 });
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      userId = data.user?.id ?? null;
      userEmail = data.user?.email ?? null;
    }

    const { error } = await supabaseAdmin.from("beta_feedback").insert({
      user_id: userId,
      user_email: userEmail,
      category,
      message,
      page_path: pagePath || null,
      user_agent: cleanText(req.headers.get("user-agent"), 500) || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feedback konnte nicht gespeichert werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
