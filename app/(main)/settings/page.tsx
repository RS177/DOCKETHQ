"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Building2,
  ClipboardList,
  Copy,
  CreditCard,
  KeyRound,
  Loader2,
  Mail,
  type LucideIcon,
  Save,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import { friendlyAuthError } from "@/app/lib/auth-errors";
import {
  canInviteMember,
  userLimitForPlan,
} from "@/app/lib/billing";
import { supabase } from "@/app/lib/supabase";
import {
  effectivePracticeType,
  normalizePracticeType,
  practiceLabel,
  type PracticeType,
} from "@/app/lib/practice";
import { getUserDisplayName, UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/components/toast-provider";

type Workspace = {
  memberId: string | null;
  firmId: string | null;
  firmName: string;
  practiceType: PracticeType;
  role: string;
  planType: string;
};

type FirmMember = {
  id: string;
  role: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
};

type FirmInvite = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

export default function AccountSettingsPage() {
  const notify = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [practiceType, setPracticeType] = useState<PracticeType>("solo");
  const [courtFocus, setCourtFocus] = useState("");
  const [city, setCity] = useState("");
  const [lawyerCount, setLawyerCount] = useState("");
  const [staffCount, setStaffCount] = useState("");
  const [practiceAreas, setPracticeAreas] = useState("");
  const [workflowNotes, setWorkflowNotes] = useState("");
  const [members, setMembers] = useState<FirmMember[]>([]);
  const [invites, setInvites] = useState<FirmInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("lawyer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>({
    memberId: null,
    firmId: null,
    firmName: "",
    practiceType: "solo",
    role: "owner",
    planType: "free",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadSettings() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (ignore) return;

      setUser(currentUser);
      setFullName(getUserDisplayName(currentUser));

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const authFirmName = currentUser.user_metadata?.firm_name || "";
      const authPracticeType = normalizePracticeType(
        currentUser.user_metadata?.practice_type
      );
      setFirmName(authFirmName);
      setPracticeType(authPracticeType);

      const { data: member } = await supabase
        .from("firm_members")
        .select("id,firm_id,role,display_name")
        .eq("user_id", currentUser.id)
        .limit(1)
        .maybeSingle();

      if (!member?.firm_id) {
        if (!ignore) setLoading(false);
        return;
      }

      const { data: firm } = await supabase
        .from("firms")
        .select("*")
        .eq("id", member.firm_id)
        .maybeSingle();

      if (ignore) return;

      const resolvedFirmName = firm?.name || authFirmName || "Firm workspace";
      const resolvedPracticeType = effectivePracticeType(
        firm?.practice_type || authPracticeType,
        firm?.plan_type
      );

      setWorkspace({
        memberId: member.id,
        firmId: member.firm_id,
        firmName: resolvedFirmName,
        practiceType: resolvedPracticeType,
        role: member.role || "owner",
        planType: firm?.plan_type || "free",
      });
      setFirmName(resolvedFirmName);
      setPracticeType(resolvedPracticeType);
      setCourtFocus(firm?.court_focus || "");
      setCity(firm?.city || "");
      setLawyerCount(firm?.lawyer_count ? String(firm.lawyer_count) : "");
      setStaffCount(firm?.staff_count ? String(firm.staff_count) : "");
      setPracticeAreas(firm?.practice_areas || "");
      setWorkflowNotes(firm?.custom_workflow_notes || "");

      const { data: memberRows } = await supabase
        .from("firm_members")
        .select("id,role,display_name,phone,created_at")
        .eq("firm_id", member.firm_id)
        .order("created_at", { ascending: true });

      const { data: inviteRows } = await supabase
        .from("firm_invites")
        .select("id,email,role,status,created_at")
        .eq("firm_id", member.firm_id)
        .order("created_at", { ascending: false });

      if (ignore) return;

      setMembers((memberRows || []) as FirmMember[]);
      setInvites((inviteRows || []) as FirmInvite[]);
      setLoading(false);
    }

    void loadSettings();

    return () => {
      ignore = true;
    };
  }, []);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setSaving(true);

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        full_name: fullName.trim(),
        firm_name: firmName.trim(),
        practice_type: practiceType,
      },
    });

    if (authError) {
      setSaving(false);
      const friendly = friendlyAuthError(authError, "Could not save settings");
      notify({
        title: friendly.title,
        description: friendly.description,
        variant: "error",
      });
      return;
    }

    if (workspace.memberId) {
      await supabase
        .from("firm_members")
        .update({ display_name: fullName.trim() })
        .eq("id", workspace.memberId);
    }

    if (workspace.firmId) {
      const { error: firmUpdateError } = await supabase
        .from("firms")
        .update({
          name: firmName.trim(),
          practice_type: practiceType,
          court_focus: courtFocus.trim() || null,
          city: city.trim() || null,
          lawyer_count: lawyerCount ? Number(lawyerCount) : null,
          staff_count: staffCount ? Number(staffCount) : null,
          practice_areas: practiceAreas.trim() || null,
          custom_workflow_notes: workflowNotes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace.firmId);

      if (firmUpdateError) {
        await supabase
          .from("firms")
          .update({
            name: firmName.trim(),
            court_focus: courtFocus.trim() || null,
            city: city.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workspace.firmId);
      }
    }

    setWorkspace((current) => ({
      ...current,
      firmName: firmName.trim() || current.firmName,
      practiceType,
    }));
    setUser((current) =>
      current
        ? {
            ...current,
            user_metadata: {
              ...current.user_metadata,
              full_name: fullName.trim(),
              firm_name: firmName.trim(),
              practice_type: practiceType,
            },
          }
        : current
    );
    setSaving(false);
    notify({
      title: "Settings saved",
      description: "Your profile and workspace details are up to date.",
      variant: "success",
    });
  }

  async function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace.firmId || !user || !inviteEmail.trim()) return;

    const activeInviteCount = invites.filter(
      (invite) => invite.status === "pending"
    ).length;
    const currentTeamUsage = members.length + activeInviteCount;

    if (workspace.planType !== "enterprise") {
      notify({
        title: "Custom Workflow plan required",
        description:
          "Team invites are included in the Rs 999 Custom Workflow plan.",
        variant: "warning",
      });
      return;
    }

    if (!canInviteMember(workspace.planType, currentTeamUsage)) {
      notify({
        title: "Team limit reached",
        description:
          "Custom Workflow includes up to 5 users. Extra users can be added at Rs 97/user/month.",
        variant: "warning",
      });
      return;
    }

    setInviteLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch("/api/invites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      invite?: FirmInvite;
      email_sent?: boolean;
      email_error?: string | null;
      error?: string;
    };

    setInviteLoading(false);

    if (!response.ok || !result.invite) {
      notify({
        title: "Could not create invite",
        description:
          result.error ||
          "Check that the invite table patch and email settings are configured.",
        variant: "error",
      });
      return;
    }

    setInvites((current) => [result.invite as FirmInvite, ...current]);
    setInviteEmail("");
    notify({
      title: result.email_sent ? "Invite email sent" : "Invite queued",
      description: result.email_sent
        ? "The team member has received a secure workspace invite."
        : result.email_error ||
          "The invite was created. Copy the invite link and send it manually.",
      variant: result.email_sent ? "success" : "warning",
    });
  }

  async function copyInviteLink(inviteId: string) {
    const origin =
      typeof window === "undefined" ? "" : window.location.origin;
    const inviteLink = `${origin}/invite/${inviteId}`;

    await navigator.clipboard.writeText(inviteLink);
    notify({
      title: "Invite link copied",
      description: "Send this link to the team member you invited.",
      variant: "success",
    });
  }

  async function sendPasswordReset() {
    if (!user?.email) return;

    setSecurityLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setSecurityLoading(false);

    if (error) {
      const friendly = friendlyAuthError(error, "Could not send reset email");
      notify({
        title: friendly.title,
        description: friendly.description,
        variant: "error",
      });
      return;
    }

    notify({
      title: "Password reset sent",
      description: "Check your inbox for the reset link.",
      variant: "success",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading account settings...
        </div>
      </main>
    );
  }

  const pendingInviteCount = invites.filter(
    (invite) => invite.status === "pending"
  ).length;
  const userLimit = userLimitForPlan(workspace.planType);
  const teamUsage = members.length + pendingInviteCount;
  const canUseTeamInvites = workspace.planType === "enterprise";
  const teamLimitReached = teamUsage >= userLimit;

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0d0c0a] text-stone-100 shadow-2xl shadow-black/20">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size="lg" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
                  Account
                </p>
                <h1 className="mt-2 truncate text-4xl font-semibold tracking-tight sm:text-5xl">
                  {getUserDisplayName(user)}
                </h1>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-6 text-stone-400">
              Keep the lawyer profile, firm identity, and access basics clean.
              This is what DocketHQ uses across the workspace.
            </p>
          </div>

          <div className="border-t border-white/10 bg-white/[0.03] p-6 lg:border-l lg:border-t-0 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
              Workspace
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-stone-50">
              {workspace.firmName || "Firm workspace"}
            </h2>
            <p className="mt-3 text-sm capitalize text-stone-400">
              {practiceLabel(workspace.practiceType)} - {label(workspace.role)} on{" "}
              {label(workspace.planType)} plan
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <form
          onSubmit={saveSettings}
          className="rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">Profile details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Used for your avatar, account menu, and firm activity.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Practice type</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPracticeType("solo")}
                  className={`rounded-lg border p-4 text-left transition ${
                    practiceType === "solo"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <UserRound className="h-5 w-5" />
                  <p className="mt-3 text-sm font-semibold">Solo practice</p>
                  <p className="mt-1 text-xs leading-5 opacity-75">
                    Independent lawyer workspace.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPracticeType("firm")}
                  className={`rounded-lg border p-4 text-left transition ${
                    practiceType === "firm"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <p className="mt-3 text-sm font-semibold">Firm owner</p>
                  <p className="mt-1 text-xs leading-5 opacity-75">
                    Firm, chamber, or team workspace.
                  </p>
                </button>
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium">Your name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                placeholder="Adv. Aarya Mehta"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Email</span>
              <input
                value={user?.email || ""}
                readOnly
                className="w-full rounded-md border border-border bg-muted px-4 py-3 text-muted-foreground outline-none"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">
                {practiceType === "solo" ? "Practice name" : "Firm name"}
              </span>
              <input
                value={firmName}
                onChange={(event) => setFirmName(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                placeholder={
                  practiceType === "solo"
                    ? "Aarya Mehta's Practice"
                    : "Mehta & Associates"
                }
              />
            </label>

            {practiceType === "firm" && (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-medium">Primary courts</span>
                  <input
                    value={courtFocus}
                    onChange={(event) => setCourtFocus(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="High Court, District Court, NCLT"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">City</span>
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="Bengaluru"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Lawyers</span>
                  <input
                    type="number"
                    min="1"
                    value={lawyerCount}
                    onChange={(event) => setLawyerCount(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="4"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Associates / staff</span>
                  <input
                    type="number"
                    min="0"
                    value={staffCount}
                    onChange={(event) => setStaffCount(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="6"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium">Practice areas</span>
                  <input
                    value={practiceAreas}
                    onChange={(event) => setPracticeAreas(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="Civil, commercial, arbitration, recovery"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium">
                    Custom workflow notes
                  </span>
                  <textarea
                    value={workflowNotes}
                    onChange={(event) => setWorkflowNotes(event.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="How does the firm add CNRs, verify case status, assign owners, and prepare for hearings?"
                  />
                </label>
              </>
            )}
          </div>

          <button
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>

        <div className="space-y-6">
          <InfoCard
            icon={Building2}
            title={
              workspace.practiceType === "firm"
                ? "Firm access"
                : "Solo practice access"
            }
            description={`${practiceLabel(workspace.practiceType)} workspace with ${label(workspace.role)} access in ${
              workspace.firmName || "your firm"
            }.`}
          />

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Billing</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Current plan:{" "}
                  <span className="capitalize">{label(workspace.planType)}</span>.
                  Manage the case limit and paid plan from billing.
                </p>
                <Link
                  href="/billing"
                  className="mt-4 inline-flex rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent"
                >
                  Open Billing
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Security</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Send a password reset email to your signed-in address.
                </p>
                <button
                  type="button"
                  onClick={sendPasswordReset}
                  disabled={securityLoading || !user?.email}
                  className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent disabled:opacity-60"
                >
                  {securityLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {workspace.practiceType === "firm" && (
        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold">Invite lawyers</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rs 999 Custom Workflow includes up to 5 users. Extra users
                  can be added at Rs 97/user/month.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Team usage
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {teamUsage}/{userLimit} users
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Counts active members plus pending invites.
              </p>
            </div>

            {!canUseTeamInvites && (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900">
                Team invites unlock on the Custom Workflow plan.
              </div>
            )}

            <form onSubmit={createInvite} className="mt-6 space-y-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                placeholder="lawyer@firm.com"
              />

              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
              >
                <option value="admin">Admin</option>
                <option value="lawyer">Lawyer</option>
                <option value="associate">Associate</option>
              </select>

              <button
                disabled={
                  inviteLoading ||
                  !inviteEmail.trim() ||
                  !canUseTeamInvites ||
                  teamLimitReached
                }
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {inviteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {inviteLoading ? "Queuing..." : "Queue Invite"}
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UsersRound className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold">Team workspace</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Members and pending invites for case assignment.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {members.length === 0 ? (
                <p className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
                  No team members loaded yet.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {member.display_name || "Team member"}
                      </p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {label(member.role)}
                      </p>
                    </div>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>

            {invites.length > 0 && (
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-semibold">Pending invites</p>
                <div className="mt-3 grid gap-3">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-4"
                    >
                      <div>
                        <p className="font-semibold">{invite.email}</p>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {label(invite.role)} - {label(invite.status)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyInviteLink(invite.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold transition hover:bg-accent"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy link
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
