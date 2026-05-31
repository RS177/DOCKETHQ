"use client";

import { MouseEvent } from "react";
import type { ReactNode } from "react";

type LandingAnchorProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function LandingAnchor({
  href,
  className = "",
  children,
}: LandingAnchorProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!href.startsWith("#")) return;

    const target = document.querySelector(href);

    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
