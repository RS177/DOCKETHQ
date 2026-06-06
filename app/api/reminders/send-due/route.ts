import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { sendReminder, type ReminderChannel } from "@/app/lib/reminderDelivery";

type DueReminder = {
  id: string;
  firm_id: string;
  case_id: string | null;
  title: string;
  remind_at: string;
  channel: ReminderChannel | "in_app" | "whatsapp";
  recipient_email: string | null;
  recipient_phone: string | null;
  cases?: {
    title?: string | null;
    case_title?: string | null;
    cnr_number?: string | null;
    court_name?: string | null;
    next_hearing_date?: string | null;
    next_hearing?: string | null;
  } | null;
};

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret && process.env.NODE_ENV !== "production") {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function caseTitle(reminder: DueReminder) {
  return (
    reminder.cases?.title ||
    reminder.cases?.case_title ||
    "Tracked matter"
  );
}

function hearingDate(reminder: DueReminder) {
  return reminder.cases?.next_hearing_date || reminder.cases?.next_hearing || null;
}

function formatDate(value: string | null) {
  if (!value) return "Not listed";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function reminderBody(reminder: DueReminder) {
  const title = caseTitle(reminder);
  const date = formatDate(hearingDate(reminder));
  const court = reminder.cases?.court_name || "Court not listed";

  return [
    `${reminder.title}`,
    "",
    `Case: ${title}`,
    `Court: ${court}`,
    `Next hearing: ${date}`,
    "",
    "Open DocketHQ to review the matter before the hearing.",
  ].join("\n");
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;

  try {
    supabase = createSupabaseAdmin();
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server is not configured.",
      },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("reminders")
    .select(
      `
      id,
      firm_id,
      case_id,
      title,
      remind_at,
      channel,
      recipient_email,
      recipient_phone,
      cases (
        title,
        case_title,
        cnr_number,
        court_name,
        next_hearing_date,
        next_hearing
      )
    `
    )
    .eq("status", "scheduled")
    .lte("remind_at", new Date().toISOString())
    .in("channel", ["email", "sms"])
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reminders = (data || []) as DueReminder[];
  const results = [];

  for (const reminder of reminders) {
    const recipient =
      reminder.channel === "email"
        ? reminder.recipient_email
        : reminder.recipient_phone;

    if (!recipient) {
      await supabase
        .from("reminders")
        .update({
          status: "failed",
          delivery_error: "No recipient configured for this reminder.",
        })
        .eq("id", reminder.id);

      results.push({
        id: reminder.id,
        status: "failed",
        error: "No recipient configured.",
      });
      continue;
    }

    const delivery = await sendReminder({
      channel: reminder.channel as ReminderChannel,
      to: recipient,
      title: reminder.title,
      body: reminderBody(reminder),
    });

    if (delivery.ok) {
      await supabase
        .from("reminders")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          delivery_error: null,
        })
        .eq("id", reminder.id);

      await supabase.from("notifications").insert({
        firm_id: reminder.firm_id,
        case_id: reminder.case_id,
        channel: reminder.channel,
        title: reminder.title,
        body: reminderBody(reminder),
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      results.push({ id: reminder.id, status: "sent" });
      continue;
    }

    await supabase
      .from("reminders")
      .update({
        status: "failed",
        delivery_error: delivery.error,
      })
      .eq("id", reminder.id);

    results.push({
      id: reminder.id,
      status: "failed",
      error: delivery.error,
    });
  }

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    processed: reminders.length,
    results,
  });
}
