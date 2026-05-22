"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  FileSearch,
  Gavel,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { maskCnr } from "@/app/lib/confidentiality";
import { useToast } from "@/components/toast-provider";

type CaseItem = {
  id: string;
  cnr_number?: string | null;
  title?: string | null;
  case_title?: string | null;
  court_name: string | null;
  status?: string | null;
  current_status?: string | null;
  current_stage: string | null;
  next_hearing_date?: string | null;
  next_hearing?: string | null;
  verification_status?: string | null;
};

export default function CasesPage() {
  const notify = useToast();
  const [search] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("search") || ""
  );
  const [cases, setCases] = useState<CaseItem[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadCases() {
      const { data, error } = await supabase
        .from("cases")
        .select("*");

      if (ignore) return;

      if (error) {
        notify({
          title: "Could not load cases",
          description: error.message,
          variant: "error",
        });
        return;
      }

      setCases(data || []);
    }

    void loadCases();

    return () => {
      ignore = true;
    };
  }, [notify]);

  const filteredCases = cases.filter((item) => {
    const normalizedSearch = search.toLowerCase();

    if (!normalizedSearch) return true;

    return [
      item.title,
      item.case_title,
      item.cnr_number,
      item.court_name,
      item.status,
      item.current_status,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedSearch));
  });

  return (
    <main>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Matter list
            </p>
            <h1 className="mt-3 text-4xl font-bold">Tracked Cases</h1>

            <p className="mt-2 text-muted-foreground">
              All matters being tracked in Dockethq.
            </p>
          </div>

          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add case
          </Link>
        </div>

        <div className="mt-8 grid gap-5">
          {filteredCases.map((item) => (
            <Link
              href={`/cases/${item.id}`}
              key={item.id}
              className="block rounded-lg border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {item.title || item.case_title || "Untitled matter"}
                  </h2>

                  <p className="mt-1 text-muted-foreground">
                    {item.court_name}
                  </p>
                </div>

                <span className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">
                  {item.status || item.current_status || "unknown"}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <p>
                  <span className="font-semibold">CNR:</span>{" "}
                  {maskCnr(item.cnr_number)}
                </p>

                <p>
                  <span className="font-semibold">
                    Next Hearing:
                  </span>{" "}
                  {item.next_hearing_date || item.next_hearing || "Not available"}
                </p>

                <p>
                  <span className="font-semibold">
                    Stage:
                  </span>{" "}
                  {item.current_stage || "Not available"}
                </p>
              </div>
            </Link>
          ))}

          {cases.length === 0 && (
            <div className="overflow-hidden rounded-lg border border-[#E3D6C1] bg-[#F7F3EA] text-[#071427] shadow-xl shadow-black/10">
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="p-6 sm:p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#071427] text-white">
                    <Gavel className="h-5 w-5" />
                  </div>
                  <h2 className="mt-8 text-3xl font-semibold tracking-tight">
                    Your first tracked case starts here.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[#64748B]">
                    Add one CNR and Dockethq will build the matter workspace
                    around status, next hearing, verification, and reminders.
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
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-md border border-[#D6C6AA] bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white"
                    >
                      View dashboard
                    </Link>
                  </div>
                </div>

                <div className="border-t border-[#E3D6C1] bg-white/60 p-6 lg:border-l lg:border-t-0 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B58A42]">
                    Case workspace includes
                  </p>
                  <div className="mt-6 grid gap-3">
                    {[
                      ["CNR record", "Masked in lists for privacy.", FileSearch],
                      ["Hearing date", "Visible before the listing.", CalendarDays],
                      ["Review status", "Know when a matter needs checking.", ShieldCheck],
                    ].map(([title, description, Icon]) => {
                      const ItemIcon = Icon as typeof Gavel;

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
                </div>
              </div>
            </div>
          )}

          {cases.length > 0 && filteredCases.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <FileSearch className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">No matching cases</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another case title, court name, status, or CNR.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
