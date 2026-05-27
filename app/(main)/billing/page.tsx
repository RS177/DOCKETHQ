"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Gavel,
  LockKeyhole,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import {
  FREE_CASE_LIMIT,
  normalizePlanType,
  type PlanType,
} from "@/app/lib/billing";
import {
  effectivePracticeType,
  normalizePracticeType,
  paidPlanForPractice,
  practiceLabel,
  type PracticeType,
} from "@/app/lib/practice";

type BillingState = {
  planType: PlanType;
  practiceType: PracticeType;
  firmName: string;
  caseCount: number;
  loading: boolean;
};

export default function BillingPage() {
  const billingLink = process.env.NEXT_PUBLIC_BILLING_LINK;
  const [reason] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("reason") || ""
  );
  const [billing, setBilling] = useState<BillingState>({
    planType: "free",
    practiceType: "solo",
    firmName: "Dockethq workspace",
    caseCount: 0,
    loading: true,
  });

  useEffect(() => {
    let ignore = false;

    async function loadBilling() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!ignore) {
          setBilling((current) => ({ ...current, loading: false }));
        }
        return;
      }

      const { data: member } = await supabase
        .from("firm_members")
        .select("firm_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (member?.firm_id) {
        const { data: firm } = await supabase
          .from("firms")
          .select("*")
          .eq("id", member.firm_id)
          .maybeSingle();

        const { count } = await supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .eq("firm_id", member.firm_id);

        if (!ignore) {
          setBilling({
            planType: normalizePlanType(firm?.plan_type),
            practiceType: effectivePracticeType(
              firm?.practice_type || user.user_metadata?.practice_type,
              firm?.plan_type
            ),
            firmName:
              firm?.name ||
              user.user_metadata?.firm_name ||
              "Dockethq workspace",
            caseCount: count || 0,
            loading: false,
          });
        }
        return;
      }

      const { count } = await supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("user id", user.id);

      if (!ignore) {
        setBilling({
          planType: "free",
          practiceType: normalizePracticeType(user.user_metadata?.practice_type),
          firmName: user.user_metadata?.firm_name || "Dockethq workspace",
          caseCount: count || 0,
          loading: false,
        });
      }
    }

    void loadBilling();

    return () => {
      ignore = true;
    };
  }, []);

  const isPaid = billing.planType !== "free";
  const paidPlan = paidPlanForPractice(billing.practiceType);
  const freeDescription =
    billing.practiceType === "firm"
      ? "Best for testing Dockethq with one firm matter before moving the full docket in."
      : "Best for trying the case tracking loop with one personal matter.";

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      {reason === "case-limit" && (
        <section className="rounded-lg border border-amber-300/30 bg-[#fff8eb] p-5 text-stone-950 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Second case gate
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Upgrade before adding another tracked matter.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                This is the intended trial loop: first case free, paid plan when
                the lawyer wants to track the next case.
              </p>
            </div>
            <Link
              href="/cases"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white"
            >
              Back to cases
            </Link>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0d0c0a] text-stone-100 shadow-2xl shadow-black/20">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-100 text-stone-950">
              <CreditCard className="h-5 w-5" />
            </div>

            <h1 className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              One case free. A paid plan when the docket grows.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-400">
              Your workspace is set as{" "}
              {practiceLabel(billing.practiceType).toLowerCase()}. Dockethq keeps
              the trial simple, then prices the upgrade around how the lawyer
              actually practices.
            </p>
          </div>

          <div className="border-t border-white/10 bg-white/[0.03] p-6 lg:border-l lg:border-t-0 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
              Workspace usage
            </p>
            <p className="mt-8 text-5xl font-semibold tracking-tight text-stone-50">
              {billing.loading ? "--" : billing.caseCount}
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.22em] text-amber-200">
              tracked cases
            </p>
            <p className="mt-8 text-sm leading-6 text-stone-400">
              Current plan:{" "}
              <span className="font-semibold capitalize text-stone-100">
                {billing.planType}
              </span>
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              {billing.firmName}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Free
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Rs 0</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {freeDescription}
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Current start
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <PlanFeature>1 tracked case</PlanFeature>
            <PlanFeature>CNR lookup and manual fallback</PlanFeature>
            <PlanFeature>Hearing date and reminder workspace</PlanFeature>
          </div>
        </div>

        <div className="rounded-lg border border-amber-300/30 bg-[#fff8eb] p-6 text-stone-950 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-700">
                {paidPlan.name}
              </p>
              <h2 className="mt-2 text-3xl font-semibold">{paidPlan.price}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {paidPlan.description}
              </p>
            </div>
            <Gavel className="h-5 w-5 text-amber-700" />
          </div>

          <div className="mt-8 space-y-4">
            {paidPlan.features.map((feature) => (
              <PlanFeature key={feature} dark>
                {feature}
              </PlanFeature>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                billingLink ||
                `mailto:hello@dockethq.in?subject=${encodeURIComponent(
                  paidPlan.subject
                )}`;
            }}
            disabled={isPaid}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPaid ? (
              <>
                <LockKeyhole className="h-4 w-4" />
                Paid plan active
              </>
            ) : (
              <>
                Start {paidPlan.name} Plan
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </section>

      <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        Free plan limit: {FREE_CASE_LIMIT} case. {paidPlan.name} removes the
        case limit for this {billing.practiceType === "firm" ? "firm" : "solo"}
        workspace.
        <Link href="/cases/new" className="ml-2 font-semibold text-foreground">
          Add a case
        </Link>
      </div>
    </main>
  );
}

function PlanFeature({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2
        className={`h-4 w-4 shrink-0 ${
          dark ? "text-amber-700" : "text-emerald-500"
        }`}
      />
      <p
        className={
          dark ? "text-sm text-stone-700" : "text-sm text-muted-foreground"
        }
      >
        {children}
      </p>
    </div>
  );
}
