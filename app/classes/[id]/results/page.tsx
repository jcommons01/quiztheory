"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { 
  getUserProfile,
  getTeacherClasses,
  getClassAssignments,
  getResultsForClass,
  QuizAssignment,
  QuizResult,
  ClassGroup
} from "@/lib/firestore"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AppShell from "@/components/layout/app-shell"
// Table components not present; using basic table markup.

const db = getFirestore()

export default function ClassResultsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const classId = params?.id

  const [checkingAuth, setCheckingAuth] = useState(true)

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [classInfo, setClassInfo] = React.useState<ClassGroup | null>(null)
  const [assignments, setAssignments] = React.useState<QuizAssignment[]>([])
  const [results, setResults] = React.useState<QuizResult[]>([])
  // If we later want user profiles, we can extend this with a map of userId -> profile/email.

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
    if (!classId) return

    let active = true
    const load = async () => {
      try {
        // Load class doc directly
        const classRef = doc(db, "classes", String(classId))
        const classSnap = await getDoc(classRef)
        if (!classSnap.exists()) {
          if (!active) return
          setError("Class not found.")
          setLoading(false)
          return
        }
        const classData = { id: classSnap.id, ...(classSnap.data() as ClassGroup) }

        // Optionally verify teacher owns class (if role is teacher)
        // We fetch user profile in case we need role-based logic later.
  const profile = await getUserProfile(auth.currentUser!.uid)
  if (profile?.role === "teacher" && classData.ownerId !== auth.currentUser!.uid) {
          if (!active) return
            setError("You do not have access to this class.")
            setLoading(false)
            return
        }

        // Parallel load assignments & results
        const [assignmentsList, resultsList] = await Promise.all([
          getClassAssignments(classId),
          getResultsForClass(classId)
        ])

        if (!active) return
        setClassInfo(classData)
        setAssignments(assignmentsList)
        setResults(resultsList)
        setLoading(false)
      } catch (e) {
        if (!active) return
        setError("Failed to load class results.")
        setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [classId, router])

  // Derived statistics
  const totalAssignments = assignments.length
  const totalAttempts = results.length
  const averagePercent = React.useMemo(() => {
    if (!results.length) return 0
    const sum = results.reduce((acc, r) => acc + (r.total ? (r.score / r.total) : 0), 0)
    return (sum / results.length) * 100
  }, [results])

  function formatDate(ts: number) {
    try { return new Date(ts).toLocaleDateString() } catch { return "" }
  }

  // Build lookup for assignment titles
  const assignmentTitleById = React.useMemo(() => {
    const map: Record<string, string> = {}
    assignments.forEach(a => { if (a.id) map[a.id] = a.title })
    return map
  }, [assignments])

  if (checkingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-sm text-zinc-400">Checking your session...</div>
      </AppShell>
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto p-6">Loading class results…</div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto p-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Results</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!classInfo) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto p-6">Class not found.</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Class: {classInfo.name}</CardTitle>
            <CardDescription className="space-y-1">
              <div>Join Code: <span className="font-mono">{classInfo.joinCode}</span></div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-sm text-zinc-400">Total Assignments</div>
                <div className="text-lg font-semibold">{totalAssignments}</div>
              </div>
              <div>
                <div className="text-sm text-zinc-400">Total Attempts</div>
                <div className="text-lg font-semibold">{totalAttempts}</div>
              </div>
              <div>
                <div className="text-sm text-zinc-400">Average Score</div>
                <div className="text-lg font-semibold">{averagePercent.toFixed(1)}%</div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Attempts across all assignments in this class.</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-sm text-zinc-400">No results yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-zinc-800">
                  <thead className="bg-zinc-900">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Student</th>
                      <th className="px-3 py-2 text-left font-medium">Assignment</th>
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
                          <td className="px-3 py-2 font-mono text-xs">{r.userId}</td>
                          <td className="px-3 py-2">{r.assignmentId ? assignmentTitleById[r.assignmentId] ?? r.assignmentId : "—"}</td>
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
      </div>
    </AppShell>
  )
}
