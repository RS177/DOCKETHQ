"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, UserRound } from "lucide-react";
import { friendlyAuthError, type FriendlyAuthError } from "@/app/lib/auth-errors";
import { supabase } from "@/app/lib/supabase";
import { TERMS_VERSION } from "@/app/lib/terms";
import { AuthAlert } from "@/components/auth-alert";
import { BrandLogo } from "@/components/brand-logo";
import { useToast } from "@/components/toast-provider";

type PracticeType = "solo" | "firm";

export default function SignupPage() {
  const router = useRouter();
  const notify = useToast();
  const [practiceType, setPracticeType] = useState<PracticeType>("solo");
  const [fullName, setFullName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authError, setAuthError] = useState<FriendlyAuthError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();

    const normalizedName = fullName.trim();
    const normalizedFirmName = firmName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      const missingError = {
        title: "Missing account details",
        description:
          "Add your name, email, and password before creating a workspace.",
      };
      setAuthError(missingError);
      notify({
        title: missingError.title,
        description: missingError.description,
        variant: "warning",
      });
      return;
    }

    if (practiceType === "firm" && !normalizedFirmName) {
      const firmError = {
        title: "Firm name required",
        description: "Firm owner workspaces need a firm or chamber name.",
      };
      setAuthError(firmError);
      notify({
        title: firmError.title,
        description: firmError.description,
        variant: "warning",
      });
      return;
    }

    if (!acceptedTerms) {
      const termsError = {
        title: "Accept the Terms to continue",
        description:
          "Read and accept DocketHQ's Terms of Service before creating a workspace.",
      };
      setAuthError(termsError);
      notify({
        title: termsError.title,
        description: termsError.description,
        variant: "warning",
      });
      return;
    }

    setAuthError(null);
    setLoading(true);
    const workspaceName =
      practiceType === "solo"
        ? normalizedFirmName || `${normalizedName}'s Practice`
        : normalizedFirmName;

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedName,
          firm_name: workspaceName,
          practice_type: practiceType,
          terms_version: TERMS_VERSION,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });

    setLoading(false);

    if (error) {
      const friendly = friendlyAuthError(error, "Could not create workspace");
      setAuthError(friendly);
      notify({
        title: friendly.title,
        description: friendly.description,
        variant: "error",
      });
      return;
    }

    const redirectTo =
      new URLSearchParams(window.location.search).get("redirectTo") ||
      "/onboarding";
    const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/onboarding";

    if (data.session) {
      await fetch("/api/auth/session-marker", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });

      router.replace(safeRedirect);
      router.refresh();
      return;
    }

    const confirmationNotice = {
      title: "Check your email to finish signup",
      description:
        "Open the DocketHQ verification email, then log in with the same email and password.",
    };
    setAuthError(confirmationNotice);
    setPassword("");
    notify({
      title: confirmationNotice.title,
      description: confirmationNotice.description,
      variant: "success",
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0c0a] px-6 text-stone-100">
      <div className="fixed left-6 top-6 rounded-xl border border-[#E3D6C1] bg-[#F7F3EA] px-4 py-2 shadow-xl shadow-black/20">
        <BrandLogo />
      </div>

      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-100 text-stone-950">
          <Building2 className="h-5 w-5" />
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          Create your DocketHQ workspace
        </h1>

        <p className="mt-3 text-sm leading-6 text-stone-400">
          Tell us how you practice so DocketHQ can set up the right workspace
          from day one.
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          {authError && (
            <AuthAlert
              title={authError.title}
              description={authError.description}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setPracticeType("solo");
                setAuthError(null);
              }}
              className={`rounded-lg border p-4 text-left transition ${
                practiceType === "solo"
                  ? "border-stone-100 bg-stone-100 text-stone-950"
                  : "border-white/10 bg-black/20 text-stone-300 hover:bg-white/[0.06]"
              }`}
            >
              <UserRound className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">Solo practice</p>
              <p className="mt-1 text-xs leading-5 opacity-75">
                For an independent lawyer tracking personal matters.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPracticeType("firm");
                setAuthError(null);
              }}
              className={`rounded-lg border p-4 text-left transition ${
                practiceType === "firm"
                  ? "border-stone-100 bg-stone-100 text-stone-950"
                  : "border-white/10 bg-black/20 text-stone-300 hover:bg-white/[0.06]"
              }`}
            >
              <Building2 className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">Firm owner</p>
              <p className="mt-1 text-xs leading-5 opacity-75">
                For a firm, chamber, or team with multiple matters.
              </p>
            </button>
          </div>

          <input
            type="text"
            placeholder="Your name"
            className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 outline-none transition placeholder:text-stone-500 focus:border-stone-200"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
              setAuthError(null);
            }}
          />

          <input
            type="text"
            placeholder={
              practiceType === "solo"
                ? "Practice name (optional)"
                : "Firm / chamber name"
            }
            className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 outline-none transition placeholder:text-stone-500 focus:border-stone-200"
            value={firmName}
            onChange={(event) => {
              setFirmName(event.target.value);
              setAuthError(null);
            }}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 outline-none transition placeholder:text-stone-500 focus:border-stone-200"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setAuthError(null);
            }}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 outline-none transition placeholder:text-stone-500 focus:border-stone-200"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setAuthError(null);
            }}
          />

          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-stone-300">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setAuthError(null);
              }}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black accent-stone-100"
            />
            <span>
              I have read and agree to DocketHQ&apos;s{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-semibold text-stone-100 underline underline-offset-4"
              >
                Terms of Service
              </Link>
              . I understand DocketHQ is workflow software and not a substitute
              for official court records.
            </span>
          </label>

          <button
            disabled={loading || !acceptedTerms}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-4 py-3 font-semibold text-stone-950 transition hover:bg-white disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating workspace..." : "Create Workspace"}
          </button>
        </form>
      </section>
    </main>
  );
}
