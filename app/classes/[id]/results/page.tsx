"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  getClassAssignments,
  getResultsForClass,
  QuizAssignment,
  QuizResult,
  ClassGroup,
} from "@/lib/firestore";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppShell, { PageContainer } from "@/components/layout/app-shell";

const db = getFirestore();

export default function ClassResultsPage() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const classId = params?.classId;

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [classInfo, setClassInfo] = React.useState<ClassGroup | null>(null);
  const [assignments, setAssignments] = React.useState<QuizAssignment[]>([]);
  const [results, setResults] = React.useState<QuizResult[]>([]);

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
    if (!classId) return;

    let active = true;
    const load = async () => {
      try {
        // Load class doc directly
        const classRef = doc(db, "classes", String(classId));
        const classSnap = await getDoc(classRef);
        if (!classSnap.exists()) {
          if (!active) return;
          setError("Class not found.");
          setLoading(false);
          return;
        }
        const classData = {
          id: classSnap.id,
          ...(classSnap.data() as ClassGroup),
        };

        // Verify teacher owns class (if role is teacher)
        const profile = await getUserProfile(auth.currentUser!.uid);
        if (
          profile?.role === "teacher" &&
          classData.ownerId !== auth.currentUser!.uid
        ) {
          if (!active) return;
          setError("You do not have access to this class.");
          setLoading(false);
          return;
        }

        // Parallel load assignments & results
        const [assignmentsList, resultsList] = await Promise.all([
          getClassAssignments(classId),
          getResultsForClass(classId),
        ]);

        if (!active) return;
        setClassInfo(classData);
        setAssignments(assignmentsList);
        setResults(resultsList);
        setLoading(false);
      } catch (e) {
        if (!active) return;
        setError("Failed to load class results.");
        setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [classId, router]);

  // Derived statistics
  const totalAssignments = assignments.length;
  const totalAttempts = results.length;
  const averagePercent = React.useMemo(() => {
    if (!results.length) return 0;
    const sum = results.reduce(
      (acc, r) => acc + (r.total ? r.score / r.total : 0),
      0
    );
    return (sum / results.length) * 100;
  }, [results]);

  function formatDate(ts: number) {
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return "";
    }
  }

  // Build lookup for assignment titles
  const assignmentTitleById = React.useMemo(() => {
    const map: Record<string, string> = {};
    assignments.forEach((a) => {
      if (a.id) map[a.id] = a.title;
    });
    return map;
  }, [assignments]);

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

  if (loading) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex h-[60vh] items-center justify-center text-sm text-zinc-400">
            Loading class results…
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageContainer>
          <div className="space-y-8 lg:space-y-12">
            {/* HERO */}
            <section className="pt-2 lg:pt-0">
              <div className="mx-auto w-full max-w-3xl text-center">
                <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                  Class Results
                </h1>
                <p className="mt-4 text-sm text-slate-400 md:text-base">
                  There was a problem loading this class.
                </p>
              </div>
            </section>

            <section className="mx-auto w-full max-w-3xl">
              <Card className="rounded-3xl border border-white/5 bg-card/80 shadow-lg backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Class Results
                  </CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push("/dashboard")}>
                    Back to dashboard
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!classInfo) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex h-[60vh] items-center justify-center text-sm text-zinc-400">
            Class not found.
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-8 lg:space-y-12">
          {/* HERO HEADER */}
          <section className="pt-2 lg:pt-0">
            <div className="mx-auto w-full max-w-4xl text-center">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Class Results
              </h1>
              <p className="mt-4 text-sm text-slate-400 md:text-base">
                View all quiz attempts and statistics for this class group.
              </p>
            </div>
          </section>

          {/* STATS + TABLE */}
          <section className="mx-auto w-full max-w-5xl space-y-6">
            {/* Summary / stats card */}
            <Card className="rounded-3xl border border-white/5 bg-card/80 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Class: {classInfo.name}
                </CardTitle>
                <CardDescription className="space-y-1 text-sm text-zinc-400">
                  <div>
                    Join Code:{" "}
                    <span className="font-mono text-zinc-100">
                      {classInfo.joinCode}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <div className="text-xs text-zinc-500">
                      Total assignments
                    </div>
                    <div className="text-lg font-semibold text-zinc-100">
                      {totalAssignments}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Total attempts</div>
                    <div className="text-lg font-semibold text-zinc-100">
                      {totalAttempts}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Average score</div>
                    <div className="text-lg font-semibold text-zinc-100">
                      {averagePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                  className="mt-2"
                >
                  Back to dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Results table card */}
            <Card className="rounded-3xl border border-white/5 bg-card/80 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Results</CardTitle>
                <CardDescription className="text-sm text-zinc-400">
                  Attempts across all assignments in this class.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-sm text-zinc-400">
                    No results yet for this class.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-background/40">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-300">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Student
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Assignment
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Score
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Percent
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => {
                          const percent = r.total
                            ? (r.score / r.total) * 100
                            : 0;
                          return (
                            <tr
                              key={r.id}
                              className="border-t border-white/5 bg-background/40 hover:bg-white/[0.04]"
                            >
                              <td className="px-3 py-2 font-mono text-xs text-zinc-200">
                                <Link
                                  href={`/classes/${classId}/students/${r.userId}`}
                                  className="text-blue-400 hover:underline"
                                >
                                  {r.userEmail || r.userId}
                                </Link>
                              </td>
                              <td className="px-3 py-2 text-zinc-100">
                                {r.assignmentId
                                  ? assignmentTitleById[r.assignmentId] ??
                                    r.assignmentId
                                  : "—"}
                              </td>
                              <td className="px-3 py-2 text-zinc-100">
                                {r.score} / {r.total}
                              </td>
                              <td className="px-3 py-2 text-zinc-100">
                                {percent.toFixed(1)}%
                              </td>
                              <td className="px-3 py-2 text-zinc-300">
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
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
