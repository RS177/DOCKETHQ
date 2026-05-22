import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-white border-r border-[#e4e8ee] fixed left-0 top-0 p-6">
      <BrandLogo className="mb-10" />

      <nav className="space-y-2">
        <Link
          href="/cases"
          className="block px-4 py-3 rounded-2xl bg-[#f3f6fb] text-[#14213d] font-medium"
        >
          Cases
        </Link>

        <Link
          href="/cases/new"
          className="block px-4 py-3 rounded-2xl text-[#6b7280] hover:bg-[#f3f6fb]"
        >
          Add Case
        </Link>

        <Link
          href="/"
          className="block px-4 py-3 rounded-2xl text-[#6b7280] hover:bg-[#f3f6fb]"
        >
          Landing Page
        </Link>
      </nav>
    </aside>
  );
}
