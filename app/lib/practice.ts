export type PracticeType = "solo" | "firm";

export function normalizePracticeType(value?: string | null): PracticeType {
  return value === "firm" ? "firm" : "solo";
}

export function practiceLabel(value?: string | null) {
  return normalizePracticeType(value) === "firm" ? "Firm practice" : "Solo practice";
}

export function workspaceLabel(value?: string | null) {
  return normalizePracticeType(value) === "firm" ? "Firm workspace" : "Solo workspace";
}

export function effectivePracticeType(
  practiceType?: string | null,
  planType?: string | null
): PracticeType {
  if (planType === "enterprise") {
    return "firm";
  }

  return normalizePracticeType(practiceType);
}

export function dashboardCopy(value?: string | null) {
  const practiceType = normalizePracticeType(value);

  if (practiceType === "firm") {
    return {
      badge: "Firm docket",
      heading: "Give your firm one litigation command center.",
      description:
        "Track firm matters, hearing dates, verification work, and recent activity without depending on scattered chats or manual follow-ups.",
      primaryAction: "Add Firm Case",
      secondaryAction: "View Firm Matters",
      matterLabel: "Firm matters",
      setupTitle: "Firm setup",
      setupItems: [
        "Add active firm matters by CNR.",
        "Keep verification status visible for the team.",
        "Use settings to maintain firm identity and access.",
      ],
    };
  }

  return {
    badge: "Solo docket",
    heading: "Run your practice docket without missing a hearing.",
    description:
      "Keep your own matters, hearing dates, reminders, and verification queue in one calm workspace built for daily litigation work.",
    primaryAction: "Add My Case",
    secondaryAction: "View My Matters",
    matterLabel: "My matters",
    setupTitle: "Solo setup",
    setupItems: [
      "Track one live matter for free.",
      "Use the hearing date as your daily control point.",
      "Upgrade only when you need to track another case.",
    ],
  };
}

export function paidPlanForPractice(value?: string | null) {
  const practiceType = normalizePracticeType(value);

  if (practiceType === "firm") {
    return {
      name: "Custom Workflow",
      price: "Rs 999/mo",
      description:
        "For chambers and small firms that want a shared workspace shaped around their litigation process.",
      features: [
        "Unlimited firm cases",
        "Up to 5 team users included",
        "Team member invite queue",
        "Case assignment to lawyers and associates",
        "Extra users at Rs 97/user/mo",
      ],
      subject: "Activate Dockethq Custom Workflow Plan",
    };
  }

  return {
    name: "Solo",
    price: "Rs 499/mo",
    description:
      "For independent lawyers who want to track more than one personal litigation matter.",
    features: [
      "1 user",
      "Unlimited solo cases",
      "Personal hearing reminders",
      "Verification queue for your own matters",
    ],
    subject: "Activate Dockethq Solo Plan",
  };
}
