"use client"

import * as React from "react"
import type { ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = auth.currentUser

  function nav(to: string) {
    if (pathname === to) return
    router.push(to)
  }

  async function handleLogout() {
    try {
      await auth.signOut()
    } catch (e) {
      console.error("Sign out failed", e)
    } finally {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Top nav */}
  <header className="border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur supports-backdrop-filter:bg-zinc-950/70">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Left logo */}
          <button
            onClick={() => nav("/dashboard")}
            className="group flex items-center gap-3 select-none"
          >
            <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700 grid place-items-center text-[10px] font-semibold group-hover:border-zinc-600 transition">QT</div>
            <div className="text-sm sm:text-base font-medium tracking-tight group-hover:text-zinc-200 transition">QuizTheory</div>
          </button>
          {/* Middle nav */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant={pathname === "/dashboard" ? "secondary" : "outline"}
              onClick={() => nav("/dashboard")}
            >Dashboard</Button>
            <Button
              size="sm"
              variant={pathname === "/my-results" ? "secondary" : "outline"}
              onClick={() => nav("/my-results")}
            >My results</Button>
          </div>
          {/* Right account */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-400 min-w-[140px] truncate">
              {user?.email || "Guest"}
            </div>
            <Button size="sm" variant="outline" onClick={handleLogout}>Log out</Button>
          </div>
        </div>
      </header>
      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
      {/* Footer with feedback link */}
      <footer className="border-t border-zinc-800/60 mt-auto text-[11px] text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">© {new Date().getFullYear()} QuizTheory</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = "mailto:support@quiztheory.com?subject=QuizTheory feedback";
              }}
              className="text-zinc-400 hover:text-zinc-200 transition underline underline-offset-2 decoration-dotted"
              aria-label="Send feedback"
            >Send feedback</button>
            <span className="hidden sm:inline text-zinc-600" title="Tell us what to improve.">Tell us what to improve.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
