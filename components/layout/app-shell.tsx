"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  /**
   * Optional extra action button(s) that certain pages can inject
   * (e.g. the "Join a class" dialog trigger on the dashboard).
   */
  extraActions?: React.ReactNode;
};

export default function AppShell({ children, extraActions }: AppShellProps) {
  const pathname = usePathname();
  const [email, setEmail] = React.useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setEmail(user?.email ?? null);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/my-results", label: "My results" },
    
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* TOP NAVBAR – solid, same colour as background, thin white line under */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          {/* Brand */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold">
              QT
            </span>
            <span className="hidden sm:inline">QuizTheory</span>
          </Link>

          {/* DESKTOP / TABLET NAV */}
          <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className="rounded-full px-4 text-xs sm:text-sm"
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* DESKTOP / TABLET RIGHT SIDE (email, extra actions, account, logout) */}
          <div className="hidden items-center gap-2 text-xs sm:text-sm md:flex">
            {email && (
              <span className="hidden text-zinc-400 lg:inline">
                {email}
              </span>
            )}

            {/* Ensure extraActions (e.g., 'Join a class' button) matches the oval shape of other buttons */}
            {extraActions && React.cloneElement(extraActions as React.ReactElement<any>, {
              className: cn((extraActions as React.ReactElement<any>).props.className, 'rounded-full px-4'),
            })}

            <Link href="/account">
              <Button
                size="sm"
                variant={pathname === "/account" ? "default" : "outline"}
                className="rounded-full px-4 text-xs sm:text-sm"
              >
                Account
              </Button>
            </Link>

            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 text-xs sm:text-sm"
              type="button"
              onClick={email ? handleLogout : () => { window.location.href = "/auth"; }}
            >
              {email ? "Log out" : "Log in"}
            </Button>
          </div>

          {/* MOBILE MENU (shows on < md) */}
          <div className="relative flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-3 text-xs"
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <Menu className="h-4 w-4" />
              <span className="ml-2">Menu</span>
            </Button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-10 z-50 w-44 rounded-md border border-white/10 bg-background/95 shadow-lg backdrop-blur">
                <div className="py-1 text-sm">
                  {navItems.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      className="flex w-full items-center px-3 py-2 text-left text-zinc-200 hover:bg-white/5"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.location.href = item.href;
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                  {/* Join a class button for mobile nav, only for authenticated users with role 'user' (mirrors extraActions logic) */}
                  {auth.currentUser && extraActions && (
                    <button
                      type="button"
                      className="flex w-full items-center px-3 py-2 text-left text-zinc-200 hover:bg-white/5"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        // Dispatch a custom event to open the join dialog in dashboard
                        window.dispatchEvent(new CustomEvent('open-join-class-dialog'));
                      }}
                    >
                      Join a class
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center px-3 py-2 text-left text-zinc-200 hover:bg-white/5"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = "/account";
                    }}
                  >
                    Account
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-3 py-2 text-left text-zinc-200 hover:bg-white/5"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void handleLogout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-10">{children}</main>
    </div>
  );
}

/**
 * Shared page container used across all pages to get the same
 * vertical spacing as the upgraded dashboard.
 *
 * Use this INSIDE <AppShell>:
 *
 * <AppShell>
 *   <PageContainer>
 *     ...page sections...
 *   </PageContainer>
 * </AppShell>
 */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-8 lg:space-y-12", className)}>
      {children}
    </div>
  );
}
