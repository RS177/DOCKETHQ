export type PlanType = "free" | "pro" | "enterprise";

export const FREE_CASE_LIMIT = 1;
export const FREE_USER_LIMIT = 1;
export const PRO_USER_LIMIT = 1;
export const CUSTOM_WORKFLOW_USER_LIMIT = 5;

export function normalizePlanType(planType?: string | null): PlanType {
  if (planType === "pro" || planType === "enterprise") {
    return planType;
  }

  return "free";
}

export function isPaidPlan(planType?: string | null) {
  return normalizePlanType(planType) !== "free";
}

export function caseLimitForPlan(planType?: string | null) {
  return isPaidPlan(planType) ? Number.POSITIVE_INFINITY : FREE_CASE_LIMIT;
}

export function canCreateCase(planType: string | null | undefined, caseCount: number) {
  return isPaidPlan(planType) || caseCount < FREE_CASE_LIMIT;
}

export function userLimitForPlan(planType?: string | null) {
  const normalized = normalizePlanType(planType);

  if (normalized === "enterprise") {
    return CUSTOM_WORKFLOW_USER_LIMIT;
  }

  if (normalized === "pro") {
    return PRO_USER_LIMIT;
  }

  return FREE_USER_LIMIT;
}

export function canInviteMember(
  planType: string | null | undefined,
  currentMemberAndInviteCount: number
) {
  return currentMemberAndInviteCount < userLimitForPlan(planType);
}
