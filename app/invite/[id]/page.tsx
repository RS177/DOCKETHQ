"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail, ShieldCheck, UsersRound } from "lucide-react";
import { friendlyAuthError } from "@/app/lib/auth-errors";
import { supabase } from "@/app/lib/supabase";
import { BrandLogo } from "@/components/brand-logo";
import { useToast } from "@/components/toast-provider";

type InviteDetails = {
  id: string;
  email: string;
  role: string;
  status: string;
  firm_name: string;
};

export default function InvitePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const inviteId = params.id;
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [signedInEmail, setSignedInEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadInvite() {
      const [
        inviteResponse,
        {
          data: { user },
        },
      ] = await Promise.all([
        fetch(`/api/invites/${inviteId}`),
        supabase.auth.getUser(),
      ]);

      if (ignore) return;

      if (user?.email) {
        setSignedInEmail(user.email);
      }

      if (!inviteResponse.ok) {
        setError("This invite could not be found or is no longer available.");
        setLoading(false);
        return;
      }

      const inviteData = (await inviteResponse.json()) as InviteDetails;
      setInvite(inviteData);
      setLoading(false);
    }

    void loadInvite();

    return () => {
      ignore = true;
    };
  }, [inviteId]);

  async function acceptInvite() {
    setAccepting(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setAccepting(false);
      router.push(`/login?redirectTo=${encodeURIComponent(`/invite/${inviteId}`)}`);
      return;
    }

    const response = await fetch(`/api/invites/${inviteId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    setAccepting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      const friendly = friendlyAuthError(
        new Error(body?.error || "Could not accept invite"),
        "Could not accept invite"
      );
      setError(friendly.description);
      notify({
        title: friendly.title,
        description: friendly.description,
        variant: "error",
      });
      return;
    }

    await fetch("/api/auth/session-marker", {
      method: "POST",
    });

    notify({
      title: "Invite accepted",
      description: "You now have access to the firm workspace.",
      variant: "success",
    });
    router.push("/dashboard");
  }

  const loginHref = `/login?redirectTo=${encodeURIComponent(`/invite/${inviteId}`)}`;
  const signupHref = `/signup?redirectTo=${encodeURIComponent(`/invite/${inviteId}`)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0c0a] px-6 text-stone-100">
      <div className="fixed left-6 top-6 rounded-xl border border-[#E3D6C1] bg-[#F7F3EA] px-4 py-2 shadow-xl shadow-black/20">
        <BrandLogo />
      </div>

      <section className="w-full max-w-lg rounded-lg border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-stone-100 text-stone-950">
          <UsersRound className="h-5 w-5" />
        </div>

        {loading ? (
          <div className="mt-8 flex items-center gap-3 text-sm text-stone-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading invite...
          </div>
        ) : error && !invite ? (
          <>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">
              Invite unavailable
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-400">{error}</p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-md bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-950"
            >
              Back to home
            </Link>
          </>
        ) : invite ? (
          <>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Firm invite
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Join {invite.firm_name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              You have been invited as{" "}
              <span className="font-semibold text-stone-100">
                {invite.role.replaceAll("_", " ")}
              </span>{" "}
              in this DocketHQ firm workspace.
            </p>

            <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3 text-sm text-stone-300">
                <Mail className="h-4 w-4 text-stone-500" />
                Invite email: {invite.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-300">
                <ShieldCheck className="h-4 w-4 text-stone-500" />
                Status: {invite.status}
              </div>
              {signedInEmail && (
                <div className="flex items-center gap-3 text-sm text-stone-300">
                  <CheckCircle2 className="h-4 w-4 text-stone-500" />
                  Signed in as: {signedInEmail}
                </div>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                {error}
              </div>
            )}

            {signedInEmail ? (
              <button
                onClick={acceptInvite}
                disabled={accepting || invite.status !== "pending"}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-4 py-3 font-semibold text-stone-950 transition hover:bg-white disabled:opacity-60"
              >
                {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
                {invite.status === "pending"
                  ? accepting
                    ? "Accepting invite..."
                    : "Accept invite"
                  : "Invite already used"}
              </button>
            ) : (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href={loginHref}
                  className="inline-flex items-center justify-center rounded-md bg-stone-100 px-4 py-3 font-semibold text-stone-950 transition hover:bg-white"
                >
                  Sign in
                </Link>
                <Link
                  href={signupHref}
                  className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-3 font-semibold text-stone-100 transition hover:bg-white/[0.06]"
                >
                  Create account
                </Link>
              </div>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
