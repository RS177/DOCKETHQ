"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { UserMenu } from "./user-menu";

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const search = query.trim();
    router.push(search ? `/cases?search=${encodeURIComponent(search)}` : "/cases");
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-6">
      <BrandLogo className="shrink-0 md:hidden" />

      <form
        onSubmit={handleSearch}
        className="flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-md border border-transparent bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors focus-within:border-primary focus-within:bg-background"
      >
        <Search className="h-4 w-4" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search cases or CNR..."
          className="w-full border-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
      </form>
      <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 lg:flex">
        <ShieldCheck className="h-3.5 w-3.5" />
        Confidential workspace
      </div>
      <UserMenu />
    </header>
  );
}
