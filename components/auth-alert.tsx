"use client";

import { AlertCircle, ShieldCheck } from "lucide-react";

type AuthAlertProps = {
  title: string;
  description: string;
  tone?: "error" | "info";
};

export function AuthAlert({
  title,
  description,
  tone = "error",
}: AuthAlertProps) {
  const Icon = tone === "error" ? AlertCircle : ShieldCheck;
  const styles =
    tone === "error"
      ? "border-red-400/25 bg-red-500/10 text-red-50"
      : "border-emerald-400/25 bg-emerald-500/10 text-emerald-50";

  return (
    <div className={`rounded-lg border p-4 shadow-lg shadow-black/10 ${styles}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-black/20">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}
