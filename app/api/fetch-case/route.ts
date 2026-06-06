import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { fetchCourtCase } from "../../lib/courtScraper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function privateJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, noarchive, noimageindex");
  return response;
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";

    if (!token) {
      return privateJson(
        {
          success: false,
          error: "Log in before checking a CNR.",
          code: "UNAUTHORIZED",
          data: null,
        },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdmin();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return privateJson(
        {
          success: false,
          error: "Your session could not be verified. Log in again.",
          code: "UNAUTHORIZED",
          data: null,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const cnr = typeof body.cnr === "string" ? body.cnr : "";

    const result = await fetchCourtCase(cnr);

    if (!result.success) {
      return privateJson(result, { status: 400 });
    }

    return privateJson(result);
  } catch (error) {
    console.error(error);

    return privateJson(
      {
        success: false,
        error: "Failed to fetch case data",
      },
      { status: 500 }
    );
  }
}
