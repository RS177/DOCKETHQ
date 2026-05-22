export type PlanType = "free" | "pro" | "enterprise";

export const FREE_CASE_LIMIT = 1;

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
