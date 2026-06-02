"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { LandingAnchor } from "./landing-anchor";
import { pricing } from "./landing-data";
import { WAITLIST_SECTION_ID } from "./waitlist";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="bg-[#F8F7F4] px-4 py-24 sm:px-6" data-reveal>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#8B6A32]">
              Pricing
            </p>
            <h2 className="mt-4 max-w-3xl text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[0.98] tracking-tight text-[#0A0F1E]">
            Start lean. Add custom workflow when the practice needs it.
            </h2>
          </div>

          <div className="flex w-fit rounded-full border border-[#E2D5BD] bg-white p-1 shadow-sm">
            {[
              ["monthly", "Monthly"],
              ["annual", "Annual"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAnnual(key === "annual")}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                  annual === (key === "annual")
                    ? "bg-[#0A0F1E] text-white"
                    : "text-[#5E6A7D] hover:text-[#0A0F1E]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricing.map((plan) => (
            <article
              key={plan.name}
              className={`relative rounded-[18px] border p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl ${
                plan.recommended
                  ? "border-[#D4A843] bg-[#0A0F1E] text-white shadow-[#0A0F1E]/20"
                  : "border-[#E2D5BD] bg-white text-[#0A0F1E] shadow-[#CBB98F]/10"
              }`}
            >
              {plan.recommended && (
                <div className="absolute right-5 top-5 rounded-full bg-[#D4A843] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#0A0F1E]">
                  Recommended
                </div>
              )}
              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <p className={`mt-3 text-sm leading-6 ${plan.recommended ? "text-white/62" : "text-[#5E6A7D]"}`}>
                {plan.description}
              </p>
              <p className="mt-8 text-5xl font-semibold">
                {annual ? plan.annual : plan.price}
                {plan.price !== "Free" && (
                  <span className="text-base font-medium opacity-60">/mo</span>
                )}
              </p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A843]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <LandingAnchor
                href={`#${WAITLIST_SECTION_ID}`}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-md px-5 py-3 font-bold transition hover:-translate-y-0.5 ${
                  plan.recommended
                    ? "bg-[#2D6BFF] text-white"
                    : "bg-[#0A0F1E] text-white"
                }`}
              >
                Join the waitlist
              </LandingAnchor>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
