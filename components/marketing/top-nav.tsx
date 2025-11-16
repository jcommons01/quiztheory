"use client";

import Link from "next/link";
import React from "react";

// Minimal dark marketing navigation bar
export default function TopNav() {
  return (
  <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-backdrop-filter:bg-zinc-950/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-sm font-bold tracking-wide text-zinc-100 group-hover:border-zinc-700 transition-colors">
            QT
          </div>
          <span className="text-sm md:text-base font-semibold text-zinc-100 group-hover:text-zinc-50 transition-colors">QuizTheory</span>
        </Link>
        {/* Nav Links */}
        <div className="flex items-center gap-2 md:gap-4">
          <NavLink href="/landing">Home</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/auth" variant="primary">Login</NavLink>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps { href: string; variant?: "default" | "primary"; children: React.ReactNode }

function NavLink({ href, children, variant = "default" }: NavLinkProps) {
  const base = "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors";
  const styles = variant === "primary"
    ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
    : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/60";
  return (
    <Link href={href} className={`${base} ${styles}`}>{children}</Link>
  );
}
