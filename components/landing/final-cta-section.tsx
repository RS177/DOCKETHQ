import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="bg-[#F8F7F4] px-4 pb-24 pt-12 sm:px-6" data-reveal>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-white/10 bg-[#0A0F1E] p-8 text-white shadow-2xl shadow-[#0A0F1E]/25 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#D4A843]">
              Put the docket under control
            </p>
            <h2 className="mt-5 max-w-4xl text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-tight">
              The next missed deadline should not be possible.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/64">
              Start with one matter, invite the team when the workflow is clear,
              and keep every filing, hearing, motion, and update in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/signup?redirectTo=/onboarding"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-md bg-[#2D6BFF] px-6 py-4 font-bold text-white transition hover:-translate-y-1"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition duration-700 group-hover:translate-x-full" />
              <span className="relative inline-flex items-center gap-2">
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
