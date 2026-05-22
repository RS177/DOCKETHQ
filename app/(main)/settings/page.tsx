"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Building2,
  CreditCard,
  KeyRound,
  Loader2,
  type LucideIcon,
  Save,
  UserRound,
} from "lucide-react";
import { friendlyAuthError } from "@/app/lib/auth-errors";
import { supabase } from "@/app/lib/supabase";
import {
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

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

export default function AccountSettingsPage() {
  const notify = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [practiceType, setPracticeType] = useState<PracticeType>("solo");
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
      const resolvedPracticeType = normalizePracticeType(
        firm?.practice_type || authPracticeType
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace.firmId);

      if (firmUpdateError) {
        await supabase
          .from("firms")
          .update({
            name: firmName.trim(),
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
              This is what Dockethq uses across the workspace.
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
