import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const COOKIE_NAME = "dockethq_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function cookieOptions() {
  return {
    httpOnly: true,
    maxAge: THIRTY_DAYS,
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    return NextResponse.json(
      { error: "A verified login session is required." },
      { status: 401 }
    );
  }

  const supabase = createSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json(
      { error: "Login session could not be verified." },
      { status: 401 }
    );
  }

  const response = new NextResponse(null, { status: 204 });

  response.cookies.set(COOKIE_NAME, "active", cookieOptions());
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });

  response.cookies.set(COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}
