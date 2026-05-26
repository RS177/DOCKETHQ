import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileArchive,
  FilePenLine,
  Fingerprint,
  Gavel,
  History,
  Landmark,
  MessageSquareText,
  Route,
  Scale,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";

export const problemPoints = [
  {
    title: "Dates live in too many places",
    copy: "Hearings, limitation dates, filing windows, and internal follow-ups get split across calendars, chat, and memory.",
    icon: CalendarClock,
  },
  {
    title: "Case context disappears",
    copy: "Orders, drafts, billing notes, and counsel instructions are hard to reconstruct when pressure rises.",
    icon: FileArchive,
  },
  {
    title: "Accountability gets blurry",
    copy: "When work moves quickly, teams lose a clean record of who checked what, when, and why.",
    icon: Fingerprint,
  },
];

export const solutionPoints = [
  {
    title: "A command center for every matter",
    copy: "Dockets, tasks, documents, hearings, and client updates stay tied to one litigation record.",
    icon: Landmark,
  },
  {
    title: "Deadline discipline",
    copy: "Jurisdiction-aware calendaring and reminders make upcoming work impossible to ignore.",
    icon: ShieldCheck,
  },
  {
    title: "History you can trust",
    copy: "Every status check, assignment, document action, and communication is captured in an auditable timeline.",
    icon: History,
  },
];

export const features = [
  {
    title: "Case & docket management",
    copy: "Track hearings, filings, motions, adjournments, orders, and matter stage from one dashboard.",
    icon: Gavel,
    accent: "from-[#D4A843]/25 to-transparent",
  },
  {
    title: "Jurisdiction-aware deadlines",
    copy: "Build calendar rules around court dates, filing windows, limitation periods, and internal review buffers.",
    icon: CalendarClock,
    accent: "from-[#2D6BFF]/20 to-transparent",
  },
  {
    title: "Document automation",
    copy: "Prepare filing bundles, reuse drafting patterns, and keep every version attached to the case record.",
    icon: FilePenLine,
    accent: "from-emerald-300/20 to-transparent",
  },
  {
    title: "Workflow routing",
    copy: "Assign drafting, filing, appearance prep, client updates, and review work to the right team member.",
    icon: Route,
    accent: "from-[#D4A843]/20 to-transparent",
  },
  {
    title: "Client communication",
    copy: "Send clear matter updates without exposing your internal working dashboard or private strategy notes.",
    icon: MessageSquareText,
    accent: "from-sky-300/20 to-transparent",
  },
  {
    title: "AI case insights",
    copy: "Summarize timelines, surface missing context, and draft first-pass briefs while keeping lawyer review central.",
    icon: Sparkles,
    accent: "from-violet-300/20 to-transparent",
  },
];

export const steps = [
  {
    title: "Open the matter",
    copy: "Add the case, court, parties, CNR, client, documents, and first known hearing date.",
    icon: ClipboardList,
  },
  {
    title: "Route the work",
    copy: "DocketHQ creates deadline queues, assigns owners, and keeps filings moving toward review.",
    icon: UsersRound,
  },
  {
    title: "Audit the outcome",
    copy: "Every update, reminder, filing, and handoff becomes part of the case history.",
    icon: History,
  },
];

export const pricing = [
  {
    name: "Starter",
    price: "Free",
    annual: "Free",
    description: "For testing DocketHQ with one live matter.",
    features: [
      "1 user",
      "1 matter",
      "Basic docket dashboard",
      "Hearing reminders",
      "Matter history",
    ],
  },
  {
    name: "Pro",
    price: "Rs 499",
    annual: "Rs 499",
    description: "For active litigators managing repeat matters.",
    features: [
      "1 user",
      "Unlimited matters",
      "Document workflows",
      "Email reminders",
      "AI timeline summaries",
    ],
    recommended: true,
  },
  {
    name: "Custom Workflow",
    price: "Rs 999",
    annual: "Rs 999",
    description: "For firms or lawyers who want DocketHQ shaped around their practice.",
    features: [
      "Everything in Pro",
      "Up to 5 team users",
      "Practice-specific workflow setup",
      "Case assignment and firm roles",
      "Extra users later at Rs 199/user/mo",
    ],
  },
];

export const dashboardRows = [
  ["Karnataka v. Ramesh B.", "Motion hearing", "24 May", "Ready"],
  ["Apex Constructions v. Nirman", "Filing review", "27 May", "Needs work"],
  ["Meera Sharma v. ICICI Bank", "Discovery", "03 Jun", "On track"],
];

export const socialLinks = [
  ["LinkedIn", "#"],
  ["X", "#"],
  ["Contact", "#demo"],
];

export const footerLinks = [
  ["Product", "Features", "#features"],
  ["Product", "Pricing", "#pricing"],
  ["Company", "Security", "#trust"],
  ["Company", "Resources", "#resources"],
  ["Legal", "Terms", "/terms"],
  ["Legal", "Privacy", "/terms"],
];

export const proofBadges = [
  { label: "Court-date visibility", icon: Bell },
  { label: "Firm-ready controls", icon: BriefcaseBusiness },
  { label: "Audit-first history", icon: CheckCircle2 },
  { label: "Litigation specific", icon: Scale },
  { label: "Fast onboarding", icon: Zap },
];
