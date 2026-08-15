import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/app/lib/supabaseAdmin";

type RouteContext = { params: Promise<{ id: string }> };
type CaseRecord = { id: string; firm_id: string; cnr_number: string | null; title: string | null; case_title: string | null; court_name: string | null; judge_name: string | null; current_stage: string | null; status: string | null; current_status: string | null; next_hearing_date: string | null; next_hearing: string | null; verification_status: string | null; last_synced_at: string | null; last_sync_status: string | null };
type CaseEvent = { type: string; title: string; description: string | null; occurred_at: string; source: string };

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function dateRisk(value: string | null) {
  if (!value) return "No hearing date has been recorded.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "The recorded hearing date is invalid.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "The recorded hearing date has passed; confirm the latest court listing.";
  if (days === 0) return "Hearing is today; confirm appearance, brief, and court listing.";
  if (days === 1) return "Hearing is tomorrow; confirm preparation and client communication.";
  if (days <= 7) return `Hearing is in ${days} days; preparation should be reviewed this week.`;
  return `Hearing is in ${days} days.`;
}

function reportFor(caseRecord: CaseRecord, events: CaseEvent[]) {
  const title = caseRecord.title || caseRecord.case_title || "Untitled matter";
  const status = caseRecord.status || caseRecord.current_status || "Not recorded";
  const hearing = caseRecord.next_hearing_date || caseRecord.next_hearing;
  const followUps = [dateRisk(hearing)];
  if (!caseRecord.cnr_number) followUps.push("Add the CNR number to enable court-status checks.");
  if (!caseRecord.court_name) followUps.push("Add the court name to complete the matter record.");
  if (!caseRecord.current_stage) followUps.push("Update the current procedural stage.");
  if (caseRecord.verification_status === "sync_failed") followUps.push("The last court sync failed; verify the matter against the official court source.");
  if (!caseRecord.last_synced_at) followUps.push("Run a court-status refresh or mark the matter as manually verified.");
  const recentActivity = events.length ? events.map((event) => {
    const detail = event.description ? ` — ${event.description}` : "";
    return `- ${formatDate(event.occurred_at)} · ${event.title}${detail}`;
  }).join("\n") : "- No timeline activity has been recorded yet.";
  return `# Case report\n\n## Matter overview\n- **Matter:** ${title}\n- **CNR:** ${caseRecord.cnr_number || "Not recorded"}\n- **Court:** ${caseRecord.court_name || "Not recorded"}\n- **Judge / bench:** ${caseRecord.judge_name || "Not recorded"}\n\n## Current procedural posture\n- **Status:** ${status}\n- **Stage:** ${caseRecord.current_stage || "Not recorded"}\n- **Verification:** ${(caseRecord.verification_status || "unverified").replaceAll("_", " ")}\n- **Last court check:** ${formatDate(caseRecord.last_synced_at)} (${(caseRecord.last_sync_status || "not recorded").replaceAll("_", " ")})\n\n## Upcoming dates and risks\n- **Next hearing:** ${formatDate(hearing)}\n- ${dateRisk(hearing)}\n\n## Recent activity\n${recentActivity}\n\n## Recommended follow-ups\n${followUps.map((item) => `- ${item}`).join("\n")}\n\n---\nThis system-generated report organizes the saved DocketHQ record. Review the court record before relying on it.`;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  if (!token) return NextResponse.json({ error: "Login required." }, { status: 401 });
  try {
    const supabase = createSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Your session has expired." }, { status: 401 });
    const { id: caseId } = await context.params;
    const { data: caseRecord, error: caseError } = await supabase.from("cases").select("id,firm_id,cnr_number,title,case_title,court_name,judge_name,current_stage,status,current_status,next_hearing_date,next_hearing,verification_status,last_synced_at,last_sync_status").eq("id", caseId).single();
    if (caseError || !caseRecord?.firm_id) return NextResponse.json({ error: "Matter not found." }, { status: 404 });
    const { data: membership } = await supabase.from("firm_members").select("id").eq("firm_id", caseRecord.firm_id).eq("user_id", user.id).maybeSingle();
    if (!membership) return NextResponse.json({ error: "You do not have access to this matter." }, { status: 403 });
    const { data: events } = await supabase.from("case_events").select("type,title,description,occurred_at,source").eq("case_id", caseId).order("occurred_at", { ascending: false }).limit(15);
    return NextResponse.json({ report: reportFor(caseRecord as CaseRecord, (events || []) as CaseEvent[]), generatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Unable to generate the case report. Please try again." }, { status: 500 });
  }
}