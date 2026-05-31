import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/app/lib/supabaseAdmin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { data: invite, error } = await supabase
    .from("firm_invites")
    .select("id,email,role,status,created_at,firm_id,firms(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json(
      { error: "Invite not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    created_at: invite.created_at,
    firm_name: firmNameFromInvite(invite),
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    return NextResponse.json(
      { error: "Log in before accepting this invite." },
      { status: 401 }
    );
  }

  const supabase = createSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user?.email) {
    return NextResponse.json(
      { error: "Could not verify signed-in user." },
      { status: 401 }
    );
  }

  const { data: invite, error: inviteError } = await supabase
    .from("firm_invites")
    .select("id,email,role,status,firm_id,firms(name)")
    .eq("id", id)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invite not found." },
      { status: 404 }
    );
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: "This invite is no longer pending." },
      { status: 409 }
    );
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `This invite was sent to ${invite.email}. Log in with that email to accept it.`,
      },
      { status: 403 }
    );
  }

  const { data: existingMember } = await supabase
    .from("firm_members")
    .select("id")
    .eq("firm_id", invite.firm_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: memberError } = await supabase.from("firm_members").insert({
      firm_id: invite.firm_id,
      user_id: user.id,
      role: invite.role,
      display_name:
        user.user_metadata?.full_name ||
        user.email.split("@")[0] ||
        "Team member",
    });

    if (memberError) {
      return NextResponse.json(
        { error: memberError.message || "Could not add user to firm." },
        { status: 500 }
      );
    }
  }

  await supabase
    .from("firm_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  await cleanupFreshSoloWorkspace(supabase, user.id, invite.firm_id);

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      firm_name: firmNameFromInvite(invite),
      practice_type: "firm",
    },
  });

  return NextResponse.json({
    ok: true,
    firm_id: invite.firm_id,
    firm_name: firmNameFromInvite(invite),
  });
}

function firmNameFromInvite(invite: { firms?: unknown }) {
  const firms = invite.firms;

  if (Array.isArray(firms)) {
    return firms[0]?.name || "Firm workspace";
  }

  if (firms && typeof firms === "object" && "name" in firms) {
    return String((firms as { name?: string }).name || "Firm workspace");
  }

  return "Firm workspace";
}

async function cleanupFreshSoloWorkspace(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  acceptedFirmId: string
) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: ownerMemberships } = await supabase
    .from("firm_members")
    .select("firm_id,firms(id,practice_type,created_at)")
    .eq("user_id", userId)
    .eq("role", "owner");

  for (const membership of ownerMemberships || []) {
    const firm = Array.isArray(membership.firms)
      ? membership.firms[0]
      : membership.firms;

    if (!firm || membership.firm_id === acceptedFirmId) continue;
    if (firm.practice_type !== "solo") continue;
    if (firm.created_at < oneHourAgo) continue;

    const { count } = await supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", membership.firm_id);

    if (!count) {
      await supabase.from("firms").delete().eq("id", membership.firm_id);
    }
  }
}
