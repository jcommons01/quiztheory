"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { getResultsForUser, QuizResult } from "@/lib/firestore"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AppShell from "@/components/layout/app-shell"

export default function MyResultsPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loading, setLoading] = React.useState(true)
  const [results, setResults] = React.useState<QuizResult[]>([])
  const [error, setError] = React.useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) {
        router.push("/")
      } else {
        setCheckingAuth(false)
      }
    })
    return () => unsub()
  }, [router])

  React.useEffect(() => {
    if (!auth.currentUser) return
    let active = true
    const load = async () => {
      try {
        const list = await getResultsForUser(auth.currentUser!.uid)
        if (!active) return
        // Sort newest first by createdAt
        const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt)
        setResults(sorted)
      } catch (e) {
        if (!active) return
        setError("Failed to load results.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [router])

  function formatDate(ts: number) {
    try { return new Date(ts).toLocaleDateString() } catch { return "" }
  }

  if (checkingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-sm text-zinc-400">Checking your session...</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Hero header to match app style */}
      <section className="relative flex flex-col justify-center items-center gap-4 text-center px-4 pt-20 pb-8 w-full max-w-screen-sm mx-auto">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-168 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
        </div>
        <h1 className="relative z-10 font-bold tracking-tight text-3xl md:text-5xl leading-tight pb-1 bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
          My Results
        </h1>
        <p className="relative z-10 max-w-2xl text-zinc-300 leading-relaxed text-sm md:text-base">
          Review your quiz attempts and scores.
        </p>
      </section>

  <div className="mx-auto pb-10 space-y-6 w-full">
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
        </div>
        {loading ? (
          <Card>
            <CardContent className="py-6 text-sm text-zinc-400">Loading…</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Something went wrong loading your attempts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-400">{error}</div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your quiz attempts</CardTitle>
              <CardDescription>Your past scores and dates</CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-400">
                  You haven’t completed any quizzes yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-zinc-800 rounded-md overflow-hidden">
                    <thead className="bg-zinc-900/60">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Quiz</th>
                        <th className="px-3 py-2 text-left font-medium">Score</th>
                        <th className="px-3 py-2 text-left font-medium">Percent</th>
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(r => {
                        const percent = r.total ? (r.score / r.total) * 100 : 0
                        return (
                          <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                            <td className="px-3 py-2 truncate">
                              <div className="text-sm font-medium text-zinc-200 truncate">{r.quizTitle || 'Untitled quiz'}</div>
                              <div className="text-[11px] text-zinc-500 font-mono">{r.quizId}</div>
                            </td>
                            <td className="px-3 py-2">{r.score} / {r.total}</td>
                            <td className="px-3 py-2">{percent.toFixed(1)}%</td>
                            <td className="px-3 py-2">{formatDate(r.createdAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
