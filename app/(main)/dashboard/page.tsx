"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gavel,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { buildHearingReminders } from "@/app/lib/reminders";
import {
  dashboardCopy,
  normalizePracticeType,
  practiceLabel,
  type PracticeType,
} from "@/app/lib/practice";

type CaseSummary = {
  id: string;
  title?: string | null;
  case_title?: string | null;
  court_name: string | null;
  status?: string | null;
  current_status?: string | null;
  next_hearing_date?: string | null;
  next_hearing?: string | null;
  verification_status?: string | null;
  last_synced_at?: string | null;
};

type TimelineItem = {
  id: string;
  title: string;
  occurred_at: string;
  source: string;
};

type ReminderItem = {
  id: string;
  title: string;
  remind_at: string;
  case_id: string;
};

type WorkspaceSummary = {
  firmName: string;
  practiceType: PracticeType;
  role: string;
  planType: string;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "No date";
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "No date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function hearingBadge(dateString: string) {
  const today = new Date();
  const hearing = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  hearing.setHours(0, 0, 0, 0);

  const diff = (hearing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diff < 0) {
    return { label: "Overdue", styles: "bg-red-500/10 text-red-300 ring-red-500/20" };
  }

  if (diff === 0) {
    return { label: "Today", styles: "bg-amber-500/10 text-amber-200 ring-amber-500/20" };
  }

  if (diff === 1) {
    return { label: "Tomorrow", styles: "bg-orange-500/10 text-orange-200 ring-orange-500/20" };
  }

  return { label: "Scheduled", styles: "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20" };
}

function verificationLabel(status: string) {
  return status.replaceAll("_", " ");
}

function caseTitle(item: CaseSummary) {
  return item.title || item.case_title || "Untitled matter";
}

function hearingDate(item: CaseSummary) {
  return item.next_hearing_date || item.next_hearing || null;
}

function EmptyDashboardState({
  isFirmWorkspace,
}: {
  isFirmWorkspace: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E3D6C1] bg-[#F7F3EA] text-[#071427] shadow-xl shadow-black/10">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#071427] text-white">
            <Gavel className="h-5 w-5" />
          </div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A42]">
            First case setup
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
            Add one live matter and Dockethq becomes useful immediately.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#64748B]">
            The dashboard is intentionally quiet until a case exists. Start with
            one CNR, then Dockethq can show hearings, status, verification, and
            reminders around that matter.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 rounded-md bg-[#071427] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111d33]"
            >
              Add first case
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-md border border-[#D6C6AA] bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white"
            >
              Review setup
            </Link>
          </div>
        </div>

        <div className="border-t border-[#E3D6C1] bg-white/60 p-6 lg:border-l lg:border-t-0 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B58A42]">
            What appears after case one
          </p>
          <div className="mt-6 grid gap-3">
            {[
              ["CNR lookup", "Fetch status or mark for manual review.", Search],
              ["Hearing control", "Show the next listed date clearly.", CalendarDays],
              ["Verification queue", "Know what needs checking before court.", ShieldCheck],
            ].map(([title, description, Icon]) => {
              const ItemIcon = Icon as typeof Search;

              return (
                <div
                  key={title as string}
                  className="rounded-md border border-[#E3D6C1] bg-[#FBF8F1] p-4"
                >
                  <ItemIcon className="h-5 w-5 text-[#B58A42]" />
                  <p className="mt-4 text-sm font-semibold">
                    {title as string}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#64748B]">
                    {description as string}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-xs leading-5 text-[#64748B]">
            {isFirmWorkspace
              ? "For firms, this becomes the shared matter control panel."
              : "For solo practice, this becomes your personal daily docket."}
          </p>
        </div>
      </div>
    </section>
  );
}

function FirstCaseMomentum({ item }: { item: CaseSummary }) {
  return (
    <section className="rounded-lg border border-amber-300/30 bg-[#fff8eb] p-5 text-stone-950 shadow-sm">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
            First case live
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {caseTitle(item)} is now your proof of value.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Use this matter to check the hearing workflow. When you try to add a
            second case, Dockethq will show pricing before saving it.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/cases/${item.id}`}
            className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Open case
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white"
          >
            Try second case
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [events, setEvents] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceSummary>({
    firmName: "Dockethq workspace",
    practiceType: "solo",
    role: "owner",
    planType: "free",
  });

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!ignore) {
          setCases([]);
          setEvents([]);
          setLoading(false);
        }
        return;
      }

      if (user) {
        const { data: member } = await supabase
          .from("firm_members")
          .select("firm_id,role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (member?.firm_id) {
          const { data: firm } = await supabase
            .from("firms")
            .select("*")
            .eq("id", member.firm_id)
            .maybeSingle();

          if (!ignore) {
            setWorkspace({
              firmName:
                firm?.name ||
                user.user_metadata?.firm_name ||
                "Dockethq workspace",
              practiceType: normalizePracticeType(
                firm?.practice_type || user.user_metadata?.practice_type
              ),
              role: member.role || "owner",
              planType: firm?.plan_type || "free",
            });
          }
        } else if (!ignore) {
          setWorkspace({
            firmName: user.user_metadata?.firm_name || "Dockethq workspace",
            practiceType: normalizePracticeType(
              user.user_metadata?.practice_type
            ),
            role: "owner",
            planType: "free",
          });
        }
      }

      const { data, error } = await supabase
        .from("cases")
        .select("*");

      const { data: timeline } = await supabase
        .from("case_events")
        .select("id,title,occurred_at,source")
        .order("occurred_at", { ascending: false })
        .limit(5);

      if (ignore) return;

      if (!error) {
        setCases(data || []);
      }

      setEvents(timeline || []);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const upcomingHearings = useMemo(() => {
    return cases
      .filter((item) => hearingDate(item))
      .sort(
        (a, b) =>
          new Date(hearingDate(a) || "").getTime() -
          new Date(hearingDate(b) || "").getTime()
      )
      .slice(0, 6);
  }, [cases]);

  const verificationQueue = useMemo(
    () =>
      cases
        .filter((item) =>
          ["needs_review", "sync_failed", "auto_synced", "unverified"].includes(
            item.verification_status || "unverified"
          )
        )
        .slice(0, 5),
    [cases]
  );

  const nextHearing = upcomingHearings[0];
  const reminders = useMemo<ReminderItem[]>(() => {
    return upcomingHearings
      .flatMap((item) =>
        buildHearingReminders(hearingDate(item) || "", caseTitle(item)).map(
          (reminder, index) => ({
            ...reminder,
            id: `${item.id}-${index}`,
            case_id: item.id,
          })
        )
      )
      .sort(
        (a, b) =>
          new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()
      )
      .slice(0, 5);
  }, [upcomingHearings]);
  const copy = dashboardCopy(workspace.practiceType);
  const isFirmWorkspace = workspace.practiceType === "firm";

  const stats = [
    {
      label: copy.matterLabel,
      value: cases.length.toString(),
      icon: Gavel,
      tone: "text-stone-200",
    },
    {
      label: "Hearing dates",
      value: upcomingHearings.length.toString(),
      icon: CalendarDays,
      tone: "text-amber-200",
    },
    {
      label: "Need check",
      value: verificationQueue.length.toString(),
      icon: ShieldCheck,
      tone: "text-emerald-200",
    },
    {
      label: "Reminders",
      value: reminders.length.toString(),
      icon: CalendarDays,
      tone: "text-sky-200",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0d0c0a] text-stone-100 shadow-2xl shadow-black/20">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-stone-400">
                Dockethq
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-emerald-200">
                {copy.badge}
              </span>
            </div>

            <div className="mt-10 max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">
                {copy.heading}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-400">
                {copy.description}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cases/new"
                className="inline-flex items-center gap-2 rounded-md bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-white"
              >
                <Plus className="h-4 w-4" />
                {copy.primaryAction}
              </Link>
              <Link
                href="/cases"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-stone-100 transition hover:bg-white/[0.08]"
              >
                {copy.secondaryAction}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.03] p-6 lg:border-l lg:border-t-0 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
              Next listed matter
            </p>
            {nextHearing ? (
              <Link href={`/cases/${nextHearing.id}`} className="mt-8 block">
                <p className="text-5xl font-semibold tracking-tight text-stone-50">
                  {formatDate(hearingDate(nextHearing)).split(" ")[0]}
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.24em] text-amber-200">
                  {formatDate(hearingDate(nextHearing))}
                </p>
                <h2 className="mt-8 text-xl font-semibold leading-7 text-stone-100">
                  {caseTitle(nextHearing)}
                </h2>
                <p className="mt-2 text-sm text-stone-400">
                  {nextHearing.court_name || "Court not set"}
                </p>
              </Link>
            ) : (
              <div className="mt-8">
                <p className="text-3xl font-semibold text-stone-100">
                  No dates yet
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-400">
                  Add your first matter to start building the docket.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <Icon className={`h-4 w-4 ${stat.tone}`} />
              </div>
              <p className="mt-5 text-4xl font-semibold tracking-tight">
                {stat.value}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              {isFirmWorkspace ? (
                <Building2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <UserRound className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Workspace profile
              </p>
              <h2 className="mt-2 truncate text-xl font-semibold">
                {workspace.firmName}
              </h2>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {practiceLabel(workspace.practiceType)} - {workspace.role} -{" "}
                {workspace.planType}
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent"
          >
            Workspace settings
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {copy.setupTitle}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {copy.setupItems.map((item) => (
              <div key={item} className="rounded-md border border-border bg-background p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loading && (
        <section className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading your docket...
        </section>
      )}

      {!loading && cases.length === 0 && (
        <EmptyDashboardState isFirmWorkspace={isFirmWorkspace} />
      )}

      {!loading && cases.length === 1 && (
        <FirstCaseMomentum item={cases[0]} />
      )}

      {!loading && cases.length > 0 && (
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Docket
              </p>
              <h2 className="mt-1 text-xl font-semibold">Upcoming hearings</h2>
            </div>
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:bg-accent"
            >
              All cases
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {upcomingHearings.map((hearing) => {
              const badge = hearingBadge(hearingDate(hearing) || "");

              return (
                <Link
                  href={`/cases/${hearing.id}`}
                  key={hearing.id}
                  className="grid gap-4 p-5 transition hover:bg-accent/60 md:grid-cols-[140px_1fr_auto]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {formatDate(hearingDate(hearing))}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Hearing
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold">{caseTitle(hearing)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {hearing.court_name || "Court not set"}
                    </p>
                  </div>

                  <span
                    className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.styles}`}
                  >
                    {badge.label}
                  </span>
                </Link>
              );
            })}

            {upcomingHearings.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No hearing dates saved.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Review
              </p>
              <h2 className="mt-1 text-xl font-semibold">Verification queue</h2>
            </div>

            <div className="divide-y divide-border">
              {verificationQueue.map((item) => (
                <Link
                  href={`/cases/${item.id}`}
                  key={item.id}
                  className="block p-4 transition hover:bg-accent/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{caseTitle(item)}</p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {verificationLabel(item.verification_status || "unverified")}
                      </p>
                    </div>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
                  </div>
                </Link>
              ))}

              {verificationQueue.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nothing waiting for review.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Timeline
              </p>
              <h2 className="mt-1 text-xl font-semibold">Recent activity</h2>
            </div>

            <div className="divide-y divide-border">
              {events.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Activity className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {event.source} - {formatDate(event.occurred_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Case activity will appear here.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Reminders
              </p>
              <h2 className="mt-1 text-xl font-semibold">Upcoming alerts</h2>
            </div>

            <div className="divide-y divide-border">
              {reminders.map((reminder) => (
                <Link
                  href={`/cases/${reminder.case_id}`}
                  key={reminder.id}
                  className="block p-4 transition hover:bg-accent/60"
                >
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <div>
                      <p className="text-sm font-medium">{reminder.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(reminder.remind_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {reminders.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No reminders scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      )}
    </main>
  );
}
