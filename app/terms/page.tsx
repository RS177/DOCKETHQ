import Link from "next/link";
import { FileText, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { TERMS_LAST_UPDATED, TERMS_VERSION } from "@/app/lib/terms";
import { BrandLogo } from "@/components/brand-logo";

const termsSections = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating an account, logging in, or using DocketHQ, you agree to these Terms of Service. If you use DocketHQ for a law firm, chamber, company, or legal team, you confirm that you are authorized to accept these Terms for that workspace.",
  },
  {
    title: "2. Who May Use DocketHQ",
    body: "DocketHQ is intended for lawyers, law firms, chambers, legal teams, and authorized staff. You must be legally capable of entering into a binding agreement or use the service only under an authorized organization account.",
  },
  {
    title: "3. What DocketHQ Provides",
    body: "DocketHQ helps users record litigation matters, track CNR-based case information, maintain hearing dates, store status history, and prepare reminders. Some features may depend on third-party legal data providers, public court websites, APIs, browser availability, or manual user input.",
  },
  {
    title: "4. No Legal Advice",
    body: "DocketHQ is workflow software. It does not provide legal advice, legal opinions, representation, advocacy, filing services, or guaranteed court information. Users remain responsible for verifying case status, hearing dates, orders, limitation periods, procedural deadlines, and client communications.",
  },
  {
    title: "5. Court Data and Accuracy",
    body: "Court status, CNR lookups, hearing dates, orders, disposed status, dismissed status, and other court-related information may be delayed, unavailable, incomplete, blocked by CAPTCHA, or different from official records. DocketHQ should be treated as an assistance layer, not as the official court record.",
  },
  {
    title: "6. User Responsibilities",
    body: "You are responsible for entering correct case details, checking official court sources when required, keeping login credentials secure, managing team access, complying with professional obligations, and ensuring that you have the authority to upload or process any client or case data.",
  },
  {
    title: "7. Confidentiality and Matter Data",
    body: "DocketHQ is designed to keep workspace data private to authorized users in the relevant firm or practice. You agree not to upload data you are not authorized to handle. DocketHQ may process matter data only to provide, secure, maintain, troubleshoot, and improve the service.",
  },
  {
    title: "8. Data Protection and Privacy",
    body: "Users must comply with applicable data protection, confidentiality, professional conduct, and client-consent obligations. DocketHQ will use reasonable technical and organizational safeguards, but no internet service can guarantee absolute security. A separate privacy policy may explain detailed data handling when the product is launched publicly.",
  },
  {
    title: "9. Acceptable Use",
    body: "You must not misuse DocketHQ, attempt unauthorized access, bypass security controls, scrape or overload third-party services, upload malicious content, infringe rights, harass others, or use the service for unlawful activity.",
  },
  {
    title: "10. Third-Party Services",
    body: "DocketHQ may rely on Supabase, hosting providers, email services, payment providers, court-data providers, public legal-data sources, or other third-party systems. Their availability, accuracy, and policies may affect the service.",
  },
  {
    title: "11. Payments and Plans",
    body: "DocketHQ may offer free and paid plans. Free usage may be limited, including by number of tracked cases. Paid pricing, billing cycles, taxes, refunds, and plan limits will be shown before payment when billing is enabled.",
  },
  {
    title: "12. AI and Automation Features",
    body: "Future AI summaries, timelines, reminders, prioritization, or automation outputs may be incomplete or wrong. They must be reviewed by a qualified user before being relied on for legal, procedural, or client-facing decisions.",
  },
  {
    title: "13. Suspension or Termination",
    body: "We may suspend or terminate access if there is misuse, security risk, non-payment, unlawful activity, or violation of these Terms. Users may stop using DocketHQ at any time.",
  },
  {
    title: "14. Limitation of Liability",
    body: "To the maximum extent permitted by law, DocketHQ is not liable for missed hearings, wrong case status, inaccurate court data, unavailable third-party services, data entered incorrectly by users, lost profits, indirect damages, or professional consequences arising from reliance on the service.",
  },
  {
    title: "15. Changes to Terms",
    body: "We may update these Terms as the product develops. If changes are material, we will make reasonable efforts to notify users or require fresh acceptance.",
  },
  {
    title: "16. Governing Law",
    body: "These Terms are governed by the laws of India. Subject to applicable law, disputes will be handled by courts in India with appropriate jurisdiction.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F3EA] px-6 py-8 text-[#071427]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <BrandLogo />
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border border-[#D6C6AA] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#FFFDF8]"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="hidden rounded-xl border border-[#D6C6AA] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#FFFDF8] sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup?redirectTo=/onboarding"
            className="rounded-xl bg-[#071427] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#071427]/10 transition hover:bg-[#111d33]"
          >
            Start Free
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EADCC5] px-4 py-2 text-sm font-medium text-[#8A6428]">
          <FileText className="h-4 w-4" />
          Terms of Service
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[0.82fr_0.38fr] lg:items-start">
          <div>
            <h1 className="max-w-4xl text-5xl font-bold leading-[0.98] tracking-tight text-[#071427] md:text-7xl">
              Clear rules for a confidential legal workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#475569]">
              These Terms explain how DocketHQ should be used, what the product
              does and does not guarantee, and the responsibilities users keep
              when managing litigation data.
            </p>
          </div>

          <aside className="rounded-2xl border border-[#E3D6C1] bg-white/80 p-6 shadow-xl shadow-[#D9C7AA]/20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B58A42]">
              Current version
            </p>
            <p className="mt-3 text-2xl font-bold">{TERMS_VERSION}</p>
            <p className="mt-2 text-sm text-[#64748B]">
              Last updated: {TERMS_LAST_UPDATED}
            </p>
            <div className="mt-6 grid gap-3 text-sm text-[#475569]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#B58A42]" />
                Firm-scoped access
              </div>
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[#B58A42]" />
                Confidentiality-first
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-[#B58A42]" />
                Not legal advice
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-12 rounded-2xl border border-[#E3D6C1] bg-white/85 p-6 shadow-2xl shadow-[#D9C7AA]/20 md:p-8">
          <div className="grid gap-6">
            {termsSections.map((section) => (
              <section
                key={section.title}
                className="border-b border-[#EFE7DA] pb-6 last:border-b-0 last:pb-0"
              >
                <h2 className="text-xl font-bold">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#475569]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-6 text-[#64748B]">
          This page is a product draft for early-stage use and should be
          reviewed by a qualified lawyer before public launch or paid billing.
        </p>
      </section>
    </main>
  );
}
