"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Gavel,
  History,
  Info,
  Landmark,
  Loader2,
  RefreshCw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { buildHearingReminders } from "@/app/lib/reminders";
import { maskCnr } from "@/app/lib/confidentiality";
import { useToast } from "@/components/toast-provider";

type CaseData = {
  id: string;
  firm_id?: string | null;
  cnr_number: string | null;
  title?: string | null;
  case_title?: string | null;
  court_name: string | null;
  judge_name: string | null;
  current_stage: string | null;
  status?: string | null;
  current_status?: string | null;
  next_hearing_date?: string | null;
  next_hearing?: string | null;
  verification_status?: string | null;
  last_synced_at?: string | null;
  last_sync_status?: string | null;
};

type CaseEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurred_at: string;
  source: string;
};

type SyncRun = {
  id: string;
  source: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  detected_changes: Record<string, unknown> | null;
  created_at: string;
};

type CourtLookup =
  | {
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
    }
  | {
      success: false;
      error: string;
      code?:
        | "INVALID_CNR"
        | "PROVIDER_NOT_CONFIGURED"
        | "PROVIDER_FAILED"
        | "CASE_NOT_FOUND";
      officialSearchUrl?: string;
    };

function caseTitle(caseData: CaseData) {
  return caseData.title || caseData.case_title || "Untitled matter";
}

function caseStatus(caseData: CaseData) {
  return caseData.status || caseData.current_status || "unknown";
}

function caseHearingDate(caseData: CaseData) {
  return caseData.next_hearing_date || caseData.next_hearing || null;
}

function verificationStatus(caseData: CaseData) {
  return (caseData.verification_status || "unverified").replaceAll("_", " ");
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "Not scheduled";
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return "Not checked yet";
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Not checked yet";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function addDays(dateString: string | null | undefined, days: number) {
  if (!dateString) return null;
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function daysUntil(dateString: string | null | undefined) {
  if (!dateString) return null;
  const target = new Date(dateString);

  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function statusTone(status: string) {
  const value = status.toLowerCase();

  if (value.includes("dismiss")) {
    return "border-red-500/20 bg-red-500/10 text-red-200";
  }

  if (value.includes("disposed")) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  if (value.includes("pending")) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  return "border-white/10 bg-white/[0.05] text-stone-300";
}

function sourceConfidence(caseData: CaseData, latestSync?: SyncRun) {
  const latestStatus = latestSync?.status || caseData.last_sync_status || "";
  const verification = caseData.verification_status || "unverified";

  if (
    verification === "sync_failed" ||
    latestStatus === "failed" ||
    latestStatus === "captcha_blocked"
  ) {
    return {
      label: "Source unavailable",
      description:
        latestSync?.error_message ||
        "Court source could not be reached on the last check.",
      styles: "border-red-500/20 bg-red-500/10 text-red-100",
    };
  }

  if (verification === "auto_synced" || latestStatus === "changed" || latestStatus === "no_change" || latestStatus === "success") {
    return {
      label: "Verified from court source",
      description: "Latest saved data came from the configured court-data source.",
      styles: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
    };
  }

  if (verification === "verified") {
    return {
      label: "Manually verified",
      description: "A team member marked this matter as checked.",
      styles: "border-blue-500/20 bg-blue-500/10 text-blue-100",
    };
  }

  return {
    label: "Needs first verification",
    description: "Refresh court status or manually verify this matter.",
    styles: "border-amber-500/20 bg-amber-500/10 text-amber-100",
  };
}

function buildDetectedChanges(caseData: CaseData, lookup: CourtLookup & { success: true }) {
  const changes: Record<
    string,
    { label: string; from: string | null; to: string | null }
  > = {};

  const track = (
    key: string,
    label: string,
    from: string | null | undefined,
    to: string | null | undefined
  ) => {
    const fromValue = from || null;
    const toValue = to || null;

    if (fromValue !== toValue) {
      changes[key] = {
        label,
        from: fromValue,
        to: toValue,
      };
    }
  };

  track("status", "Status", caseStatus(caseData), lookup.data.status);
  track(
    "nextHearingDate",
    "Next hearing",
    caseHearingDate(caseData),
    lookup.data.nextHearingDate
  );
  track(
    "currentStage",
    "Stage",
    caseData.current_stage,
    lookup.data.currentStage
  );
  track("courtName", "Court", caseData.court_name, lookup.data.courtName);
  track("judgeName", "Judge", caseData.judge_name, lookup.data.judgeName);

  return changes;
}

function changeEntries(changes: Record<string, unknown> | null | undefined) {
  if (!changes) return [];

  return Object.entries(changes).map(([key, value]) => {
    if (key === "noChange") {
      return {
        key,
        label: "No change",
        from: null,
        to: String(value),
      };
    }

    if (key === "reason") {
      return {
        key,
        label: "Reason",
        from: null,
        to: String(value),
      };
    }

    if (value && typeof value === "object" && "label" in value) {
      const record = value as {
        label?: string;
        from?: string | null;
        to?: string | null;
      };

      return {
        key,
        label: record.label || key,
        from: record.from || "Empty",
        to: record.to || "Empty",
      };
    }

    return {
      key,
      label: key.replace(/([A-Z])/g, " $1"),
      from: null,
      to: String(value),
    };
  });
}

export default function CaseDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const notify = useToast();

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [status, setStatus] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [note, setNote] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchCase = useCallback(async () => {
    const { data } = await supabase
      .from("cases")
      .select("*")
      .eq("id", id)
      .single();

    setCaseData(data);
  }, [id]);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from("case_events")
      .select("id,type,title,description,occurred_at,source")
      .eq("case_id", id)
      .order("occurred_at", { ascending: false });

    setEvents(data || []);
  }, [id]);

  const fetchSyncRuns = useCallback(async () => {
    const { data } = await supabase
      .from("case_sync_runs")
      .select(
        "id,source,status,started_at,finished_at,error_message,detected_changes,created_at"
      )
      .eq("case_id", id)
      .order("created_at", { ascending: false })
      .limit(8);

    setSyncRuns((data as SyncRun[]) || []);
  }, [id]);

  async function saveUpdate() {
    if (!caseData) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nextStatus = status || caseStatus(caseData);
    const nextHearing = hearingDate || caseHearingDate(caseData);

    const updatePayload: Record<string, string | null> = {};

    if ("status" in caseData) updatePayload.status = nextStatus;
    if ("current_status" in caseData) updatePayload.current_status = nextStatus;
    if ("next_hearing_date" in caseData) updatePayload.next_hearing_date = nextHearing;
    if ("next_hearing" in caseData) updatePayload.next_hearing = nextHearing;
    if ("verification_status" in caseData) {
      updatePayload.verification_status = "needs_review";
    }

    await supabase.from("cases").update(updatePayload).eq("id", id);

    if (hearingDate && caseData.firm_id) {
      await supabase.from("case_hearings").insert({
        firm_id: caseData.firm_id,
        case_id: id,
        hearing_date: hearingDate,
        purpose: nextStatus,
        source: "manual",
        created_by: user?.id,
      });
    }

    if (caseData.firm_id) {
      await supabase.from("case_events").insert({
        firm_id: caseData.firm_id,
        case_id: id,
        type: "case_updated",
        title: "Matter updated",
        description:
          note ||
          `Status set to "${nextStatus}" with next hearing on ${
            nextHearing || "not scheduled"
          }.`,
        source: "manual",
        created_by: user?.id,
        metadata: {
          status: nextStatus,
          nextHearingDate: nextHearing,
        },
      });
    }

    setStatus("");
    setHearingDate("");
    setNote("");

    fetchCase();
    fetchEvents();
    fetchSyncRuns();
    notify({
      title: "Matter updated",
      description: "The latest manual update was saved to the matter timeline.",
      variant: "success",
    });
  }

  async function markVerified() {
    if (!caseData) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("cases")
      .update({
        verification_status: "verified",
      })
      .eq("id", caseData.id);

    if (caseData.firm_id) {
      await supabase.from("case_events").insert({
        firm_id: caseData.firm_id,
        case_id: caseData.id,
        type: "verification_changed",
        title: "Matter verified",
        description:
          "Latest case information was manually checked against the court source.",
        source: "manual",
        created_by: user?.id,
      });
    }

    fetchCase();
    fetchEvents();
    fetchSyncRuns();
    notify({
      title: "Matter verified",
      description: "This matter is now marked as checked against the court source.",
      variant: "success",
    });
  }

  async function refreshCourtStatus() {
    if (!caseData) return;

    if (!caseData.cnr_number) {
      notify({
        title: "CNR missing",
        description: "Add a CNR number before refreshing court status.",
        variant: "warning",
      });
      return;
    }

    setRefreshing(true);
    const startedAt = new Date().toISOString();

    const response = await fetch("/api/fetch-case", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cnr: caseData.cnr_number }),
    });

    const result = (await response.json()) as CourtLookup;

    if (!result.success) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const failurePayload: Record<string, string | null> = {};

      if ("verification_status" in caseData) {
        failurePayload.verification_status = "sync_failed";
      }
      if ("last_sync_status" in caseData) {
        failurePayload.last_sync_status = "failed";
      }

      if (Object.keys(failurePayload).length > 0) {
        await supabase.from("cases").update(failurePayload).eq("id", caseData.id);
      }

      if (caseData.firm_id) {
        await supabase.from("case_sync_runs").insert({
          firm_id: caseData.firm_id,
          case_id: caseData.id,
          source: "ecourts",
          status: "failed",
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          error_message: result.error,
          detected_changes: {
            reason: result.code || "provider_unavailable",
          },
        });

        await supabase.from("case_events").insert({
          firm_id: caseData.firm_id,
          case_id: caseData.id,
          type: "sync_failed",
          title: "Court source unavailable",
          description: result.error,
          source: "ecourts",
          created_by: user?.id,
          metadata: {
            code: result.code,
            officialSearchUrl: result.officialSearchUrl,
          },
        });
      }

      setRefreshing(false);
      fetchCase();
      fetchEvents();
      fetchSyncRuns();
      notify({
        title: "Court refresh unavailable",
        description: result.error,
        variant: response.status === 400 ? "warning" : "error",
      });
      return;
    }

    const detectedChanges = buildDetectedChanges(caseData, result);
    const syncStatus =
      Object.keys(detectedChanges).length > 0 ? "changed" : "no_change";

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updatePayload: Record<string, string | null> = {};

    if ("title" in caseData && result.data.caseTitle) {
      updatePayload.title = result.data.caseTitle;
    }
    if ("case_title" in caseData && result.data.caseTitle) {
      updatePayload.case_title = result.data.caseTitle;
    }
    if ("court_name" in caseData) updatePayload.court_name = result.data.courtName;
    if ("judge_name" in caseData) updatePayload.judge_name = result.data.judgeName;
    if ("current_stage" in caseData) {
      updatePayload.current_stage = result.data.currentStage;
    }
    if ("status" in caseData) updatePayload.status = result.data.status;
    if ("current_status" in caseData) {
      updatePayload.current_status = result.data.status;
    }
    if ("next_hearing_date" in caseData) {
      updatePayload.next_hearing_date = result.data.nextHearingDate;
    }
    if ("next_hearing" in caseData) {
      updatePayload.next_hearing = result.data.nextHearingDate;
    }
    if ("verification_status" in caseData) {
      updatePayload.verification_status = "auto_synced";
    }
    if ("last_synced_at" in caseData) {
      updatePayload.last_synced_at = new Date().toISOString();
    }
    if ("last_sync_status" in caseData) {
      updatePayload.last_sync_status = syncStatus;
    }

    const { error } = await supabase
      .from("cases")
      .update(updatePayload)
      .eq("id", caseData.id);

    if (error) {
      setRefreshing(false);
      notify({
        title: "Could not update matter",
        description: error.message,
        variant: "error",
      });
      return;
    }

    if (caseData.firm_id) {
      const { data: snapshot } = await supabase
        .from("case_snapshots")
        .insert({
          firm_id: caseData.firm_id,
          case_id: caseData.id,
          source: "ecourts",
          raw_payload: result.rawPayload,
          normalized_payload: result.data,
          payload_hash: result.payloadHash,
        })
        .select()
        .single();

      await supabase.from("case_sync_runs").insert({
        firm_id: caseData.firm_id,
        case_id: caseData.id,
        source: "ecourts",
        status: syncStatus,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        raw_snapshot_id: snapshot?.id,
        detected_changes:
          Object.keys(detectedChanges).length > 0
            ? detectedChanges
            : { noChange: "Court data matches the saved matter." },
      });

      await supabase.from("case_events").insert({
        firm_id: caseData.firm_id,
        case_id: caseData.id,
        type: "sync_completed",
        title:
          syncStatus === "changed"
            ? "Court status changed"
            : "Court status checked",
        description:
          syncStatus === "changed"
            ? `${Object.keys(detectedChanges).length} field update detected from the court source.`
            : "No difference found against the saved matter.",
        source: "ecourts",
        created_by: user?.id,
        metadata: {
          status: result.data.status,
          statusLabel: result.data.statusLabel,
          isDisposed: result.data.isDisposed,
          isDismissed: result.data.isDismissed,
          nextHearingDate: result.data.nextHearingDate,
        },
      });
    }

    setRefreshing(false);
    fetchCase();
    fetchEvents();
    fetchSyncRuns();
    notify({
      title:
        syncStatus === "changed"
          ? "Court changes saved"
          : "Court status checked",
      description:
        syncStatus === "changed"
          ? "Dockethq updated this matter from the latest provider response."
          : "No changes were found in the latest provider response.",
      variant: "success",
    });
  }

  useEffect(() => {
    let ignore = false;

    async function loadCaseDetails() {
      const [{ data: caseRecord }, { data: eventRecords }, { data: syncRecords }] =
        await Promise.all([
          supabase.from("cases").select("*").eq("id", id).single(),
          supabase
            .from("case_events")
            .select("id,type,title,description,occurred_at,source")
            .eq("case_id", id)
            .order("occurred_at", { ascending: false }),
          supabase
            .from("case_sync_runs")
            .select(
              "id,source,status,started_at,finished_at,error_message,detected_changes,created_at"
            )
            .eq("case_id", id)
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

      if (ignore) return;

      setCaseData(caseRecord);
      setEvents(eventRecords || []);
      setSyncRuns((syncRecords as SyncRun[]) || []);
    }

    if (id) {
      void loadCaseDetails();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  const statusValue = useMemo(
    () => (caseData ? caseStatus(caseData) : "unknown"),
    [caseData]
  );

  if (!caseData) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading matter...
      </main>
    );
  }

  const hearing = caseHearingDate(caseData);
  const reminders = hearing
    ? buildHearingReminders(hearing, caseTitle(caseData))
    : [];
  const latestSync = syncRuns[0];
  const confidence = sourceConfidence(caseData, latestSync);
  const lastChecked =
    caseData.last_synced_at || latestSync?.finished_at || latestSync?.created_at;
  const nextCheckTarget = addDays(lastChecked, 1);
  const hearingDistance = daysUntil(hearing);
  const hearingAlert =
    hearingDistance === null
      ? "No hearing listed"
      : hearingDistance < 0
        ? "Past hearing"
        : hearingDistance === 0
          ? "Hearing today"
          : hearingDistance === 1
            ? "Hearing tomorrow"
            : `${hearingDistance} days left`;

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0d0c0a] text-stone-100 shadow-2xl shadow-black/20">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-stone-400">
                {maskCnr(caseData.cnr_number)}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(
                  statusValue
                )}`}
              >
                {statusValue}
              </span>
            </div>

            <h1 className="mt-8 max-w-4xl text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">
              {caseTitle(caseData)}
            </h1>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-400">
              <span className="inline-flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                {caseData.court_name || "Court not set"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Scale className="h-4 w-4" />
                {caseData.current_stage || "Stage not available"}
              </span>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.03] p-6 lg:border-l lg:border-t-0 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
              Next hearing
            </p>
            <p className="mt-8 text-4xl font-semibold tracking-tight text-stone-50">
              {formatDate(hearing)}
            </p>
            <p className="mt-3 text-sm font-medium text-amber-200">
              {hearingAlert}
            </p>
            <div className={`mt-6 rounded-lg border p-4 ${confidence.styles}`}>
              <div className="flex items-start gap-3">
                {confidence.label === "Source unavailable" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold">{confidence.label}</p>
                  <p className="mt-1 text-xs leading-5 opacity-80">
                    {confidence.description}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={markVerified}
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-white"
            >
              <ShieldCheck className="h-4 w-4" />
              Mark Verified
            </button>
            <button
              onClick={refreshCourtStatus}
              disabled={refreshing || !caseData.cnr_number}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-stone-100 transition hover:bg-white/[0.08] disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? "Refreshing..." : "Refresh Court Status"}
            </button>
            <p className="mt-4 text-sm capitalize text-stone-400">
              Verification: {verificationStatus(caseData)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Case status",
            value: statusValue,
            detail: verificationStatus(caseData),
            icon: Gavel,
          },
          {
            label: "Last checked",
            value: formatDateTime(lastChecked),
            detail: latestSync ? latestSync.status.replace("_", " ") : "No court check yet",
            icon: Clock3,
          },
          {
            label: "Next check target",
            value: nextCheckTarget ? formatDateTime(nextCheckTarget) : "After first refresh",
            detail: "Daily tracking cadence",
            icon: RefreshCw,
          },
          {
            label: "Court bench",
            value: caseData.judge_name || "Judge not listed",
            detail: caseData.court_name || "Court not set",
            icon: Scale,
          },
        ].map((item) => {
          const FactIcon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <FactIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-4 text-base font-semibold leading-6">{item.value}</p>
              <p className="mt-2 text-xs capitalize text-muted-foreground">
                {item.detail}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">Add update</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Record a status change, hearing date, or verification note.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              placeholder="Status, e.g. pending, disposed, dismissed"
              className="w-full rounded-md border border-border bg-background px-5 py-4 outline-none transition focus:border-primary"
            />

            <input
              type="date"
              value={hearingDate}
              onChange={(event) => setHearingDate(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-5 py-4 outline-none transition focus:border-primary"
            />

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a short note..."
              className="min-h-[140px] w-full rounded-md border border-border bg-background px-5 py-4 outline-none transition focus:border-primary"
            />

            <button
              onClick={saveUpdate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Update
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">Hearing reminders</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Generated from the saved hearing date.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {reminders.map((reminder) => {
              const distance = daysUntil(reminder.remind_at);
              const label =
                distance === null
                  ? "Scheduled"
                  : distance < 0
                    ? "Passed"
                    : distance === 0
                      ? "Due today"
                      : distance === 1
                        ? "Tomorrow"
                        : `${distance} days`;

              return (
                <div
                  key={reminder.remind_at}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(reminder.remind_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}

            {reminders.length === 0 && (
              <div className="rounded-md border border-border bg-background p-5 text-sm text-muted-foreground">
                Save a hearing date to create reminders.
              </div>
            )}
          </div>
        </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Court checks
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Status history</h2>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {syncRuns.map((run) => {
                const changes = changeEntries(run.detected_changes);
                const failed =
                  run.status === "failed" || run.status === "captcha_blocked";

                return (
                  <div key={run.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold capitalize">
                          {run.status.replace("_", " ")}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {run.source} - {formatDateTime(run.finished_at || run.created_at)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          failed
                            ? "bg-red-500/10 text-red-300"
                            : run.status === "changed"
                              ? "bg-amber-500/10 text-amber-200"
                              : "bg-emerald-500/10 text-emerald-200"
                        }`}
                      >
                        {failed ? "Unavailable" : "Checked"}
                      </span>
                    </div>

                    {run.error_message && (
                      <p className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-100">
                        {run.error_message}
                      </p>
                    )}

                    {changes.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {changes.map((change) => (
                          <div
                            key={change.key}
                            className="rounded-md border border-border bg-background p-3 text-sm"
                          >
                            <p className="font-medium capitalize">
                              {change.label}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {change.from
                                ? `${change.from} -> ${change.to}`
                                : change.to}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {syncRuns.length === 0 && (
                <div className="flex gap-3 p-6 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  Refresh court status once to start building a check history.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Matter record
              </p>
              <h2 className="mt-1 text-xl font-semibold">Timeline</h2>
            </div>

            <div className="divide-y divide-border">
              {events.map((event) => (
                <div key={event.id} className="p-5">
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                      <Clock3 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {event.type.replaceAll("_", " ")} - {event.source}
                      </p>

                      <h3 className="mt-2 font-semibold">{event.title}</h3>

                      {event.description && (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {event.description}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-muted-foreground">
                        {formatDateTime(event.occurred_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No timeline events yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
