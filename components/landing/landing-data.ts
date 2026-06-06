import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Fingerprint,
  Gavel,
  History,
  Landmark,
  Scale,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const problemPoints = [
  {
    title: "Dates live in too many places",
    copy: "Hearing dates and case status updates get split across court portals, calendars, chat, and memory.",
    icon: CalendarClock,
  },
  {
    title: "Court checks become manual work",
    copy: "Lawyers repeatedly check whether a matter is pending, dismissed, disposed, adjourned, or listed again.",
    icon: Landmark,
  },
  {
    title: "Nobody knows what was verified",
    copy: "Without a check history, teams cannot quickly see when the case source was last reviewed.",
    icon: Fingerprint,
  },
];

export const solutionPoints = [
  {
    title: "One tracked record per CNR",
    copy: "Case status, court, stage, hearing date, and verification history stay tied to one matter.",
    icon: Landmark,
  },
  {
    title: "Hearing-date discipline",
    copy: "Upcoming hearings and prep reminders stay visible before the listing date arrives.",
    icon: ShieldCheck,
  },
  {
    title: "Source-check history",
    copy: "Every court-source refresh or manual verification is captured in the case timeline.",
    icon: History,
  },
];

export const features = [
  {
    title: "CNR-based case tracking",
    copy: "Add a CNR and keep the saved matter focused on status, stage, court, and next hearing.",
    icon: Gavel,
    accent: "from-[#D4A843]/25 to-transparent",
  },
  {
    title: "Hearing reminders",
    copy: "Generate simple reminders before the next listed date so the matter is not forgotten.",
    icon: CalendarClock,
    accent: "from-[#2D6BFF]/20 to-transparent",
  },
  {
    title: "Court-source verification",
    copy: "Show whether the latest status came from the configured source, manual review, or a failed check.",
    icon: ShieldCheck,
    accent: "from-emerald-300/20 to-transparent",
  },
  {
    title: "Case timeline",
    copy: "Keep status changes, hearing updates, and verification notes in one clean history.",
    icon: History,
    accent: "from-[#D4A843]/20 to-transparent",
  },
  {
    title: "Dismissed or disposed signal",
    copy: "Make the important status clear instead of burying it inside a long case note.",
    icon: CheckCircle2,
    accent: "from-sky-300/20 to-transparent",
  },
  {
    title: "Quiet dashboard",
    copy: "Show today's useful case-tracking signals without turning the product into a full law-firm ERP.",
    icon: Scale,
    accent: "from-violet-300/20 to-transparent",
  },
];

export const steps = [
  {
    title: "Add the CNR",
    copy: "Enter the case number and let DocketHQ check the configured court-data source.",
    icon: ClipboardList,
  },
  {
    title: "Review the status",
    copy: "Confirm pending, dismissed, disposed, stage, court, judge, and next hearing details.",
    icon: ShieldCheck,
  },
  {
    title: "Track the hearing",
    copy: "Keep reminders and source-check history visible until the next update.",
    icon: History,
  },
];

export const pricing = [
  {
    name: "Starter",
    price: "Free",
    description: "For testing DocketHQ with one live matter.",
    features: [
      "1 user",
      "1 tracked case",
      "CNR status workspace",
      "Hearing reminders",
      "Verification history",
    ],
  },
  {
    name: "Pro",
    price: "Rs 499",
    description: "For active litigators managing repeat matters.",
    features: [
      "1 user",
      "Unlimited tracked cases",
      "CNR lookup and manual review",
      "Email reminders",
      "Case status timeline",
    ],
    recommended: true,
  },
  {
    name: "Custom Workflow",
    price: "Rs 999",
    description: "For firms or lawyers who want DocketHQ shaped around their practice.",
    features: [
      "Everything in Pro",
      "Up to 5 team users",
      "Shared case-tracking dashboard",
      "Team invite access",
      "Extra users at Rs 97/user/mo",
    ],
  },
];

export const dashboardRows = [
  ["Karnataka v. Ramesh B.", "Next hearing", "24 May", "Pending"],
  ["Apex Constructions v. Nirman", "Court check", "27 May", "Needs review"],
  ["Meera Sharma v. ICICI Bank", "Status verified", "03 Jun", "Checked"],
];

export const footerLinks = [
  ["Product", "Features", "#features"],
  ["Product", "Pricing", "#pricing"],
  ["Company", "Workflow", "#workflow"],
  ["Company", "Waitlist", "#waitlist"],
  ["Legal", "Terms", "/terms"],
];

export const proofBadges = [
  { label: "Court-date visibility", icon: Bell },
  { label: "CNR-first tracking", icon: Gavel },
  { label: "Verification history", icon: CheckCircle2 },
  { label: "Litigation specific", icon: Scale },
  { label: "Fast onboarding", icon: Zap },
];
