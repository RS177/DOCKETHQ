"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  Building2,
  Gavel,
  Loader2,
  MapPin,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { friendlyAuthError } from "@/app/lib/auth-errors";
import { supabase } from "@/app/lib/supabase";
import {
  normalizePracticeType,
  practiceLabel,
  type PracticeType,
} from "@/app/lib/practice";
import { useToast } from "@/components/toast-provider";

type Workspace = {
  firmId: string | null;
  firmName: string;
  practiceType: PracticeType;
};

const setupSteps = [
  "Practice type confirmed",
  "Workspace details saved",
  "First CNR opens next",
];

function cleanCnr(value: string) {
  return value.replace(/[\s-]/g, "").trim().toUpperCase();
}

export default function OnboardingPage() {
  const router = useRouter();
  const notify = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>({
    firmId: null,
    firmName: "Dockethq workspace",
    practiceType: "solo",
  });
  const [courtFocus, setCourtFocus] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [firstCnr, setFirstCnr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadWorkspace() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (ignore) return;

      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setCourtFocus(currentUser.user_metadata?.court_focus || "");
      setCity(currentUser.user_metadata?.city || "");
      setStateName(currentUser.user_metadata?.state || "");

      const { data: member } = await supabase
        .from("firm_members")
        .select("firm_id")
        .eq("user_id", currentUser.id)
        .limit(1)
        .maybeSingle();

      if (member?.firm_id) {
        const { data: firm } = await supabase
          .from("firms")
          .select("*")
          .eq("id", member.firm_id)
          .maybeSingle();

        if (ignore) return;

        setWorkspace({
          firmId: member.firm_id,
          firmName:
            firm?.name ||
            currentUser.user_metadata?.firm_name ||
            "Dockethq workspace",
          practiceType: normalizePracticeType(
            firm?.practice_type || currentUser.user_metadata?.practice_type
          ),
        });
      } else {
        setWorkspace({
          firmId: null,
          firmName: currentUser.user_metadata?.firm_name || "Dockethq workspace",
          practiceType: normalizePracticeType(
            currentUser.user_metadata?.practice_type
          ),
        });
      }

      setLoading(false);
    }

    void loadWorkspace();

    return () => {
      ignore = true;
    };
  }, []);

  async function continueToFirstCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    const cnr = cleanCnr(firstCnr);

    if (cnr && !/^[A-Z0-9]{16}$/.test(cnr)) {
      notify({
        title: "Check the CNR number",
        description: "CNR should be 16 characters. You can also skip this and add it later.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);

    const nextMetadata = {
      ...user.user_metadata,
      court_focus: courtFocus.trim(),
      city: city.trim(),
      state: stateName.trim(),
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    };

    const { error } = await supabase.auth.updateUser({
      data: nextMetadata,
    });

    if (error) {
      setSaving(false);
      const friendly = friendlyAuthError(error, "Could not save onboarding");
      notify({
        title: friendly.title,
        description: friendly.description,
        variant: "error",
      });
      return;
    }

    if (workspace.firmId) {
      await supabase
        .from("firms")
        .update({
          court_focus: courtFocus.trim() || null,
          city: city.trim() || null,
          state: stateName.trim() || null,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace.firmId);
    }

    setSaving(false);
    router.push(cnr ? `/cases/new?cnr=${encodeURIComponent(cnr)}` : "/cases/new");
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing onboarding...
        </div>
      </main>
    );
  }

  const isFirm = workspace.practiceType === "firm";

  return (
    <main className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <section>
        <div className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground">
          {practiceLabel(workspace.practiceType)}
        </div>

        <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight">
          Set up the first case-tracking loop.
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
          Keep this short. Dockethq only needs enough context to personalize the
          workspace, then it sends you straight into adding the first CNR.
        </p>

        <div className="mt-8 grid gap-3 rounded-lg border border-border bg-card p-5">
          {setupSteps.map((item, index) => (
            <div key={item} className="flex items-center gap-3 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                {index + 1}
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            First case is free. The second case will intentionally ask for a
            paid plan, so lawyers understand the value before paying.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {isFirm ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{workspace.firmName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFirm
                ? "Firm setup for shared litigation tracking."
                : "Solo setup for your personal litigation docket."}
            </p>
          </div>
        </div>

        <form onSubmit={continueToFirstCase} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Scale className="h-4 w-4 text-muted-foreground" />
              Main court focus
            </span>
            <input
              value={courtFocus}
              onChange={(event) => setCourtFocus(event.target.value)}
              placeholder="High Court, District Court, NCLT..."
              className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                City
              </span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Bengaluru"
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">State</span>
              <input
                value={stateName}
                onChange={(event) => setStateName(event.target.value)}
                placeholder="Karnataka"
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Gavel className="h-4 w-4 text-muted-foreground" />
              First CNR number
            </span>
            <input
              value={firstCnr}
              onChange={(event) => setFirstCnr(event.target.value.toUpperCase())}
              placeholder="Optional, 16-character CNR"
              className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>

          <button
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {saving ? "Saving setup..." : firstCnr ? "Continue to First Case" : "Open Add Case"}
          </button>

          <div className="flex items-center gap-2 rounded-md border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-200" />
            After this, Dockethq opens the case creation screen with this CNR
            already filled in.
          </div>
        </form>
      </section>
    </main>
  );
}
