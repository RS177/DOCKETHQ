import Link from "next/link";
import { Gavel } from "lucide-react";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Go to DocketHQ home"
      className={`inline-flex items-center gap-3 ${className}`}
    >
      <Gavel className="h-6 w-6 text-[#B58A42]" />
      <span className="text-xl font-bold text-[#071427]">DocketHQ</span>
    </Link>
  );
}
