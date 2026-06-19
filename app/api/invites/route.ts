import { NextRequest, NextResponse } from "next/server";
import { canInviteMember } from "@/app/lib/billing";
import { createSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const INVITE_ROLES = new Set(["lawyer", "associate", "admin"]);
const OWNER_ROLES = new Set(["owner", "admin"]);

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    return NextResponse.json(
      { error: "Log in before inviting a team member." },
      { status: 401 }
    );
  }

  const payload = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: string;
  };
  const email = payload.email?.trim().toLowerCase();
  const role = payload.role?.trim().toLowerCase() || "lawyer";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (!INVITE_ROLES.has(role)) {
    return NextResponse.json(
      { error: "Choose a valid team role." },
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
            : "Server is not configured to create firm invites.",
      },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Could not verify signed-in user." },
      { status: 401 }
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("firm_members")
    .select("id,firm_id,role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (memberError || !member?.firm_id) {
    return NextResponse.json(
      { error: "No firm workspace was found for this account." },
      { status: 403 }
    );
  }

  if (!OWNER_ROLES.has(member.role)) {
    return NextResponse.json(
      { error: "Only firm owners and admins can invite team members." },
      { status: 403 }
    );
  }

  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .select("id,name,plan_type")
    .eq("id", member.firm_id)
    .maybeSingle();

  if (firmError || !firm) {
    return NextResponse.json(
      { error: "Firm workspace could not be loaded." },
      { status: 404 }
    );
  }

  if (firm.plan_type !== "enterprise") {
    return NextResponse.json(
      { error: "Team invites are included in the Rs 999 Custom Workflow plan." },
      { status: 402 }
    );
  }

  const [{ count: memberCount }, { count: pendingInviteCount }] =
    await Promise.all([
      supabase
        .from("firm_members")
        .select("id", { count: "exact", head: true })
        .eq("firm_id", firm.id),
      supabase
        .from("firm_invites")
        .select("id", { count: "exact", head: true })
        .eq("firm_id", firm.id)
        .eq("status", "pending"),
    ]);

  if (!canInviteMember(firm.plan_type, (memberCount || 0) + (pendingInviteCount || 0))) {
    return NextResponse.json(
      {
        error:
          "Custom Workflow includes up to 5 users. Extra users can be added at Rs 97/user/month.",
      },
      { status: 409 }
    );
  }

  const { data: invite, error: inviteError } = await supabase
    .from("firm_invites")
    .insert({
      firm_id: firm.id,
      email,
      role,
      invited_by: user.id,
    })
    .select("id,email,role,status,created_at")
    .single();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: inviteError?.message || "Could not create invite." },
      { status: 500 }
    );
  }

  const inviteLink = new URL(`/invite/${invite.id}`, request.url).toString();
  const emailResult = await sendInviteEmail({
    email,
    firmName: firm.name || "your firm",
    inviteLink,
    role,
  });

  return NextResponse.json({
    invite,
    invite_link: inviteLink,
    email_sent: emailResult.ok,
    email_error: emailResult.ok ? null : emailResult.error,
  });
}

async function sendInviteEmail({
  email,
  firmName,
  inviteLink,
  role,
}: {
  email: string;
  firmName: string;
  inviteLink: string;
  role: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.INVITE_FROM_EMAIL ||
    process.env.REMINDER_FROM_EMAIL ||
    "DocketHQ <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  const title = `You're invited to join ${firmName} on DocketHQ`;
  const text = [
    `${firmName} invited you to DocketHQ as ${role}.`,
    "",
    "Open this secure invite link to join the workspace:",
    inviteLink,
    "",
    "DocketHQ keeps case tracking, reminders, and firm workflow history in one place.",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: title,
      text,
      html: buildInviteHtml({ firmName, inviteLink, role }),
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };

    return {
      ok: false,
      error: payload.message || payload.error || "Email provider rejected the invite.",
    };
  }

  return { ok: true };
}

function buildInviteHtml({
  firmName,
  inviteLink,
  role,
}: {
  firmName: string;
  inviteLink: string;
  role: string;
}) {
  return `
    <div style="margin:0;background:#f8f7f4;padding:32px;font-family:Inter,Arial,sans-serif;color:#0a0f1e;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8dfcf;border-radius:18px;overflow:hidden;">
        <div style="background:#0a0f1e;color:#ffffff;padding:28px 32px;">
          <p style="margin:0 0 10px;color:#d4a843;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">DocketHQ Invite</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Join ${escapeHtml(firmName)}</h1>
        </div>
        <div style="padding:30px 32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">You have been invited as <strong>${escapeHtml(role)}</strong> on DocketHQ.</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4a5568;">Use this secure link to join the firm workspace and start tracking cases, hearings, and reminders with the team.</p>
          <a href="${inviteLink}" style="display:inline-block;background:#0a0f1e;color:#ffffff;text-decoration:none;padding:14px 18px;border-radius:12px;font-weight:700;">Accept invite</a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#64748b;">If the button does not work, paste this link into your browser:<br>${inviteLink}</p>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
