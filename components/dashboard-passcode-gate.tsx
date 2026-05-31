"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { BrandLogo } from "@/components/brand-logo";
import { useToast } from "@/components/toast-provider";

type WorkspaceLock = {
  workspaceId: string;
  firmId: string | null;
  firmName: string;
  pinHash: string | null;
  pinSalt: string | null;
};

type ResetStep = "idle" | "email" | "otp" | "new-pin";

function cleanPin(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPin(pin: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isValidPin(pin: string) {
  return /^\d{4}$/.test(pin);
}

function lockSessionKey(lock: WorkspaceLock) {
  return `dockethq_dashboard_unlocked:${lock.workspaceId}:${lock.pinHash || "new"}`;
}

export function DashboardPasscodeGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const notify = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [lock, setLock] = useState<WorkspaceLock | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("idle");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadLock() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (ignore) return;

      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

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

        const firmRecord = (firm || {}) as Record<string, string | null>;
        const nextLock = {
          workspaceId: member.firm_id,
          firmId: member.firm_id,
          firmName: firmRecord.name || "DocketHQ workspace",
          pinHash:
            firmRecord.dashboard_pin_hash ||
            currentUser.user_metadata?.dashboard_pin_hash ||
            null,
          pinSalt:
            firmRecord.dashboard_pin_salt ||
            currentUser.user_metadata?.dashboard_pin_salt ||
            null,
        };

        setLock(nextLock);
        setUnlocked(sessionStorage.getItem(lockSessionKey(nextLock)) === "true");
        setLoading(false);
        return;
      }

      const nextLock = {
        workspaceId: currentUser.id,
        firmId: null,
        firmName: currentUser.user_metadata?.firm_name || "DocketHQ workspace",
        pinHash: currentUser.user_metadata?.dashboard_pin_hash || null,
        pinSalt: currentUser.user_metadata?.dashboard_pin_salt || null,
      };

      setLock(nextLock);
      setUnlocked(sessionStorage.getItem(lockSessionKey(nextLock)) === "true");
      setLoading(false);
    }

    void loadLock();

    return () => {
      ignore = true;
    };
  }, []);

  const mode = useMemo(() => {
    if (!lock?.pinHash || !lock?.pinSalt) return "create";
    return "unlock";
  }, [lock]);

  async function saveFirmPin(
    firmId: string,
    pinHash: string,
    pinSalt: string,
    currentUser: User
  ) {
    const { error } = await supabase
      .from("firms")
      .update({
        dashboard_pin_hash: pinHash,
        dashboard_pin_salt: pinSalt,
        dashboard_pin_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", firmId);

    if (!error) return;

    await supabase.auth.updateUser({
      data: {
        ...currentUser.user_metadata,
        dashboard_pin_hash: pinHash,
        dashboard_pin_salt: pinSalt,
        dashboard_pin_updated_at: new Date().toISOString(),
      },
    });
  }

  async function saveDashboardPin(nextPin: string, currentLock: WorkspaceLock, currentUser: User) {
    const pinSalt = randomSalt();
    const pinHash = await hashPin(nextPin, pinSalt);

    if (currentLock.firmId) {
      await saveFirmPin(currentLock.firmId, pinHash, pinSalt, currentUser);
    } else {
      await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          dashboard_pin_hash: pinHash,
          dashboard_pin_salt: pinSalt,
          dashboard_pin_updated_at: new Date().toISOString(),
        },
      });
    }

    const nextLock = { ...currentLock, pinHash, pinSalt };
    setLock(nextLock);
    sessionStorage.setItem(lockSessionKey(nextLock), "true");
    setUnlocked(true);
    return nextLock;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!lock || !user) return;

    if (!isValidPin(pin)) {
      notify({
        title: "Enter a 4-digit code",
        description: "Use exactly four numbers for the dashboard lock.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);

    if (mode === "create") {
      if (pin !== confirmPin) {
        setSaving(false);
        notify({
          title: "Codes do not match",
          description: "Re-enter the same 4-digit code to create the lock.",
          variant: "warning",
        });
        return;
      }

      await saveDashboardPin(pin, lock, user);
      setUnlocked(true);
      setSaving(false);
      notify({
        title: "Dashboard lock created",
        description: "This workspace now asks for the 4-digit code on new sessions.",
        variant: "success",
      });
      return;
    }

    const attemptedHash = await hashPin(pin, lock.pinSalt!);

    if (attemptedHash !== lock.pinHash) {
      setSaving(false);
      setPin("");
      notify({
        title: "Wrong dashboard code",
        description: "Try the 4-digit code for this DocketHQ workspace.",
        variant: "error",
      });
      return;
    }

    sessionStorage.setItem(lockSessionKey(lock), "true");
    setUnlocked(true);
    setSaving(false);
  }

  async function sendResetOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.email) return;

    const email = resetEmail.trim().toLowerCase();
    const accountEmail = user.email.toLowerCase();

    if (email !== accountEmail) {
      notify({
        title: "Use your account email",
        description: "The reset code can only be sent to the signed-in account email.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    setSaving(false);

    if (error) {
      notify({
        title: "Could not send OTP",
        description: error.message,
        variant: "error",
      });
      return;
    }

    setResetStep("otp");
    notify({
      title: "OTP sent",
      description: "Check your email for the DocketHQ verification code.",
      variant: "success",
    });
  }

  async function verifyResetOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = resetEmail.trim().toLowerCase();
    const token = otp.replace(/\D/g, "").trim();

    if (!email || token.length < 4) {
      notify({
        title: "Enter the OTP",
        description: "Use the code sent to your account email.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setSaving(false);

    if (error) {
      notify({
        title: "OTP did not verify",
        description: error.message,
        variant: "error",
      });
      return;
    }

    if (data.user) {
      setUser(data.user);
    }

    setResetStep("new-pin");
    notify({
      title: "Email verified",
      description: "You can now set a new dashboard code.",
      variant: "success",
    });
  }

  async function resetDashboardPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!lock || !user) return;

    if (!isValidPin(newPin) || newPin !== confirmNewPin) {
      notify({
        title: "Check the new code",
        description: "Enter the same 4-digit code in both fields.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);
    await saveDashboardPin(newPin, lock, user);
    setSaving(false);
    notify({
      title: "Dashboard code reset",
      description: "Use this new 4-digit code for future workspace unlocks.",
      variant: "success",
    });
  }

  function closeResetFlow() {
    setResetStep("idle");
    setResetEmail("");
    setOtp("");
    setNewPin("");
    setConfirmNewPin("");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0c0a] text-stone-100">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-stone-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking workspace lock...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0c0a] px-6 text-stone-100">
        <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/30">
          <LockKeyhole className="mx-auto h-8 w-8 text-amber-200" />
          <h1 className="mt-5 text-3xl font-semibold">Log in again</h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Your browser has a workspace marker, but Supabase does not have an
            active signed-in session.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-white"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0c0a] px-6 text-stone-100">
      <div className="fixed left-6 top-6 rounded-lg border border-[#E3D6C1] bg-[#F7F3EA] px-4 py-2 shadow-xl shadow-black/20">
        <BrandLogo />
      </div>

      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-100 text-stone-950">
          {mode === "create" ? (
            <KeyRound className="h-5 w-5" />
          ) : (
            <LockKeyhole className="h-5 w-5" />
          )}
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
          {lock?.firmName || "DocketHQ workspace"}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {mode === "create" ? "Create dashboard code" : "Unlock dashboard"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          {mode === "create"
            ? "Set a 4-digit privacy code for this workspace. It will be required before the dashboard opens in each new browser session."
            : "Enter the 4-digit workspace code to view the dashboard, cases, billing, and settings."}
        </p>

        {resetStep === "idle" ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="relative">
              <input
                value={pin}
                onChange={(event) => setPin(cleanPin(event.target.value))}
                inputMode="numeric"
                type={showPin ? "text" : "password"}
                placeholder="4-digit code"
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-4 pr-12 text-center text-2xl font-semibold tracking-[0.45em] outline-none transition placeholder:text-base placeholder:tracking-normal placeholder:text-stone-500 focus:border-stone-200"
              />
              <button
                type="button"
                onClick={() => setShowPin((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-stone-400 transition hover:bg-white/10 hover:text-stone-100"
                aria-label={
                  showPin ? "Hide dashboard code" : "Show dashboard code"
                }
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {mode === "create" && (
              <input
                value={confirmPin}
                onChange={(event) => setConfirmPin(cleanPin(event.target.value))}
                inputMode="numeric"
                type={showPin ? "text" : "password"}
                placeholder="Confirm code"
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-4 text-center text-2xl font-semibold tracking-[0.45em] outline-none transition placeholder:text-base placeholder:tracking-normal placeholder:text-stone-500 focus:border-stone-200"
              />
            )}

            <button
              disabled={
                saving ||
                !isValidPin(pin) ||
                (mode === "create" && !isValidPin(confirmPin))
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-4 py-3 font-semibold text-stone-950 transition hover:bg-white disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving
                ? "Checking..."
                : mode === "create"
                ? "Create Code"
                : "Unlock Dashboard"}
            </button>

            {mode === "unlock" && (
              <button
                type="button"
                onClick={() => {
                  setResetStep("email");
                  setResetEmail(user.email || "");
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-stone-200 transition hover:bg-white/[0.06]"
              >
                <RotateCcw className="h-4 w-4" />
                Forgot code? Reset with email OTP
              </button>
            )}
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={closeResetFlow}
              className="inline-flex items-center gap-2 text-sm font-semibold text-stone-300 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to unlock
            </button>

            {resetStep === "email" && (
              <form onSubmit={sendResetOtp} className="space-y-4">
                <div className="rounded-md border border-white/10 bg-black/20 p-4">
                  <Mail className="h-5 w-5 text-amber-200" />
                  <h2 className="mt-4 text-lg font-semibold">
                    Reset with email OTP
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    Enter your signed-in account email. DocketHQ will send an
                    OTP before allowing a new dashboard code.
                  </p>
                </div>
                <input
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  type="email"
                  placeholder="Account email"
                  className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 outline-none transition placeholder:text-stone-500 focus:border-stone-200"
                />
                <button
                  disabled={saving || !resetEmail}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-4 py-3 font-semibold text-stone-950 transition hover:bg-white disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send OTP
                </button>
              </form>
            )}

            {resetStep === "otp" && (
              <form onSubmit={verifyResetOtp} className="space-y-4">
                <div className="rounded-md border border-white/10 bg-black/20 p-4">
                  <h2 className="text-lg font-semibold">Enter email OTP</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    We sent a verification code to {resetEmail}. Enter it here
                    to reset the dashboard code.
                  </p>
                </div>
                <input
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  inputMode="numeric"
                  placeholder="Email OTP"
                  className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-4 text-center text-2xl font-semibold tracking-[0.35em] outline-none transition placeholder:text-base placeholder:tracking-normal placeholder:text-stone-500 focus:border-stone-200"
                />
                <button
                  disabled={saving || otp.length < 4}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-4 py-3 font-semibold text-stone-950 transition hover:bg-white disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify OTP
                </button>
              </form>
            )}

            {resetStep === "new-pin" && (
              <form onSubmit={resetDashboardPin} className="space-y-4">
                <div className="rounded-md border border-white/10 bg-black/20 p-4">
                  <h2 className="text-lg font-semibold">Create new code</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    Your email is verified. Set a fresh 4-digit dashboard code.
                  </p>
                </div>
                <input
                  value={newPin}
                  onChange={(event) => setNewPin(cleanPin(event.target.value))}
                  inputMode="numeric"
                  type={showPin ? "text" : "password"}
                  placeholder="New 4-digit code"
                  className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-4 text-center text-2xl font-semibold tracking-[0.45em] outline-none transition placeholder:text-base placeholder:tracking-normal placeholder:text-stone-500 focus:border-stone-200"
                />
                <input
                  value={confirmNewPin}
                  onChange={(event) =>
                    setConfirmNewPin(cleanPin(event.target.value))
                  }
                  inputMode="numeric"
                  type={showPin ? "text" : "password"}
                  placeholder="Confirm new code"
                  className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-4 text-center text-2xl font-semibold tracking-[0.45em] outline-none transition placeholder:text-base placeholder:tracking-normal placeholder:text-stone-500 focus:border-stone-200"
                />
                <button
                  disabled={
                    saving ||
                    !isValidPin(newPin) ||
                    !isValidPin(confirmNewPin)
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-4 py-3 font-semibold text-stone-950 transition hover:bg-white disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Dashboard Code
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This is a privacy lock after login. Keep using strong passwords and
            Supabase security for real account protection.
          </p>
        </div>
      </section>
    </main>
  );
}
