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
      heading: "Track every firm matter from one CNR-first docket.",
      description:
        "Add a CNR, keep the latest case status visible, and know which hearings or court-source checks need attention.",
      primaryAction: "Add CNR",
      secondaryAction: "View Cases",
      matterLabel: "Tracked cases",
      setupTitle: "What Dockethq tracks",
      setupItems: [
        "Case status, disposal or dismissal signal, and current stage.",
        "Next hearing date with simple prep reminders.",
        "Last checked time and court-source verification status.",
      ],
    };
  }

    return {
      badge: "Solo docket",
      heading: "Track Indian litigation cases by CNR.",
      description:
      "Add a CNR once. Dockethq keeps the case status, next hearing, verification state, and reminders in one calm workspace.",
      primaryAction: "Add CNR",
      secondaryAction: "View Cases",
      matterLabel: "Tracked cases",
      setupTitle: "What Dockethq tracks",
      setupItems: [
      "Current case status and pending, disposed, or dismissed signal.",
      "Next hearing date as the daily control point.",
      "Verification history so you know when the source was last checked.",
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
        "Shared case status and hearing dashboard",
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
