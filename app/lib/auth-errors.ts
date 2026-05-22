export type FriendlyAuthError = {
  title: string;
  description: string;
};

type AuthLikeError = {
  message?: string;
  status?: number;
  code?: string;
};

export function friendlyAuthError(
  error: AuthLikeError | string | null | undefined,
  fallbackTitle = "Could not complete this action"
): FriendlyAuthError {
  const message = typeof error === "string" ? error : error?.message || "";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid grant") ||
    normalized.includes("invalid credentials")
  ) {
    return {
      title: "Wrong email or password",
      description:
        "Check your login details and try again. Your workspace is still secure.",
    };
  }

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("not confirmed")
  ) {
    return {
      title: "Confirm your email first",
      description:
        "Open the verification email from Supabase or Dockethq, then come back and sign in.",
    };
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered") ||
    normalized.includes("already exists")
  ) {
    return {
      title: "Account already exists",
      description:
        "Use sign in instead, or reset the password if you cannot access this email.",
    };
  }

  if (
    normalized.includes("password should be") ||
    normalized.includes("weak password") ||
    normalized.includes("password")
  ) {
    return {
      title: "Choose a stronger password",
      description:
        "Use at least 8 characters with a mix of letters, numbers, or symbols.",
    };
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many") ||
    normalized.includes("security purposes")
  ) {
    return {
      title: "Too many attempts",
      description:
        "Pause for a minute before trying again. This protects your account from abuse.",
    };
  }

  if (
    normalized.includes("network") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch")
  ) {
    return {
      title: "Connection issue",
      description:
        "Dockethq could not reach the auth server. Check your internet and try again.",
    };
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return {
      title: "Signup is currently closed",
      description:
        "New workspaces are not enabled on this project yet. Try again after setup is complete.",
    };
  }

  return {
    title: fallbackTitle,
    description:
      "Please try again. If this keeps happening, check your Supabase auth settings.",
  };
}
