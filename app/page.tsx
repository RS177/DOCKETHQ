import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  Gavel,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const docketRows = [
  {
    title: "State of Karnataka v. Ramesh B.",
    court: "High Court",
    status: "Pending",
    date: "24 May",
    tone: "text-emerald-300",
  },
  {
    title: "Apex Constructions v. Nirman Pvt. Ltd.",
    court: "Commercial Court",
    status: "Needs review",
    date: "27 May",
    tone: "text-amber-200",
  },
  {
    title: "Meera Sharma v. ICICI Bank",
    court: "District Court",
    status: "Checked",
    date: "03 Jun",
    tone: "text-sky-200",
  },
];

const signals = [
  ["Active matters", "18"],
  ["Hearings this week", "07"],
  ["Need verification", "03"],
];

const features = [
  {
    title: "CNR-first tracking",
    description:
      "Start from the identifier lawyers already use, then keep the matter organized around status and hearing dates.",
    icon: Search,
  },
  {
    title: "Verification queue",
    description:
      "Every matter shows whether it came from a source, failed to sync, or needs manual review.",
    icon: ShieldCheck,
  },
  {
    title: "Hearing readiness",
    description:
      "Upcoming dates, reminder windows, and status changes stay visible before the listing gets close.",
    icon: Bell,
  },
];

const steps = [
  {
    title: "Add a CNR",
    description:
      "Create the matter once with the CNR, court, stage, client-facing title, and next hearing.",
    icon: Gavel,
  },
  {
    title: "Track the update",
    description:
      "Dockethq records source checks, manual changes, hearing movement, and review status.",
    icon: RefreshCw,
  },
  {
    title: "Act before the date",
    description:
      "The dashboard keeps the next listing, reminders, and verification queue in one focused view.",
    icon: CalendarDays,
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#071427]">
      <nav className="sticky top-0 z-30 border-b border-[#E8DCC8] bg-[#F7F3EA]/90 px-4 py-4 backdrop-blur sm:px-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <BrandLogo className="shrink-0" />

          <div className="hidden items-center gap-8 text-sm font-semibold text-[#344256] md:flex">
            <a href="#workflow" className="transition hover:text-[#071427]">
              Workflow
            </a>
            <a href="#trust" className="transition hover:text-[#071427]">
              Trust
            </a>
            <Link href="/terms" className="transition hover:text-[#071427]">
              Terms
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-md border border-[#D6C6AA] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#FFFDF8] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup?redirectTo=/onboarding"
              className="inline-flex items-center gap-2 rounded-md bg-[#071427] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-[#071427]/10 transition hover:-translate-y-0.5 hover:bg-[#111d33] sm:px-4"
            >
              Start Free
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-5 pb-10 pt-5">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-[#E3D6C1] bg-[#071427] text-white shadow-2xl shadow-[#D9C7AA]/40">
          <div className="relative min-h-[680px] lg:min-h-[720px]">
            <div className="absolute inset-0 opacity-20">
              <div className="grid h-full grid-cols-12 gap-px">
                {Array.from({ length: 144 }).map((_, index) => (
                  <div key={index} className="bg-white/10" />
                ))}
              </div>
            </div>

            <div className="absolute right-0 top-20 hidden w-[54rem] rotate-[-6deg] lg:block">
              <div className="rounded-lg border border-white/10 bg-[#0B1C32]/95 p-4 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C49A51]">
                      Litigation command
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Today&apos;s docket
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                    <ShieldCheck className="h-4 w-4" />
                    Private workspace
                  </div>
                </div>

                <div className="grid gap-3 py-4 sm:grid-cols-3">
                  {signals.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-md border border-white/10 bg-white/[0.04] p-4"
                    >
                      <p className="text-xs text-stone-400">{label}</p>
                      <p className="mt-3 text-3xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {docketRows.map((row) => (
                    <div
                      key={row.title}
                      className="grid items-center gap-4 rounded-md border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08] md:grid-cols-[1fr_130px_120px_90px]"
                    >
                      <div>
                        <p className="font-semibold">{row.title}</p>
                        <p className="mt-1 text-sm text-stone-400">
                          {row.court}
                        </p>
                      </div>
                      <div className="text-sm text-stone-300">
                        Next hearing
                      </div>
                      <div className={`text-sm font-semibold ${row.tone}`}>
                        {row.status}
                      </div>
                      <div className="rounded-md bg-white/10 px-3 py-2 text-center text-sm font-semibold">
                        {row.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex min-h-[680px] max-w-4xl flex-col justify-center px-6 py-14 sm:px-10 lg:min-h-[720px] lg:px-14">
              <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#C49A51]/30 bg-[#C49A51]/10 px-3 py-2 text-sm font-semibold text-[#F0D6A6]">
                <LockKeyhole className="h-4 w-4" />
                Built for private litigation tracking
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[0.96] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Litigation tracking for Indian lawyers.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
                Dockethq turns one CNR into a focused matter workspace for case
                status, hearing dates, verification history, and reminders.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup?redirectTo=/onboarding"
                  className="inline-flex items-center gap-2 rounded-md bg-[#F7F3EA] px-5 py-3 font-semibold text-[#071427] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Start with one free case
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  View dashboard
                </Link>
              </div>

              <div className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  ["No public case dashboard", ShieldCheck],
                  ["Court-source status labels", FileCheck2],
                  ["One-case free pilot", CheckCircle2],
                ].map(([label, Icon]) => {
                  const ItemIcon = Icon as typeof ShieldCheck;

                  return (
                    <div
                      key={label as string}
                      className="flex items-center gap-2 text-sm text-stone-300"
                    >
                      <ItemIcon className="h-4 w-4 text-[#C49A51]" />
                      {label as string}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="px-5 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B58A42]">
                Core workflow
              </p>
              <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#071427] md:text-5xl">
                The product stays focused on the next hearing.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#64748B]">
              No bloated CRM, no generic task maze. The first version is built
              around the litigation loop lawyers actually repeat every week.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-lg border border-[#E3D6C1] bg-white/80 p-6 shadow-xl shadow-[#D9C7AA]/15 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#F0E6D6] text-[#B58A42]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-sm text-[#B58A42]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#64748B]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-10">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-lg border border-[#E3D6C1] bg-[#071427] p-8 text-white shadow-2xl shadow-[#D9C7AA]/25">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C49A51]">
              Why it feels premium
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-[2.1rem]">
              Trust is designed into the workflow.
            </h2>
            <p className="mt-5 text-sm leading-7 text-stone-300">
              Lawyers need to know what was checked, when it was checked, and
              what still needs review. Dockethq makes that status visible.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-lg border border-[#E3D6C1] bg-white/80 p-6 shadow-xl shadow-[#D9C7AA]/15 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <Icon className="h-6 w-6 text-[#B58A42]" />
                  <h3 className="mt-5 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#64748B]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="trust" className="px-5 py-10">
        <div className="mx-auto max-w-7xl rounded-lg border border-[#E3D6C1] bg-white/80 p-6 shadow-xl shadow-[#D9C7AA]/15">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              ["Private by default", LockKeyhole],
              ["Terms accepted before signup", FileCheck2],
              ["CNR data masked in lists", Database],
              ["Reminder-ready hearings", Clock3],
            ].map(([label, Icon]) => {
              const ItemIcon = Icon as typeof LockKeyhole;

              return (
                <div key={label as string} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F0E6D6] text-[#B58A42]">
                    <ItemIcon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#344256]">
                    {label as string}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 pt-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-lg border border-[#E3D6C1] bg-[#FBF8F1] p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B58A42]">
              Start focused
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Add one case. Prove the tracking loop.
            </h2>
          </div>
          <Link
            href="/signup?redirectTo=/onboarding"
            className="inline-flex items-center gap-2 rounded-md bg-[#071427] px-5 py-3 font-semibold text-white shadow-lg shadow-[#071427]/10 transition hover:-translate-y-0.5 hover:bg-[#111d33]"
          >
            Create workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
