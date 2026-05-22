import { NextResponse } from "next/server";

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

export async function POST() {
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
