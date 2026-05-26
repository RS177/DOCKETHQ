"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  FileArchive,
  FileCheck2,
  Gavel,
  History,
  LayoutDashboard,
  LockKeyhole,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const workflowSteps = [
  {
    title: "Intake",
    copy: "Create a matter from the CNR, court, client, filing details, and the next known date.",
    icon: FileCheck2,
  },
  {
    title: "Plan",
    copy: "Map deadlines, reminders, documents, and responsibility before the next hearing.",
    icon: CalendarCheck2,
  },
  {
    title: "Execute",
    copy: "Track filing work, follow-ups, orders, and team actions inside one matter record.",
    icon: ClipboardList,
  },
  {
    title: "Track",
    copy: "Keep a clear audit trail of status checks, updates, reminders, and every material change.",
    icon: History,
  },
];

const features = [
  {
    title: "Case timeline automation",
    copy: "Turn scattered dates, orders, and status changes into a clean chronological matter timeline.",
    icon: History,
  },
  {
    title: "Smart deadlines & reminders",
    copy: "Surface urgent hearings and due dates early, with email and phone reminder paths ready.",
    icon: Bell,
  },
  {
    title: "Document bundles & filings",
    copy: "Keep draft sets, filing notes, orders, and matter documents connected to the case context.",
    icon: FileArchive,
  },
  {
    title: "Collaboration & audit trails",
    copy: "Give teams one shared source of truth without losing who changed what and when.",
    icon: UsersRound,
  },
];

const personas = [
  {
    title: "Law firms",
    points: [
      "Run active litigation lists without messy spreadsheets.",
      "Give associates a clear queue of what needs attention.",
    ],
    icon: BriefcaseBusiness,
  },
  {
    title: "In-house teams",
    points: [
      "Track external counsel updates in one operating view.",
      "Keep leadership-ready matter status without chasing emails.",
    ],
    icon: Scale,
  },
  {
    title: "Solo litigators",
    points: [
      "Never lose sight of the next hearing or follow-up.",
      "Start with one free matter before committing to a plan.",
    ],
    icon: Gavel,
  },
];

const caseRows = [
  {
    title: "State of Karnataka v. Ramesh B.",
    court: "High Court",
    owner: "A. Mehta",
    status: "Pending",
    date: "24 May",
    tone: "text-emerald-300",
  },
  {
    title: "Apex Constructions v. Nirman Pvt. Ltd.",
    court: "Commercial Court",
    owner: "R. Sinha",
    status: "Needs review",
    date: "27 May",
    tone: "text-[#F6D68C]",
  },
  {
    title: "Meera Sharma v. ICICI Bank",
    court: "District Court",
    owner: "P. Rao",
    status: "Checked",
    date: "03 Jun",
    tone: "text-sky-200",
  },
];

const stats = [
  ["Active matters", "18"],
  ["Hearings this week", "07"],
  ["Need review", "03"],
];

const trustItems = [
  "Private workspaces",
  "Matter-level history",
  "Role-ready access",
  "No legal outcome promises",
];

export default function Page() {
  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F3EA] text-[#071427]">
      <style>{`
        @keyframes floatLine {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: .36; }
          50% { transform: translate3d(14px, -10px, 0); opacity: .58; }
        }

        @keyframes pulseNode {
          0%, 100% { transform: scale(1); opacity: .45; }
          50% { transform: scale(1.6); opacity: .95; }
        }

        @keyframes cardRise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        [data-reveal] {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 360ms ease-out, transform 360ms ease-out;
        }

        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-wire {
          animation: floatLine 8s ease-in-out infinite;
        }

        .hero-wire:nth-child(2) {
          animation-delay: -2.5s;
        }

        .hero-node {
          animation: pulseNode 4.5s ease-in-out infinite;
          transform-origin: center;
        }

        .preview-enter {
          opacity: 0;
          animation: cardRise 520ms ease-out forwards;
        }

        .preview-enter:nth-child(2) {
          animation-delay: 120ms;
        }

        .preview-enter:nth-child(3) {
          animation-delay: 240ms;
        }

        .preview-enter:nth-child(4) {
          animation-delay: 360ms;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.001ms !important;
          }

          [data-reveal] {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-[#E8DCC8] bg-[#F7F3EA]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <BrandLogo className="shrink-0" />

          <div className="hidden items-center gap-7 text-xs font-bold uppercase tracking-[0.12em] text-[#344256] lg:flex">
            <a href="#features" className="transition hover:text-[#B58A42]">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-[#B58A42]">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-[#B58A42]">
              Pricing
            </a>
            <a href="#resources" className="transition hover:text-[#B58A42]">
              Resources
            </a>
            <a href="#demo" className="transition hover:text-[#B58A42]">
              Demo
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-md border border-[#D6C6AA] bg-white/70 px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-[#B58A42] hover:bg-white sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup?redirectTo=/onboarding"
              className="inline-flex items-center gap-2 rounded-md bg-[#071427] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#071427]/15 transition hover:-translate-y-0.5 hover:bg-[#111d33]"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative px-4 pb-16 pt-7 sm:px-6 lg:pb-24">
        <div className="absolute inset-x-0 top-0 h-[760px] overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute left-1/2 top-6 h-[680px] w-[1300px] -translate-x-1/2 opacity-70"
            viewBox="0 0 1300 680"
            fill="none"
          >
            <path
              className="hero-wire"
              d="M90 428 C240 280 350 360 520 245 C720 110 890 150 1115 70"
              stroke="#C49A51"
              strokeOpacity="0.22"
              strokeWidth="2"
            />
            <path
              className="hero-wire"
              d="M160 165 C315 260 470 150 620 285 C790 438 960 360 1190 472"
              stroke="#071427"
              strokeOpacity="0.14"
              strokeWidth="2"
            />
            {[120, 360, 575, 860, 1115].map((cx, index) => (
              <circle
                key={cx}
                className="hero-node"
                cx={cx}
                cy={[420, 318, 250, 145, 72][index]}
                r="5"
                fill="#B58A42"
                style={{ animationDelay: `${index * 0.45}s` }}
              />
            ))}
          </svg>
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 rounded-[10px] border border-[#E3D6C1] bg-[#FBF8F1]/78 p-5 shadow-2xl shadow-[#D9C7AA]/25 backdrop-blur md:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div className="max-w-3xl" data-reveal>
            <div className="inline-flex items-center gap-2 rounded-md border border-[#D6C6AA] bg-white/75 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8B6A32]">
              <LockKeyhole className="h-4 w-4" />
              Built for litigation teams
            </div>

            <h1 className="mt-7 text-5xl font-semibold leading-[0.94] tracking-tight text-[#071427] sm:text-6xl lg:text-7xl">
              Litigation workflows, finally in one place.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#475569]">
              Docket HQ centralizes cases, deadlines, documents, reminders, and
              matter history so legal teams can move with clarity and reduce
              preventable risk.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup?redirectTo=/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#071427] px-6 py-3.5 font-semibold text-white shadow-xl shadow-[#071427]/15 transition hover:-translate-y-1 hover:bg-[#111d33]"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#D6C6AA] bg-white/70 px-6 py-3.5 font-semibold text-[#071427] transition hover:-translate-y-1 hover:border-[#B58A42] hover:bg-white"
              >
                <Play className="h-4 w-4" />
                Watch 2-minute overview
              </a>
            </div>

            <div className="mt-9 grid gap-3 text-sm text-[#475569] sm:grid-cols-2">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#B58A42]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-2xl rounded-[10px] border border-[#1F314B] bg-[#071427] p-4 text-white shadow-2xl shadow-[#071427]/30 lg:rotate-[-1.5deg]"
            data-reveal
          >
            <div className="absolute -right-4 -top-4 hidden rounded-md border border-[#63E6BE]/25 bg-[#0D2D2A] px-3 py-2 text-sm font-semibold text-[#9FF7D5] shadow-xl sm:flex">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Private workspace
            </div>

            <div className="preview-enter flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C49A51]">
                  Litigation command
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Today&apos;s docket
                </h2>
              </div>
              <LayoutDashboard className="h-6 w-6 text-[#F0D6A6]" />
            </div>

            <div className="preview-enter grid gap-3 py-4 sm:grid-cols-3">
              {stats.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#C49A51]/40 hover:bg-white/[0.07]"
                >
                  <p className="text-xs text-stone-400">{label}</p>
                  <p className="mt-3 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="preview-enter space-y-3">
              {caseRows.map((row) => (
                <div
                  key={row.title}
                  className="grid gap-4 rounded-md border border-white/10 bg-white/[0.055] p-4 transition hover:-translate-y-0.5 hover:border-[#C49A51]/30 hover:bg-white/[0.08] md:grid-cols-[1fr_90px_110px_84px]"
                >
                  <div>
                    <p className="font-semibold">{row.title}</p>
                    <p className="mt-1 text-sm text-stone-400">{row.court}</p>
                  </div>
                  <p className="text-sm text-stone-300">{row.owner}</p>
                  <p className={`text-sm font-semibold ${row.tone}`}>
                    {row.status}
                  </p>
                  <p className="rounded-md bg-white/10 px-3 py-2 text-center text-sm font-semibold">
                    {row.date}
                  </p>
                </div>
              ))}
            </div>

            <div className="preview-enter mt-4 rounded-md border border-[#C49A51]/20 bg-[#C49A51]/10 p-4">
              <p className="text-sm font-semibold text-[#F0D6A6]">
                Next action
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-300">
                Verify Apex Constructions hearing status before 27 May and send
                reminder to assigned counsel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl" data-reveal>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#B58A42]">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              A calmer operating rhythm for every matter.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="group rounded-[10px] border border-[#E3D6C1] bg-white/80 p-6 shadow-xl shadow-[#D9C7AA]/15 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#F0E6D6] text-[#B58A42] transition group-hover:rotate-3 group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-sm text-[#B58A42]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#64748B]">
                    {step.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div
            className="rounded-[10px] border border-[#E3D6C1] bg-[#071427] p-8 text-white shadow-2xl shadow-[#D9C7AA]/25"
            data-reveal
          >
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C49A51]">
              Features
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              Built around litigation pressure, not generic project management.
            </h2>
            <p className="mt-5 text-base leading-7 text-stone-300">
              Docket HQ keeps the most important matter signals visible:
              deadlines, filings, history, responsibility, and what still needs
              review.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2" data-reveal>
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="group rounded-[10px] border border-[#E3D6C1] bg-white/80 p-6 shadow-xl shadow-[#D9C7AA]/15 transition hover:-translate-y-1 hover:border-[#D6C6AA] hover:shadow-2xl" key={feature.title}>
                  <Icon className="h-6 w-6 text-[#B58A42] transition group-hover:-translate-y-0.5 group-hover:scale-110" />
                  <h3 className="mt-5 text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#64748B]">
                    {feature.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6" data-reveal>
        <div className="mx-auto max-w-7xl rounded-[10px] border border-[#E3D6C1] bg-white/80 p-8 shadow-xl shadow-[#D9C7AA]/15">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#B58A42]">
                Trusted workflow
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Designed for accountability from day one.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#64748B]">
                Legal teams need confidence in what was checked, who handled
                it, and what remains pending. Docket HQ makes that state easy to
                inspect.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Matter history stays visible",
                "Team actions are easier to audit",
                "Reminder paths reduce missed follow-ups",
                "Clients get clearer updates when needed",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-[#E8DCC8] bg-[#FBF8F1] p-4"
                >
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#B58A42]" />
                  <p className="text-sm font-semibold text-[#344256]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-[#E8DCC8] pt-8 md:grid-cols-3">
            {[
              [
                "“The value is simple: we can see which matters need attention before the court date arrives.”",
                "Managing Partner",
              ],
              [
                "“It gives our team a shared view without turning litigation into a generic sales pipeline.”",
                "In-house Counsel",
              ],
              [
                "“For a solo practice, having one clean matter dashboard is already a big relief.”",
                "Litigation Advocate",
              ],
            ].map(([quote, role]) => (
              <figure
                key={role}
                className="rounded-md border border-[#E8DCC8] bg-white p-5"
              >
                <blockquote className="text-sm leading-6 text-[#344256]">
                  {quote}
                </blockquote>
                <figcaption className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#B58A42]">
                  {role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6" data-reveal>
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#B58A42]">
              Use cases
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              One workspace for different litigation teams.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {personas.map((persona) => {
              const Icon = persona.icon;

              return (
                <article
                  key={persona.title}
                  className="rounded-[10px] border border-[#E3D6C1] bg-white/80 p-6 shadow-xl shadow-[#D9C7AA]/15 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <Icon className="h-7 w-7 text-[#B58A42]" />
                  <h3 className="mt-5 text-2xl font-semibold">
                    {persona.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {persona.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-3 text-sm leading-6 text-[#64748B]"
                      >
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#B58A42]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="px-4 py-16 sm:px-6"
        data-reveal
      >
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[10px] border border-[#E3D6C1] bg-[#FBF8F1] p-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#B58A42]">
              Pricing
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Start with one matter, then upgrade when it proves useful.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#64748B]">
              The first case can be free for evaluation. Paid plans can unlock
              more matters, team seats, reminder capacity, and firm controls.
            </p>
          </div>

          <div className="rounded-[10px] border border-[#E3D6C1] bg-white/80 p-8 shadow-xl shadow-[#D9C7AA]/15">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Pilot plan</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  One live matter, no credit card required.
                </p>
              </div>
              <Sparkles className="h-6 w-6 text-[#B58A42]" />
            </div>
            <div className="mt-6 rounded-md bg-[#071427] p-5 text-white">
              <p className="text-sm text-stone-300">Recommended first step</p>
              <p className="mt-2 text-3xl font-semibold">Start free</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="resources"
        className="px-4 py-16 sm:px-6"
        data-reveal
      >
        <div className="mx-auto max-w-7xl rounded-[10px] border border-[#E3D6C1] bg-white/80 p-8 shadow-xl shadow-[#D9C7AA]/15">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#B58A42]">
                Resources
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Clear enough for lawyers, structured enough for teams.
              </h2>
            </div>
            <div className="grid gap-3">
              {[
                "What should a matter dashboard show?",
                "How to reduce missed litigation follow-ups",
                "How Docket HQ handles status history",
              ].map((item) => (
                <a
                  key={item}
                  href="#demo"
                  className="flex items-center justify-between rounded-md border border-[#E8DCC8] bg-[#FBF8F1] p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[#B58A42] hover:bg-white"
                >
                  {item}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="px-4 pb-20 pt-10 sm:px-6" data-reveal>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-[10px] border border-[#E3D6C1] bg-[#071427] p-8 text-white shadow-2xl shadow-[#071427]/25 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C49A51]">
              Ready when your next matter is
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">
              Get your first matter live in under a day.
            </h2>
            <p className="mt-4 text-sm leading-6 text-stone-300">
              No credit card required. Start with one matter and upgrade only
              when Docket HQ becomes useful to your practice.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup?redirectTo=/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#F7F3EA] px-6 py-3.5 font-semibold text-[#071427] transition hover:-translate-y-1 hover:bg-white"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.06] px-6 py-3.5 font-semibold text-white transition hover:-translate-y-1 hover:bg-white/[0.1]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E8DCC8] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[#64748B] md:flex-row md:items-center">
          <BrandLogo />
          <div className="flex flex-wrap gap-5">
            <Link href="/terms" className="transition hover:text-[#071427]">
              Terms
            </Link>
            <a href="#features" className="transition hover:text-[#071427]">
              Features
            </a>
            <a href="#demo" className="transition hover:text-[#071427]">
              Demo
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
