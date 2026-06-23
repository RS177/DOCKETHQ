import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/app/lib/supabaseAdmin";

type WaitlistPayload = {
  name?: string;
  email?: string;
  city?: string;
  practice_type?: string;
  source?: string;
  website?: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as WaitlistPayload;

  if (payload.website) {
    return NextResponse.json({ ok: true });
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const city = payload.city?.trim() || null;
  const practiceType = payload.practice_type?.trim() || null;

  if (!name || !email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Add a valid name and email." },
      { status: 400 }
    );
  }

  let supabase;

  try {
    supabase = createSupabaseAdmin();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Server is not configured to save waitlist leads.",
      },
      { status: 500 }
    );
  }

  const { error } = await supabase.from("waitlist").upsert(
    {
      name,
      email,
      city,
      practice_type: practiceType,
      source: payload.source || "landing",
      user_agent: request.headers.get("user-agent"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    const missingTable =
      error.message.includes("waitlist_leads") ||
      error.message.toLowerCase().includes("does not exist");

    return NextResponse.json(
      {
        error: missingTable
          ? "Waitlist table is not set up yet. Run the Supabase waitlist SQL patch."
          : error.message || "Could not save waitlist lead.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
