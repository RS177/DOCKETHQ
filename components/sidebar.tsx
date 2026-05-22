import Link from 'next/link'
import { Briefcase, CreditCard, LayoutDashboard, Settings } from 'lucide-react'
import { BrandLogo } from './brand-logo'

export function Sidebar() {
  return (
    <div className="w-64 h-screen border-r border-border bg-card flex-col hidden md:flex sticky top-0">
      <div className="p-6">
        <BrandLogo />
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-foreground">
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        <Link href="/cases" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
          <Briefcase className="w-4 h-4" /> Cases
        </Link>
        <Link href="/billing" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
          <CreditCard className="w-4 h-4" /> Billing
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </nav>
    </div>
  )
}
