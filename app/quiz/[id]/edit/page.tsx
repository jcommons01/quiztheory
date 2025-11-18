"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import {
  db,
  setQuizPublicId,
  generatePublicId,
} from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type QuizDoc = {
  title?: string;
  questions: QuizQuestion[];
  createdAt?: number;
  userId?: string;
  publicId?: string;
};

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("Untitled quiz");
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [aiBusy, setAiBusy] = React.useState<
    Record<number, "rewrite" | "options" | null>
  >({});
  const [quizPublicId, setQuizPublicIdState] = useState<string | undefined>(
    undefined
  );
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
    let active = true;

    const load = async () => {
      try {
        if (!auth.currentUser) return;
        if (!id) return;

        const ref = doc(db, "quizzes", String(id));
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (!active) return;
          setError("Quiz not found.");
          setLoading(false);
          return;
        }

        const data = snap.data() as QuizDoc;
        if (!active) return;

        setTitle(data.title || "Untitled quiz");
        setQuizPublicIdState(data.publicId);
        setQuestions(
          Array.isArray(data.questions)
            ? data.questions.map((q) => ({
                question: q.question ?? "",
                options: Array.isArray(q.options)
                  ? q.options.slice(0, 4).map((o) => o ?? "")
                  : ["", "", "", ""],
                answer: q.answer ?? "",
                explanation: (q as any).explanation ?? "",
              }))
            : []
        );
        setLoading(false);
      } catch (e) {
        if (!active) return;
        setError("Failed to load quiz.");
        setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  function updateQuestionText(index: number, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], question: value };
      return next;
    });
  }

  function updateOption(
    index: number,
    optionIdx: number,
    value: string
  ) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[index] };
      const opts = [...q.options];
      const oldOption = opts[optionIdx];
      opts[optionIdx] = value;
      q.options = opts;

      // if the answer was tied to the old option string, update it to stay aligned
      if (
        q.answer &&
        optionIdx >= 0 &&
        optionIdx < opts.length &&
        oldOption &&
        q.answer === oldOption
      ) {
        q.answer = value;
      }

      next[index] = q;
      return next;
    });
  }

  function markCorrect(index: number, optionIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[index] };
      q.answer = q.options[optionIdx] ?? "";
      next[index] = q;
      return next;
    });
  }

  function deleteQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        answer: "",
        explanation: "",
      },
    ]);
  }

  async function handleSave() {
    try {
      setSaving(true);
      const ref = doc(db, "quizzes", String(id));
      await updateDoc(ref, {
        title: title?.trim() || "Untitled quiz",
        questions,
      });
      router.push(`/quiz/${id}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to save", e);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!id) return;

    if (quizPublicId) {
      setPublicLink(`${appUrl}/p/${quizPublicId}`);
      return;
    }

    setSharing(true);
    try {
      const newCode = generatePublicId();
      await setQuizPublicId(String(id), newCode);
      setQuizPublicIdState(newCode);
      setPublicLink(`${appUrl}/p/${newCode}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Share quiz failed", e);
      alert("Failed to generate share link.");
    } finally {
      setSharing(false);
    }
  }

  async function rewriteQuestion(index: number) {
    const q = questions[index];
    if (!q) return;

    try {
      setAiBusy((m) => ({ ...m, [index]: "rewrite" }));
      const res = await fetch("/api/quiztools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite_question",
          question: q.question,
          options: q.options,
        }),
      });
      if (!res.ok) throw new Error("rewrite failed");

      const data = (await res.json()) as { question: string };
      setQuestions((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], question: data.question };
        return next;
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert("Failed to rewrite question.");
    } finally {
      setAiBusy((m) => ({ ...m, [index]: null }));
    }
  }

  async function regenerateOptions(index: number) {
    const q = questions[index];
    if (!q) return;

    try {
      setAiBusy((m) => ({ ...m, [index]: "options" }));
      const res = await fetch("/api/quiztools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_options",
          question: q.question,
          options: q.options,
        }),
      });
      if (!res.ok) throw new Error("regenerate failed");

      const data = (await res.json()) as {
        options: string[];
        answer: string;
      };
      setQuestions((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          options: data.options,
          answer: data.answer,
        };
        return next;
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert("Failed to regenerate options.");
    } finally {
      setAiBusy((m) => ({ ...m, [index]: null }));
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

  if (loading) {
    return (
      <AppShell>
        <PageContainer>
          {/* Hero header */}
          <section className="pt-2 lg:pt-0">
            <div className="mx-auto max-w-6xl text-center">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Edit quiz
              </h1>
              <p className="mt-4 text-sm text-slate-400 md:text-base">
                Loading your quiz questions and details.
              </p>
            </div>
          </section>
          <div className="mx-auto max-w-screen-sm pt-10">
            <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
              <CardContent className="py-8 px-4 text-center text-sm text-zinc-400 sm:px-8">
                Loading…
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageContainer>
          {/* Hero header */}
          <section className="pt-2 lg:pt-0">
            <div className="mx-auto max-w-6xl text-center">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Edit quiz
              </h1>
              <p className="mt-4 text-sm text-slate-400 md:text-base">
                We couldn&apos;t load this quiz.
              </p>
            </div>
          </section>
          <div className="mx-auto max-w-screen-sm pt-10">
            <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
              <CardContent className="py-6 px-4 sm:px-8 text-sm text-zinc-300">
                {error}
              </CardContent>
              <CardFooter className="flex justify-end gap-3 px-4 py-4 sm:px-8">
                <Button onClick={() => router.push(`/quiz/${id}`)}>
                  ← Back to quiz
                </Button>
              </CardFooter>
            </Card>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        {/* Hero header */}
        <section className="pt-2 lg:pt-0">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
              Edit quiz
            </h1>
            <p className="mt-4 text-sm text-slate-400 md:text-base">
              Update your quiz title, questions, options, and correct
              answers.
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto w-full max-w-screen-md space-y-6 pb-24 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push(`/quiz/${id}`)}
              >
                ← Back to quiz
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                disabled={sharing}
                aria-busy={sharing}
              >
                {sharing ? "Sharing…" : "Share quiz"}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>

          {publicLink && (
            <div className="mt-2 flex w-full items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200">
              <div className="flex-1 truncate">{publicLink}</div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (!publicLink) return;
                  navigator.clipboard
                    .writeText(publicLink)
                    .catch((err) =>
                      console.error("Copy failed", err)
                    );
                }}
              >
                Copy
              </Button>
            </div>
          )}

          <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Edit quiz
              </CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Tidy up wording, balance options, and keep each
                explanation short and clear.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Quiz title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Plumbing Level 3 – Cold Water"
                />
              </div>

              <div className="space-y-6">
                {questions.map((q, i) => (
                  <Card
                    key={i}
                    className="border border-zinc-800 bg-zinc-900/60"
                  >
                    <CardHeader>
                      <CardTitle className="text-base">
                        Question {i + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`q-${i}`}>
                          Question text
                        </Label>
                        <Textarea
                          id={`q-${i}`}
                          value={q.question}
                          onChange={(e) =>
                            updateQuestionText(i, e.target.value)
                          }
                          placeholder="Enter question…"
                        />
                      </div>

                      <div className="grid gap-3">
                        <div className="text-sm text-zinc-400">
                          Options (mark the correct one)
                        </div>
                        {[0, 1, 2, 3].map((optIdx) => (
                          <div
                            key={optIdx}
                            className="flex items-center gap-3"
                          >
                            <input
                              type="radio"
                              name={`answer-${i}`}
                              className="size-4 accent-green-600"
                              checked={
                                q.options[optIdx] === q.answer
                              }
                              onChange={() =>
                                markCorrect(i, optIdx)
                              }
                              aria-label={`Mark option ${
                                optIdx + 1
                              } correct`}
                            />
                            <Input
                              value={q.options[optIdx] ?? ""}
                              onChange={(e) =>
                                updateOption(
                                  i,
                                  optIdx,
                                  e.target.value
                                )
                              }
                              placeholder={`Option ${
                                optIdx + 1
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`exp-${i}`}>
                          Explanation
                        </Label>
                        <Textarea
                          id={`exp-${i}`}
                          value={q.explanation}
                          onChange={(e) =>
                            setQuestions((prev) => {
                              const next = [...prev];
                              next[i] = {
                                ...next[i],
                                explanation: e.target.value,
                              };
                              return next;
                            })
                          }
                          placeholder="Brief explanation (1–3 sentences)…"
                          className="text-sm"
                        />
                        <p className="text-xs text-zinc-400">
                          Shown to users after answering – keep it
                          concise and practical.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center gap-2 px-4 py-4 sm:px-6">
                      <Button
                        variant="secondary"
                        onClick={() => rewriteQuestion(i)}
                        disabled={aiBusy[i] === "rewrite"}
                      >
                        {aiBusy[i] === "rewrite"
                          ? "Rewriting…"
                          : "Rewrite question"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => regenerateOptions(i)}
                        disabled={aiBusy[i] === "options"}
                      >
                        {aiBusy[i] === "options"
                          ? "Regenerating…"
                          : "Regenerate options"}
                      </Button>
                      <div className="ms-auto">
                        <Button
                          variant="secondary"
                          onClick={() => deleteQuestion(i)}
                        >
                          Delete question
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}

                <div>
                  <Button
                    variant="secondary"
                    onClick={addQuestion}
                  >
                    + Add question
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
