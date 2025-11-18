"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getResultsForClass, getUserProfile, getClassByJoinCode } from "@/lib/firestore";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDate(ts?: number) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

export default function StudentAnalyticsPage() {
  const params = useParams<{ classId: string; studentId: string }>();
  const router = useRouter();
  const { classId, studentId } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState<string>("");
  const [student, setStudent] = useState<{ email?: string } | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Get class name
        const classDoc = await getClassByJoinCode(classId);
        setClassName(classDoc?.name || "Class");
        // Get student info
        const user = await getUserProfile(studentId);
        setStudent(user ? { email: user.email } : null);
        // Get all attempts for this class
        const all = await getResultsForClass(classId);
        // Filter for this student
        const studentAttempts = all.filter((a: any) => a.userId === studentId);
        setAttempts(studentAttempts);
      } catch (e) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classId, studentId]);

  // Compute stats
  const totalAttempts = attempts.length;
  const avgScore = attempts.length ? (attempts.reduce((sum, a) => sum + (a.score / (a.maxScore || a.total || 1)) * 100, 0) / attempts.length).toFixed(1) : "-";
  const bestScore = attempts.length ? Math.max(...attempts.map(a => (a.score / (a.maxScore || a.total || 1)) * 100)).toFixed(1) : "-";

  // Group attempts by quiz
  const quizMap: Record<string, any[]> = {};
  attempts.forEach(a => {
    if (!quizMap[a.quizId]) quizMap[a.quizId] = [];
    quizMap[a.quizId].push(a);
  });
  const quizRows = Object.entries(quizMap).map(([quizId, atts]) => {
    const sorted = [...atts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const best = Math.max(...atts.map(a => (a.score / (a.maxScore || a.total || 1)) * 100));
    const last = (sorted[0].score / (sorted[0].maxScore || sorted[0].total || 1)) * 100;
    return {
      quizId,
      quizTitle: sorted[0].quizTitle || "Quiz",
      attemptsCount: atts.length,
      bestScore: best.toFixed(1),
      lastScore: last.toFixed(1),
      lastAttemptAt: sorted[0].createdAt,
    };
  });

  return (
    <AppShell>
      <PageContainer>
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Student Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading…</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="text-lg font-semibold">
                      {student?.email || studentId}
                    </div>
                    <div className="text-sm mt-2">Class: <span className="font-medium">{className}</span></div>
                  </div>
                  <div className="flex gap-6 mb-6">
                    <div>
                      <div className="text-xs text-zinc-400">Total Attempts</div>
                      <div className="font-bold text-lg">{totalAttempts}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400">Average Score</div>
                      <div className="font-bold text-lg">{avgScore}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400">Best Score</div>
                      <div className="font-bold text-lg">{bestScore}%</div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-zinc-800 rounded-lg">
                      <thead>
                        <tr className="bg-zinc-900">
                          <th className="px-4 py-2 text-left">Quiz Title</th>
                          <th className="px-4 py-2">Attempts</th>
                          <th className="px-4 py-2">Best Score</th>
                          <th className="px-4 py-2">Last Score</th>
                          <th className="px-4 py-2">Last Attempt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizRows.map(row => (
                          <tr key={row.quizId} className="border-t border-zinc-800">
                            <td className="px-4 py-2">{row.quizTitle}</td>
                            <td className="px-4 py-2 text-center">{row.attemptsCount}</td>
                            <td className="px-4 py-2 text-center">{row.bestScore}%</td>
                            <td className="px-4 py-2 text-center">{row.lastScore}%</td>
                            <td className="px-4 py-2 text-center">{formatDate(row.lastAttemptAt)}</td>
                          </tr>
                        ))}
                        {quizRows.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-zinc-400">No attempts yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
