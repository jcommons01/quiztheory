"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getResultsForUser, QuizResult } from "@/lib/firestore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppShell, { PageContainer } from "@/components/layout/app-shell";

export default function MyResultsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = React.useState(true);
  const [results, setResults] = React.useState<QuizResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/");
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    let active = true;

    const load = async () => {
      try {
        const list = await getResultsForUser(auth.currentUser!.uid);
        if (!active) return;
        // Sort newest first by createdAt
        const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
        setResults(sorted);
      } catch (e) {
        if (!active) return;
        setError("Failed to load results.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [router]);

  function formatDate(ts: number) {
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return "";
    }
  }

  if (checkingAuth) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex h-[60vh] items-center justify-center text-sm text-zinc-400">
            Checking your session...
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        {/* Hero header (aligned with dashboard/account) */}
        <section className="pt-2 lg:pt-0">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
              My Results
            </h1>
            <p className="mt-4 text-sm text-slate-400 md:text-base">
              Review your quiz attempts and scores.
            </p>
          </div>
        </section>

        {/* Main content */}
        <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-10 space-y-6">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => router.push("/dashboard")}>
              Back to dashboard
            </Button>
          </div>

          {loading ? (
            <Card className="rounded-2xl border border-white/5 bg-card/70 shadow-lg">
              <CardContent className="py-6 text-sm text-zinc-400">
                Loading…
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="rounded-2xl border border-white/5 bg-card/70 shadow-lg">
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Something went wrong loading your attempts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-red-400">{error}</div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-white/5 bg-card/70 shadow-lg">
              <CardHeader>
                <CardTitle>Your quiz attempts</CardTitle>
                <CardDescription>Your past scores and dates.</CardDescription>
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
                        {results.map((r) => {
                          const percent = r.total ? (r.score / r.total) * 100 : 0;
                          return (
                            <tr
                              key={r.id}
                              className="border-t border-zinc-800 hover:bg-zinc-900/50"
                            >
                              <td className="px-3 py-2 truncate">
                                <div className="truncate text-sm font-medium text-zinc-200">
                                  {r.quizTitle || "Untitled quiz"}
                                </div>
                                <div className="font-mono text-[11px] text-zinc-500">
                                  {r.quizId}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {r.score} / {r.total}
                              </td>
                              <td className="px-3 py-2">
                                {percent.toFixed(1)}%
                              </td>
                              <td className="px-3 py-2">
                                {formatDate(r.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
