import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LandingAnchor } from "./landing-anchor";
import { footerLinks } from "./landing-data";

export function LandingFooter() {
  const groups = ["Product", "Company", "Legal"];

  return (
    <footer className="border-t border-[#E8DCC8] bg-[#F8F7F4] px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-md text-sm leading-6 text-[#5E6A7D]">
            DocketHQ helps litigation teams manage cases, deadlines, filings,
            tasks, and matter history without turning the practice into admin.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B6A32]">
                {group}
              </p>
              <div className="mt-4 space-y-3">
                {footerLinks
                  .filter(([category]) => category === group)
                  .map(([, label, href]) =>
                    href.startsWith("/") ? (
                      <Link
                        key={label}
                        href={href}
                        className="block text-sm text-[#5E6A7D] transition hover:text-[#0A0F1E]"
                      >
                        {label}
                      </Link>
                    ) : href.startsWith("#") ? (
                      <LandingAnchor
                        key={label}
                        href={href}
                        className="block text-sm text-[#5E6A7D] transition hover:text-[#0A0F1E]"
                      >
                        {label}
                      </LandingAnchor>
                    ) : (
                      <a
                        key={label}
                        href={href}
                        className="block text-sm text-[#5E6A7D] transition hover:text-[#0A0F1E]"
                      >
                        {label}
                      </a>
                    ),
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
