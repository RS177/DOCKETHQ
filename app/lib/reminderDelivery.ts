export type ReminderChannel = "email" | "sms";

export type ReminderMessage = {
  channel: ReminderChannel;
  to: string;
  title: string;
  body: string;
};

type DeliveryResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

async function sendEmailReminder(message: ReminderMessage): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL || "Dockethq <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.title,
      text: message.body,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };

    return {
      ok: false,
      error: payload.message || payload.error || "Email provider rejected the reminder.",
    };
  }

  return { ok: true };
}

async function sendSmsReminder(message: ReminderMessage): Promise<DeliveryResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      ok: false,
      error:
        "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER is not configured.",
    };
  }

  const form = new URLSearchParams({
    From: fromNumber,
    To: message.to,
    Body: `${message.title}\n\n${message.body}`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
          "base64"
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    }
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
    };

    return {
      ok: false,
      error: payload.message || "SMS provider rejected the reminder.",
    };
  }

  return { ok: true };
}

export async function sendReminder(message: ReminderMessage) {
  if (message.channel === "email") {
    return sendEmailReminder(message);
  }

  return sendSmsReminder(message);
}
