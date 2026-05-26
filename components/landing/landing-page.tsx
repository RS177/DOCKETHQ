"use client";

import { useEffect } from "react";
import { FeaturesSection } from "./features-section";
import { FinalCtaSection } from "./final-cta-section";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { LandingFooter } from "./landing-footer";
import { PricingSection } from "./pricing-section";
import { ProblemSolutionSection } from "./problem-solution-section";
import { ResourcesSection } from "./resources-section";

export function LandingPage() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("dhq-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-[#F8F7F4] text-[#0A0F1E]">
      <HeroSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <ResourcesSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}
