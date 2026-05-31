"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bell, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingAnchor } from "./landing-anchor";
import { dashboardRows, proofBadges } from "./landing-data";
import { NetworkBackground } from "./network-background";
import { WAITLIST_MAILTO } from "./waitlist";

export function HeroSection() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#0A0F1E] text-[#F8F7F4]">
      <NetworkBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,168,67,0.14),transparent_28%),linear-gradient(180deg,rgba(10,15,30,0.12),#0A0F1E_92%)]" />

      <header className="relative z-20 border-b border-white/10 px-4 py-4 backdrop-blur-xl sm:px-6">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="rounded-md bg-[#F8F7F4] px-3 py-2">
            <BrandLogo />
          </div>

          <div className="hidden items-center gap-7 text-xs font-bold uppercase tracking-[0.14em] text-white/70 lg:flex">
            <LandingAnchor href="#features" className="transition hover:text-[#D4A843]">
              Features
            </LandingAnchor>
            <LandingAnchor href="#workflow" className="transition hover:text-[#D4A843]">
              How it works
            </LandingAnchor>
            <LandingAnchor href="#pricing" className="transition hover:text-[#D4A843]">
              Pricing
            </LandingAnchor>
            <LandingAnchor href="#resources" className="transition hover:text-[#D4A843]">
              Resources
            </LandingAnchor>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-[#D4A843]/60 hover:bg-white/10 sm:inline-flex"
            >
              Log in
            </Link>
            <a
              href={WAITLIST_MAILTO}
              className="group relative inline-flex overflow-hidden rounded-md bg-[#D4A843] px-4 py-2.5 text-sm font-bold text-[#0A0F1E] shadow-2xl shadow-[#D4A843]/20 transition hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-full" />
              <span className="relative inline-flex items-center gap-2">
                Join waitlist
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        </nav>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4A843]/35 bg-[#D4A843]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F2D58A]">
            <ShieldCheck className="h-4 w-4" />
            CNR-based case tracking
          </div>

          <h1 className="mt-8 text-[clamp(3.8rem,8vw,6.5rem)] font-semibold leading-[0.88] tracking-tight">
            Never miss another court update.
          </h1>

          <p className="mt-7 max-w-2xl text-[clamp(1.05rem,1.5vw,1.35rem)] leading-8 text-white/72">
            Join the waitlist for a CNR-first workspace that tracks case
            status, hearing dates, source checks, and reminders. Nothing
            complicated.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={WAITLIST_MAILTO}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-md bg-[#2D6BFF] px-6 py-4 font-bold text-white shadow-2xl shadow-[#2D6BFF]/25 transition hover:-translate-y-1"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition duration-700 group-hover:translate-x-full" />
              <span className="relative inline-flex items-center gap-2">
                Join the waitlist
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>
            <LandingAnchor
              href="#features"
              className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/7 px-6 py-4 font-bold text-white transition hover:-translate-y-1 hover:border-[#D4A843]/60 hover:bg-white/12"
            >
              View features
            </LandingAnchor>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-white/68 sm:grid-cols-2">
            {proofBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#D4A843]" />
                  {badge.label}
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-8 rounded-[32px] bg-[#2D6BFF]/14 blur-3xl" />
          <div className="relative rounded-[18px] border border-white/12 bg-[#101A31]/92 p-4 shadow-2xl shadow-black/35 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF685D]" />
                <span className="h-3 w-3 rounded-full bg-[#F6C85F]" />
                <span className="h-3 w-3 rounded-full bg-[#63D471]" />
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Live docket
              </div>
            </div>

            <div className="grid gap-3 py-4 sm:grid-cols-3">
              {[
                ["Critical deadlines", "04", Bell],
                ["Next hearing", "11h 42m", Clock3],
                ["Filings ready", "18", CheckCircle2],
              ].map(([label, value, Icon]) => {
                const StatIcon = Icon as typeof Bell;
                return (
                  <motion.div
                    key={label as string}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="rounded-xl border border-white/10 bg-white/[0.045] p-4"
                  >
                    <StatIcon className="h-4 w-4 text-[#D4A843]" />
                    <p className="mt-5 text-2xl font-semibold">{value as string}</p>
                    <p className="mt-1 text-xs text-white/52">{label as string}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="space-y-3">
              {dashboardRows.map((row, index) => (
                <motion.div
                  key={row[0]}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.1 }}
                  className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.055] p-4 md:grid-cols-[1fr_130px_86px_95px]"
                >
                  <div>
                    <p className="font-semibold text-white">{row[0]}</p>
                    <p className="mt-1 text-sm text-white/48">Commercial division</p>
                  </div>
                  <p className="text-sm text-white/66">{row[1]}</p>
                  <p className="rounded-lg bg-white/10 px-3 py-2 text-center text-sm font-semibold">
                    {row[2]}
                  </p>
                  <p className="text-sm font-semibold text-[#F2D58A]">{row[3]}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute -right-4 bottom-10 hidden max-w-[220px] rounded-xl border border-[#D4A843]/25 bg-[#0A0F1E] p-4 shadow-2xl lg:block"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A843]">
                Notification
              </p>
              <p className="mt-2 text-sm text-white/72">
                Filing review assigned to R. Sinha.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
