"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Building2,
  ChevronDown,
  CreditCard,
  LogOut,
  type LucideIcon,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import {
  effectivePracticeType,
  practiceLabel,
  type PracticeType,
} from "@/app/lib/practice";
import { getUserDisplayName, UserAvatar } from "./user-avatar";

type WorkspaceProfile = {
  firmName: string;
  practiceType: PracticeType;
  role: string;
  planType: string;
};

function niceLabel(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

export function UserMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceProfile>({
    firmName: "Firm workspace",
    practiceType: "solo",
    role: "owner",
    planType: "free",
  });

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (ignore) return;

      setUser(currentUser);

      if (!currentUser) return;

      const { data: member } = await supabase
        .from("firm_members")
        .select("firm_id,role,display_name")
        .eq("user_id", currentUser.id)
        .limit(1)
        .maybeSingle();

      if (!member?.firm_id || ignore) return;

      const { data: firm } = await supabase
        .from("firms")
        .select("*")
        .eq("id", member.firm_id)
        .maybeSingle();

      if (ignore) return;

      setWorkspace({
        firmName:
          firm?.name ||
          currentUser.user_metadata?.firm_name ||
          "Firm workspace",
        practiceType: effectivePracticeType(
          firm?.practice_type || currentUser.user_metadata?.practice_type,
          firm?.plan_type
        ),
        role: member.role || "owner",
        planType: firm?.plan_type || "free",
      });
    }

    void loadProfile();

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      ignore = true;
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    await fetch("/api/auth/session-marker", {
      method: "DELETE",
    });
    router.push("/");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2 transition hover:bg-accent"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserAvatar user={user} size="sm" />
        <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
          {getUserDisplayName(user)}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-black/20">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {getUserDisplayName(user)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || "Signed in"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 rounded-md bg-muted p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Practice
                </span>
                <span className="max-w-36 truncate font-medium">
                  {practiceLabel(workspace.practiceType)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Workspace
                </span>
                <span className="max-w-36 truncate font-medium">
                  {workspace.firmName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Role
                </span>
                <span className="capitalize">{niceLabel(workspace.role)}</span>
              </div>
            </div>
          </div>

          <div className="p-2">
            <MenuLink href="/settings" icon={Settings} label="Account settings" />
            <MenuLink
              href="/billing"
              icon={CreditCard}
              label={`Billing - ${niceLabel(workspace.planType)}`}
            />

            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
