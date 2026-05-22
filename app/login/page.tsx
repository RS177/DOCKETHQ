"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { friendlyAuthError, type FriendlyAuthError } from "@/app/lib/auth-errors";
import { supabase } from "@/app/lib/supabase";
import { AuthAlert } from "@/components/auth-alert";
import { BrandLogo } from "@/components/brand-logo";
import { useToast } from "@/components/toast-provider";

export default function LoginPage() {
  const router = useRouter();
  const notify = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<FriendlyAuthError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    if (!email || !password) {
      const missingError = {
        title: "Missing login details",
        description: "Enter both email and password to continue.",
      };
      setAuthError(missingError);
      notify({
        title: missingError.title,
        description: missingError.description,
        variant: "warning",
      });
      return;
    }

    setAuthError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      const friendly = friendlyAuthError(error, "Sign in failed");
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
      "/dashboard";

    await fetch("/api/auth/session-marker", {
      method: "POST",
    });

    router.push(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0c0a] px-6 text-stone-100">
      <div className="fixed left-6 top-6 rounded-xl border border-[#E3D6C1] bg-[#F7F3EA] px-4 py-2 shadow-xl shadow-black/20">
        <BrandLogo />
      </div>

      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-100 text-stone-950">
          <LogIn className="h-5 w-5" />
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          Sign in to Dockethq
        </h1>

        <p className="mt-3 text-sm leading-6 text-stone-400">
          Continue to your case tracking and hearing reminder workspace.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          {authError && (
            <AuthAlert
              title={authError.title}
              description={authError.description}
            />
          )}

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

          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-4 py-3 font-semibold text-stone-950 transition hover:bg-white disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-400">
          No workspace yet?{" "}
          <Link href="/signup" className="font-semibold text-stone-100">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
