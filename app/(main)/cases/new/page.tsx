"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Loader2,
  LockKeyhole,
  PencilLine,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  XCircle,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { buildHearingReminders } from "@/app/lib/reminders";
import { useToast } from "@/components/toast-provider";
import {
  canCreateCase,
  caseLimitForPlan,
  normalizePlanType,
  type PlanType,
} from "@/app/lib/billing";

type CourtLookup = {
  success: true;
  data: {
    cnrNumber: string;
    caseTitle: string | null;
    status: "pending" | "disposed" | "dismissed" | "stayed" | "unknown";
    statusLabel: string;
    isDisposed: boolean;
    isDismissed: boolean;
    nextHearingDate: string | null;
    currentStage: string | null;
    courtName: string | null;
    judgeName: string | null;
    latestUpdate: string;
    source: string;
    sourceUrl: string;
    fetchedAt: string;
  };
  rawPayload: Record<string, unknown>;
  payloadHash: string;
};

type CourtLookupError = {
  success: false;
  error: string;
  officialSearchUrl: string;
};

type CaseStatus = CourtLookup["data"]["status"];

type CaseAllowance = {
  planType: PlanType;
  caseCount: number;
  caseLimit: number;
  canCreate: boolean;
  loading: boolean;
};

type TeamMember = {
  id: string;
  role: string;
  display_name: string | null;
};

function statusTone(status: CourtLookup["data"]["status"]) {
  if (status === "dismissed") {
    return "border-red-500/20 bg-red-500/10 text-red-200";
  }

  if (status === "disposed") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  if (status === "pending") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  return "border-border bg-background text-muted-foreground";
}

function cleanCnr(value: string) {
  return value.replace(/[\s-]/g, "").trim().toUpperCase();
}

function isValidCnr(value: string) {
  return /^[A-Z0-9]{16}$/.test(cleanCnr(value));
}

function cleanPhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

function labelMember(role: string) {
  return role.replaceAll("_", " ");
}

function StepCard({
  title,
  description,
  complete,
  active,
  icon: Icon,
}: {
  title: string;
  description: string;
  complete: boolean;
  active: boolean;
  icon: typeof Search;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition ${
        active
          ? "border-amber-300/40 bg-amber-500/10"
          : complete
          ? "border-emerald-400/20 bg-emerald-500/10"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <Icon
          className={`h-4 w-4 ${
            complete
              ? "text-emerald-300"
              : active
              ? "text-amber-200"
              : "text-muted-foreground"
          }`}
        />
        {complete && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function CaseLimitPaywall({
  caseCount,
  caseLimit,
}: {
  caseCount: number;
  caseLimit: number;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-amber-300/30 bg-[#fff8eb] text-stone-950 shadow-xl shadow-black/10">
      <div className="p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-950 text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>

        <h3 className="mt-6 text-3xl font-semibold tracking-tight">
          Your first case is active.
        </h3>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          The free Dockethq workspace includes one tracked case. To add another
          matter, start a paid plan and keep the docket growing.
        </p>

        <div className="mt-6 rounded-md border border-amber-200 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Free plan usage
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {caseCount}/{caseLimit} case used
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/billing?reason=case-limit"
            className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            View pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white/60 px-4 py-3 text-sm font-semibold transition hover:bg-white"
          >
            Back to cases
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NewCasePage() {
  const router = useRouter();
  const notify = useToast();
  const [cnrNumber, setCnrNumber] = useState(() => {
    if (typeof window === "undefined") return "";

    return (
      new URLSearchParams(window.location.search)
        .get("cnr")
        ?.replace(/[\s-]/g, "")
        .toUpperCase() || ""
    );
  });
  const [caseTitle, setCaseTitle] = useState("");
  const [courtName, setCourtName] = useState("");
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderPhone, setReminderPhone] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualStatus, setManualStatus] = useState<CaseStatus>("pending");
  const [manualStage, setManualStage] = useState("");
  const [manualNextHearingDate, setManualNextHearingDate] = useState("");
  const [manualJudgeName, setManualJudgeName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedLawyerId, setAssignedLawyerId] = useState("");
  const [assignedAssociateId, setAssignedAssociateId] = useState("");
  const [lookup, setLookup] = useState<CourtLookup | null>(null);
  const [lookupError, setLookupError] = useState<CourtLookupError | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allowance, setAllowance] = useState<CaseAllowance>({
    planType: "free",
    caseCount: 0,
    caseLimit: 1,
    canCreate: true,
    loading: true,
  });

  async function getCaseAllowance(userId: string): Promise<CaseAllowance> {
    const { data: member } = await supabase
      .from("firm_members")
      .select("firm_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (member?.firm_id) {
      const { data: firm } = await supabase
        .from("firms")
        .select("plan_type")
        .eq("id", member.firm_id)
        .maybeSingle();

      const planType = normalizePlanType(firm?.plan_type);
      const { count } = await supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("firm_id", member.firm_id);

      const caseCount = count || 0;

      return {
        planType,
        caseCount,
        caseLimit: caseLimitForPlan(planType),
        canCreate: canCreateCase(planType, caseCount),
        loading: false,
      };
    }

    const { count, error } = await supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("user id", userId);

    if (!error) {
      const caseCount = count || 0;

      return {
        planType: "free",
        caseCount,
        caseLimit: 1,
        canCreate: canCreateCase("free", caseCount),
        loading: false,
      };
    }

    const { count: createdByCount } = await supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId);

    const caseCount = createdByCount || 0;

    return {
      planType: "free",
      caseCount,
      caseLimit: 1,
      canCreate: canCreateCase("free", caseCount),
      loading: false,
    };
  }

  useEffect(() => {
    let ignore = false;

    async function loadAllowance() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!ignore) {
          setAllowance((current) => ({ ...current, loading: false }));
        }
        return;
      }

      if (!ignore) {
        setReminderEmail((current) => current || user.email || "");
      }

      const { data: member } = await supabase
        .from("firm_members")
        .select("firm_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (member?.firm_id) {
        const { data: memberRows } = await supabase
          .from("firm_members")
          .select("id,role,display_name")
          .eq("firm_id", member.firm_id)
          .order("created_at", { ascending: true });

        if (!ignore) {
          setTeamMembers((memberRows || []) as TeamMember[]);
        }
      }

      const nextAllowance = await getCaseAllowance(user.id);

      if (!ignore) {
        setAllowance(nextAllowance);
      }
    }

    void loadAllowance();

    return () => {
      ignore = true;
    };
  }, []);

  async function fetchCaseStatus() {
    const cnr = cleanCnr(cnrNumber);

    if (!isValidCnr(cnr)) {
      notify({
        title: "Check the CNR number",
        description: "CNR should be exactly 16 letters or numbers.",
        variant: "warning",
      });
      return null;
    }

    setCnrNumber(cnr);
    setLookupLoading(true);
    setLookup(null);
    setLookupError(null);

    const res = await fetch("/api/fetch-case", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cnr,
      }),
    });

    const result = (await res.json()) as CourtLookup | CourtLookupError;

    setLookupLoading(false);

    if (!result.success) {
      setLookupError(result);
      return null;
    }

    setLookup(result);
    setManualMode(false);
    setCaseTitle((current) => current || result.data.caseTitle || "");
    setCourtName((current) => current || result.data.courtName || "");

    return result;
  }

  async function addCase() {
    if (!cnrNumber || !isValidCnr(cnrNumber)) {
      notify({
        title: "Valid CNR required",
        description: "Enter a 16-character CNR before saving this matter.",
        variant: "warning",
      });
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      notify({
        title: "Sign in required",
        description: "Create an account or sign in before adding a case.",
        variant: "warning",
      });
      router.push(
        `/login?redirectTo=${encodeURIComponent(
          `/cases/new?cnr=${cleanCnr(cnrNumber)}`
        )}`
      );
      return;
    }

    const currentAllowance = await getCaseAllowance(user.id);
    setAllowance(currentAllowance);

    if (!currentAllowance.canCreate) {
      setLoading(false);
      setLookupLoading(false);
      notify({
        title: "Upgrade to add another case",
        description:
          "Your free Dockethq workspace already has one active tracked case.",
        variant: "warning",
      });
      return;
    }

    const autoLookup = lookup || (!manualMode ? await fetchCaseStatus() : null);

    if (!autoLookup && !manualMode) {
      setLoading(false);
      return;
    }

    const cnr = autoLookup?.data.cnrNumber || cleanCnr(cnrNumber);
    const matterData = autoLookup?.data || {
      cnrNumber: cnr,
      caseTitle: caseTitle || null,
      status: manualStatus,
      statusLabel: manualStatus,
      isDisposed: manualStatus === "disposed" || manualStatus === "dismissed",
      isDismissed: manualStatus === "dismissed",
      nextHearingDate: manualNextHearingDate || null,
      currentStage: manualStage || null,
      courtName: courtName || null,
      judgeName: manualJudgeName || null,
      latestUpdate: `Case saved manually with status "${manualStatus}".`,
      source: "manual",
      sourceUrl: "",
      fetchedAt: new Date().toISOString(),
    };

    const { data: member } = await supabase
      .from("firm_members")
      .select("id,firm_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const hasFirmWorkspace = Boolean(member?.firm_id);

    const insertPayload: Record<string, unknown> = hasFirmWorkspace
      ? {
        firm_id: member!.firm_id,
        cnr_number: matterData.cnrNumber,
        title:
          caseTitle ||
          matterData.caseTitle ||
          `Matter ${matterData.cnrNumber}`,
        court_name: courtName || matterData.courtName,
        judge_name: matterData.judgeName,
        current_stage: matterData.currentStage,
        status: matterData.status,
        next_hearing_date: matterData.nextHearingDate,
        verification_status: autoLookup ? "auto_synced" : "needs_review",
        last_synced_at: autoLookup ? new Date().toISOString() : null,
        last_sync_status: autoLookup ? "success" : null,
        assigned_lawyer_id: assignedLawyerId || null,
        assigned_associate_id: assignedAssociateId || null,
        created_by: user.id,
      }
      : {
        "user id": user.id,
        cnr_number: matterData.cnrNumber,
        case_title:
          caseTitle ||
          matterData.caseTitle ||
          `Matter ${matterData.cnrNumber}`,
        court_name: courtName || matterData.courtName,
        next_hearing: matterData.nextHearingDate,
        status: matterData.status,
        current_status: matterData.status,
        verification_status: autoLookup ? "auto_synced" : "needs_review",
        source: autoLookup ? "ecourts" : "manual",
      };

    const { data: newCase, error } = await supabase
      .from("cases")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !newCase) {
      setLoading(false);
      notify({
        title: "Could not create case",
        description:
          error?.message ||
          "Something went wrong while saving this tracked matter.",
        variant: "error",
      });
      return;
    }

    if (autoLookup && hasFirmWorkspace) {
      const { data: snapshot } = await supabase
        .from("case_snapshots")
        .insert({
          firm_id: member!.firm_id,
          case_id: newCase.id,
          source: "ecourts",
          raw_payload: autoLookup.rawPayload,
          normalized_payload: matterData,
          payload_hash: autoLookup.payloadHash,
        })
        .select()
        .single();

      await supabase.from("case_sync_runs").insert({
        firm_id: member!.firm_id,
        case_id: newCase.id,
        source: "ecourts",
        status: "success",
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        raw_snapshot_id: snapshot?.id,
        detected_changes: {
          created: true,
          status: matterData.status,
          statusLabel: matterData.statusLabel,
          isDisposed: matterData.isDisposed,
          isDismissed: matterData.isDismissed,
          nextHearingDate: matterData.nextHearingDate,
          currentStage: matterData.currentStage,
        },
      });
    }

    if (matterData.nextHearingDate && hasFirmWorkspace) {
      const emailRecipient = reminderEmail.trim();
      const phoneRecipient = cleanPhone(reminderPhone);
      const reminderDrafts = buildHearingReminders(
        matterData.nextHearingDate,
        caseTitle || matterData.caseTitle || `Matter ${matterData.cnrNumber}`
      );
      const deliveryReminders = reminderDrafts.flatMap((reminder) => {
        const rows: Record<string, unknown>[] = [
          {
            firm_id: member!.firm_id,
            case_id: newCase.id,
            title: reminder.title,
            remind_at: reminder.remind_at,
            channel: "in_app",
            status: "scheduled",
          },
        ];

        if (emailRecipient) {
          rows.push({
            firm_id: member!.firm_id,
            case_id: newCase.id,
            title: reminder.title,
            remind_at: reminder.remind_at,
            channel: "email",
            recipient_email: emailRecipient,
            status: "scheduled",
          });
        }

        if (phoneRecipient) {
          rows.push({
            firm_id: member!.firm_id,
            case_id: newCase.id,
            title: reminder.title,
            remind_at: reminder.remind_at,
            channel: "sms",
            recipient_phone: phoneRecipient,
            status: "scheduled",
          });
        }

        return rows;
      });

      await supabase.from("case_hearings").insert({
        firm_id: member!.firm_id,
        case_id: newCase.id,
        hearing_date: matterData.nextHearingDate,
        purpose: matterData.currentStage,
        source: autoLookup ? "ecourts" : "manual",
        created_by: user.id,
      });

      await supabase.from("reminders").insert(deliveryReminders);
    }

    if (hasFirmWorkspace) {
      await supabase.from("case_events").insert({
        firm_id: member!.firm_id,
        case_id: newCase.id,
        type: "case_created",
        title: autoLookup ? "Case status fetched" : "Manual tracking started",
        description: matterData.latestUpdate,
        source: autoLookup ? "ecourts" : "manual",
        created_by: user.id,
        metadata: {
          cnrNumber: matterData.cnrNumber,
          status: matterData.status,
          statusLabel: matterData.statusLabel,
          isDisposed: matterData.isDisposed,
          isDismissed: matterData.isDismissed,
          nextHearingDate: matterData.nextHearingDate,
        },
      });
    }

    setLoading(false);
    notify({
      title: "Case added to Dockethq",
      description:
        "The matter is now on your dashboard with status and hearing tracking.",
      variant: "success",
    });
    router.push(`/cases/${newCase.id}`);
  }

  const hasValidCnr = isValidCnr(cnrNumber);
  const creationSteps = [
    {
      title: "Enter CNR",
      description: "Use the 16-character number lawyers already track.",
      complete: hasValidCnr,
      active: !hasValidCnr,
      icon: Search,
    },
    {
      title: "Verify status",
      description: "Fetch court-source status or mark it for manual review.",
      complete: Boolean(lookup) || manualMode,
      active: hasValidCnr && (lookupLoading || (!lookup && !manualMode)),
      icon: ShieldCheck,
    },
    {
      title: "Save matter",
      description: "Create the workspace record and reminder timeline.",
      complete: false,
      active: loading,
      icon: CalendarCheck2,
    },
  ];

  return (
    <main>
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            CNR lookup
          </p>

          <h1 className="mt-5 text-5xl font-bold tracking-tight">
            Add the first tracked matter.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Enter a 16-character CNR, verify the court status if a provider is
            configured, then save the matter to your dashboard. If lookup is
            unavailable, Dockethq still lets you start tracking manually.
          </p>

          <div className="mt-8 rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  First tracked case is free
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Let the lawyer feel the value with one live matter. A second
                  case routes to pricing before it can be added.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-1 h-5 w-5 text-amber-200" />
              <div>
                <p className="text-sm font-semibold">Only the tracking fields</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Status, dismissal/disposal signal, next hearing, stage, court,
                  judge, and verification history. No bloated CRM fields.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Add Case</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Look it up, review it, then save the matter.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Current plan
                </p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {allowance.planType}{" "}
                  <span className="text-muted-foreground">
                    {Number.isFinite(allowance.caseLimit)
                      ? `${allowance.caseCount}/${allowance.caseLimit} case used`
                      : `${allowance.caseCount} cases tracked`}
                  </span>
                </p>
              </div>

              <Link
                href="/billing"
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent"
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {creationSteps.map((step) => (
              <StepCard key={step.title} {...step} />
            ))}
          </div>

          {!allowance.loading && !allowance.canCreate ? (
            <CaseLimitPaywall
              caseCount={allowance.caseCount}
              caseLimit={allowance.caseLimit}
            />
          ) : (
            <div className="mt-8 space-y-5">
              <div className="flex gap-3">
                <input
                  value={cnrNumber}
                  onChange={(event) => {
                    setCnrNumber(event.target.value.toUpperCase());
                    setLookup(null);
                    setLookupError(null);
                  }}
                  placeholder="Enter 16-character CNR"
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-5 py-4 outline-none focus:border-primary"
                />

                <button
                  onClick={fetchCaseStatus}
                  disabled={lookupLoading || !cnrNumber}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-semibold transition hover:bg-accent disabled:opacity-50"
                >
                  {lookupLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Fetch
                </button>
              </div>

              {lookupLoading && (
                <div className="rounded-lg border border-amber-300/20 bg-amber-500/10 p-5 text-amber-50">
                  <div className="flex items-start gap-3">
                    <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
                    <div>
                      <h3 className="font-semibold">
                        Checking configured court source
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-amber-50/80">
                        Dockethq is looking for case status, disposal/dismissal
                        signal, next hearing, stage, court, and judge.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {lookup && (
                <div className="rounded-lg border border-border bg-background p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Case status
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold">
                        {lookup.data.statusLabel}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusTone(
                        lookup.data.status
                      )}`}
                    >
                      {lookup.data.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Dismissed", lookup.data.isDismissed ? "Yes" : "No"],
                      ["Disposed", lookup.data.isDisposed ? "Yes" : "No"],
                      ["Next hearing", lookup.data.nextHearingDate || "Not listed"],
                      ["Stage", lookup.data.currentStage || "Not listed"],
                      ["Court", lookup.data.courtName || "Not listed"],
                      ["Judge", lookup.data.judgeName || "Not listed"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-md border border-border bg-card p-3"
                      >
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 text-sm font-medium">{value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Data fetched from configured court-data provider.
                  </p>
                </div>
              )}

              {lookupError && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-5 text-amber-100">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <h3 className="font-semibold">Automatic lookup unavailable</h3>
                      <p className="mt-2 text-sm leading-6 text-amber-100/80">
                        {lookupError.error}
                      </p>
                      <a
                        href={lookupError.officialSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-50 underline underline-offset-4"
                      >
                        Open official eCourts search
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setManualMode(true)}
                        className="mt-4 flex items-center gap-2 rounded-md border border-amber-200/20 px-3 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-200/10"
                      >
                        <PencilLine className="h-4 w-4" />
                        Save manually instead
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {manualMode && (
                <div className="rounded-lg border border-border bg-background p-5">
                  <div className="flex items-start gap-3">
                    <PencilLine className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Manual case details</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Save the matter without automatic court data. Dockethq
                        will mark it as needing review.
                      </p>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <select
                          value={manualStatus}
                          onChange={(event) =>
                            setManualStatus(event.target.value as CaseStatus)
                          }
                          className="w-full rounded-md border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                        >
                          <option value="pending">Pending</option>
                          <option value="disposed">Disposed</option>
                          <option value="dismissed">Dismissed</option>
                          <option value="stayed">Stayed</option>
                          <option value="unknown">Unknown</option>
                        </select>

                        <input
                          type="date"
                          value={manualNextHearingDate}
                          onChange={(event) =>
                            setManualNextHearingDate(event.target.value)
                          }
                          className="w-full rounded-md border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                        />

                        <input
                          value={manualStage}
                          onChange={(event) => setManualStage(event.target.value)}
                          placeholder="Stage / purpose"
                          className="w-full rounded-md border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                        />

                        <input
                          value={manualJudgeName}
                          onChange={(event) =>
                            setManualJudgeName(event.target.value)
                          }
                          placeholder="Judge name"
                          className="w-full rounded-md border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={caseTitle}
                  onChange={(event) => setCaseTitle(event.target.value)}
                  placeholder="Case title (optional)"
                  className="w-full rounded-md border border-border bg-background px-5 py-4 outline-none focus:border-primary"
                />

                <input
                  value={courtName}
                  onChange={(event) => setCourtName(event.target.value)}
                  placeholder="Court name (optional)"
                  className="w-full rounded-md border border-border bg-background px-5 py-4 outline-none focus:border-primary"
                />
              </div>

              {teamMembers.length > 0 && (
                <div className="rounded-lg border border-border bg-background p-5">
                  <div className="flex items-start gap-3">
                    <UsersRound className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Firm assignment</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Assign this matter to the lawyer and associate who will
                        be responsible for hearing prep and follow-up.
                      </p>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <select
                          value={assignedLawyerId}
                          onChange={(event) =>
                            setAssignedLawyerId(event.target.value)
                          }
                          className="w-full rounded-md border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                        >
                          <option value="">Responsible lawyer</option>
                          {teamMembers
                            .filter((member) =>
                              ["owner", "admin", "lawyer"].includes(member.role)
                            )
                            .map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.display_name || labelMember(member.role)}
                              </option>
                            ))}
                        </select>

                        <select
                          value={assignedAssociateId}
                          onChange={(event) =>
                            setAssignedAssociateId(event.target.value)
                          }
                          className="w-full rounded-md border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                        >
                          <option value="">Associate / staff</option>
                          {teamMembers
                            .filter((member) =>
                              ["associate", "lawyer", "admin"].includes(
                                member.role
                              )
                            )
                            .map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.display_name || labelMember(member.role)}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-background p-5">
                <div className="flex items-start gap-3">
                  <CalendarCheck2 className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Reminder delivery</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      If a hearing date is saved, Dockethq schedules reminders
                      7 days before, 1 day before, and on the hearing day. Email
                      is optional; phone is optional and uses SMS when configured.
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <input
                        type="email"
                        value={reminderEmail}
                        onChange={(event) => setReminderEmail(event.target.value)}
                        placeholder="Reminder email (optional)"
                        className="w-full rounded-md border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                      />

                      <input
                        value={reminderPhone}
                        onChange={(event) => setReminderPhone(event.target.value)}
                        placeholder="Phone with country code (optional)"
                        className="w-full rounded-md border border-border bg-card px-4 py-3 outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={addCase}
                disabled={
                  loading ||
                  lookupLoading ||
                  allowance.loading ||
                  !allowance.canCreate ||
                  !hasValidCnr
                }
                className="w-full rounded-md bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {loading
                  ? "Saving tracked matter..."
                  : manualMode
                  ? "Save Manual Matter"
                  : lookup
                  ? "Save Verified Matter"
                  : "Fetch or Save Matter"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
