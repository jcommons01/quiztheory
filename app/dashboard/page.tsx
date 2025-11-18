"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { auth } from "@/lib/firebase";
import {
  getUserQuizzes,
  UserProfile,
  createClassGroup,
  getTeacherClasses,
  ClassGroup,
  joinClassByCode,
  getStudentClasses,
  createQuizAssignment,
  getClassAssignments,
  QuizAssignment,
  getResultsForUser,
  QuizResult,
  setQuizPublicId,
  generatePublicId,
} from "@/lib/firestore";

import { getFirestore, doc, onSnapshot } from "firebase/firestore";

import AppShell from "@/components/layout/app-shell";


import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/*  Upgrade to Pro button                                                     */
/* -------------------------------------------------------------------------- */

function UpgradeToProButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      // could redirect to /auth if needed
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned", data);
      }
    } catch (err) {
      console.error("Upgrade error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      className="mt-2 w-full bg-violet-600 hover:bg-violet-500 sm:w-auto"
    >
      {loading ? "Redirecting…" : "Upgrade to Pro"}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard page                                                            */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  // Quiz generation state
  const [mode, setMode] = React.useState<"text" | "file" | "image">("text");
  const [text, setText] = React.useState("");
  const [fileInput, setFileInput] = React.useState<File | null>(null);
  const [imageInput, setImageInput] = React.useState<File | null>(null);
  const [numQuestions, setNumQuestions] = React.useState(10);
  const [difficulty, setDifficulty] = React.useState("Auto");
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingPhase, setLoadingPhase] = React.useState<
    null | "extract" | "generate"
  >(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Data
  const [quizzes, setQuizzes] = React.useState<
    Array<{
      id: string;
      title?: string;
      createdAt?: number;
      questions?: unknown[];
      publicId?: string;
    }>
  >([]);
  const [demoQuizzes, setDemoQuizzes] = React.useState<
    Array<{ id: string; title: string; demo: true; questionsCount: number }>
  >([]);
  const [shareLinks, setShareLinks] = React.useState<Record<string, string>>(
    {}
  );
  const [sharingQuizId, setSharingQuizId] = React.useState<string | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [userProfile, setUserProfile] =
    React.useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Classes (teacher/institution)
  const [classes, setClasses] = React.useState<ClassGroup[]>([]);
  const [loadingClasses, setLoadingClasses] = React.useState(false);
  const [assignmentCounts, setAssignmentCounts] = React.useState<
    Record<string, number>
  >({});

  // Student join (individual)
  const [joinCode, setJoinCode] = React.useState("");
  const [studentClasses, setStudentClasses] = React.useState<ClassGroup[]>([]);
  const [joiningClass, setJoiningClass] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  // Assignment dialog
  const [showAssignDialog, setShowAssignDialog] = React.useState(false);
  const [activeAssignClass, setActiveAssignClass] =
    React.useState<ClassGroup | null>(null);
  const [selectedQuizId, setSelectedQuizId] = React.useState("");
  const [assignmentTitle, setAssignmentTitle] = React.useState("");
  const [creatingAssignment, setCreatingAssignment] = React.useState(false);
  const [assignmentError, setAssignmentError] = React.useState<string | null>(
    null
  );
  const [studentAssignments, setStudentAssignments] = React.useState<
    Record<string, QuizAssignment[]>
  >({});

  // User results (individual stats)
  const [userResults, setUserResults] = React.useState<QuizResult[]>([]);
  const [loadingUserResults, setLoadingUserResults] = React.useState(false);

  // Demo quiz modal state
  const [showDemoDialog, setShowDemoDialog] = React.useState(false);
  const [activeDemoQuiz, setActiveDemoQuiz] = React.useState<{
    id: string;
    title: string;
    demo: true;
    questionsCount: number;
  } | null>(null);

  // Join-class dialog (new)
  const [showJoinDialog, setShowJoinDialog] = React.useState(false);

  // Subscription / plan derived state
  const currentTier = userProfile?.subscriptionTier ?? "free";
  const isProOrAbove =
    currentTier === "pro" ||
    currentTier === "teacher" ||
    currentTier === "institution";
  const FREE_QUIZ_LIMIT = 3;
  const limitReached = !isProOrAbove && quizzes.length >= FREE_QUIZ_LIMIT;

  /* ---------------------------------------------------------------------- */
  /*  Auth guard                                                            */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /*  Load user profile + quizzes + classes                                 */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      const unsubProfile = onSnapshot(userRef, async (snap) => {
        const profile = snap.exists()
          ? (snap.data() as UserProfile)
          : null;
        setUserProfile(profile);

        if (profile) {
          const quizData = await getUserQuizzes(user.uid);
          setQuizzes(
            quizData as Array<{
              id: string;
              title?: string;
              createdAt?: number;
              questions?: unknown[];
              publicId?: string;
            }>
          );

          if (!quizData.length) {
            setDemoQuizzes([
              {
                id: "demo-gcse-bio",
                title: "Demo: GCSE Biology - Cells",
                demo: true,
                questionsCount: 5,
              },
              {
                id: "demo-history-ww2",
                title: "Demo: Modern History - WWII Overview",
                demo: true,
                questionsCount: 6,
              },
            ]);
          }

          if (profile.role === "teacher" || profile.role === "institution") {
            setLoadingClasses(true);
            try {
              const classData = await getTeacherClasses(user.uid);
              setClasses(classData);
            } finally {
              setLoadingClasses(false);
            }
          }
        }

        setLoadingProfile(false);
      });

      return unsubProfile;
    });

    return () => unsub();
  }, [router]);

  /* ---------------------------------------------------------------------- */
  /*  Assignment counts for teacher/institution                             */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    const loadCounts = async () => {
      if (!auth.currentUser) return;
      if (
        !userProfile ||
        (userProfile.role !== "teacher" &&
          userProfile.role !== "institution")
      )
        return;

      try {
        const map: Record<string, number> = {};
        for (const c of classes) {
          if (!c.id) continue;
          try {
            const list = await getClassAssignments(c.id);
            map[c.id] = list.length;
          } catch {
            map[c.id] = 0;
          }
        }
        setAssignmentCounts(map);
      } catch (e) {
        console.error("Load assignment counts failed", e);
      }
    };

    void loadCounts();
  }, [classes, userProfile]);

  /* ---------------------------------------------------------------------- */
  /*  Student classes                                                       */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    const loadStudent = async () => {
      if (!auth.currentUser || userProfile?.role !== "user") return;
      try {
        const list = await getStudentClasses(auth.currentUser.uid);
        setStudentClasses(list);
      } catch (e) {
        console.error("Load student classes failed", e);
      }
    };
    void loadStudent();
  }, [userProfile]);

  /* ---------------------------------------------------------------------- */
  /*  Assignments for student classes                                       */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    const loadAssignments = async () => {
      if (!studentClasses.length) return;
      try {
        const result: Record<string, QuizAssignment[]> = {};
        for (const cls of studentClasses) {
          if (!cls.id) continue;
          try {
            const list = await getClassAssignments(cls.id);
            result[cls.id] = list;
          } catch {
            result[cls.id] = [];
          }
        }
        setStudentAssignments(result);
      } catch (e) {
        console.error("Load student assignments failed", e);
      }
    };
    void loadAssignments();
  }, [studentClasses]);

  /* ---------------------------------------------------------------------- */
  /*  User results for stats                                                */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    const loadUserResults = async () => {
      if (!auth.currentUser || userProfile?.role !== "user") return;
      setLoadingUserResults(true);
      try {
        const list = await getResultsForUser(auth.currentUser.uid);
        setUserResults(list);
      } catch (e) {
        console.error("Load user results failed", e);
      } finally {
        setLoadingUserResults(false);
      }
    };
    loadUserResults();
  }, [userProfile]);

  const totalQuizzesTaken = userResults.length;
  const averageScorePercent = totalQuizzesTaken
    ? Math.round(
        userResults.reduce(
          (acc, r) =>
            acc + (r.total ? (r.score / r.total) * 100 : 0),
          0
        ) / totalQuizzesTaken
      )
    : 0;

  /* ---------------------------------------------------------------------- */
  /*  Handlers                                                              */
  /* ---------------------------------------------------------------------- */

  async function handleCreateClass() {
    if (!auth.currentUser) return;
    const name = prompt("Enter class name");
    if (!name?.trim()) return;
    try {
      setLoadingClasses(true);
      await createClassGroup(auth.currentUser.uid, name.trim());
      const updated = await getTeacherClasses(auth.currentUser.uid);
      setClasses(updated);
    } catch (e) {
      console.error("Create class failed", e);
    } finally {
      setLoadingClasses(false);
    }
  }

  async function handleShare(q: { id: string; publicId?: string }) {
    if (!q?.id) return;
    setSharingQuizId(q.id);
    try {
      let publicId = q.publicId;
      if (!publicId) {
        publicId = generatePublicId();
        await setQuizPublicId(q.id, publicId);
        setQuizzes((prev) =>
          prev.map((item) =>
            item.id === q.id ? { ...item, publicId } : item
          )
        );
      }
      const url = `${appUrl}/p/${publicId}`;
      setShareLinks((prev) => ({ ...prev, [q.id]: url }));
    } catch (e) {
      console.error("Share link generation failed", e);
    } finally {
      setSharingQuizId(null);
    }
  }

  async function handleJoinClass() {
    if (!auth.currentUser) return;
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) return;
    setJoiningClass(true);
    setJoinError(null);
    try {
      await joinClassByCode(auth.currentUser.uid, code);
      setJoinCode("");
      const updated = await getStudentClasses(auth.currentUser.uid);
      setStudentClasses(updated);
    } catch (e: any) {
      console.error("Join class failed", e);
      setJoinError(e?.message || "Failed to join class");
    } finally {
      setJoiningClass(false);
    }
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!auth.currentUser || !activeAssignClass?.id) return;
    if (!selectedQuizId || !assignmentTitle.trim()) {
      setAssignmentError("Select a quiz and enter a title.");
      return;
    }
    setCreatingAssignment(true);
    setAssignmentError(null);
    try {
      await createQuizAssignment({
        classId: activeAssignClass.id,
        quizId: selectedQuizId,
        title: assignmentTitle.trim(),
        createdBy: auth.currentUser.uid,
      });
      const list = await getClassAssignments(activeAssignClass.id);
      setAssignmentCounts((prev) => ({
        ...prev,
        [activeAssignClass.id!]: list.length,
      }));
      setSelectedQuizId("");
      setAssignmentTitle("");
      setShowAssignDialog(false);
    } catch (e: any) {
      console.error("Create assignment failed", e);
      setAssignmentError(e?.message || "Failed to create assignment");
    } finally {
      setCreatingAssignment(false);
    }
  }

  async function handleGenerate() {
    if (mode === "text" && !text.trim()) return;
    if (mode === "file" && !fileInput) return;
    if (mode === "image" && !imageInput) return;

    setIsLoading(true);
    setLoadingPhase(null);
    setGenerationError(null);

    try {
      let sourceText = "";

      if (mode === "text") {
        sourceText = text.trim();
      } else {
        setLoadingPhase("extract");
        const fd = new FormData();
        fd.append("file", (mode === "file" ? fileInput : imageInput)!);
        const extractRes = await fetch("/api/extract", {
          method: "POST",
          body: fd,
        });
        if (!extractRes.ok) {
          try {
            const errJson = await extractRes.json();
            setGenerationError(
              errJson.error ??
                "Something went wrong generating your quiz."
            );
          } catch {
            setGenerationError(
              "Something went wrong generating your quiz."
            );
          }
          return;
        }
        const data = (await extractRes.json()) as {
          text?: string;
          error?: string;
        };
        if (!data.text) return;
        sourceText = data.text.trim();
      }

      if (!sourceText) return;

      setLoadingPhase("generate");
      const generationPayload = {
        content: sourceText,
        numQuestions,
        difficulty,
      };
      const genRes = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generationPayload),
      });
      if (!genRes.ok) {
        try {
          const errJson = await genRes.json();
          setGenerationError(
            errJson.error ??
              "Something went wrong generating your quiz."
          );
        } catch {
          setGenerationError(
            "Something went wrong generating your quiz."
          );
        }
        return;
      }
      const quizData = (await genRes.json()) as {
        questions: Array<{
          question: string;
          options: string[];
          answer: string;
          explanation?: string;
        }>;
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("new-quiz", JSON.stringify(quizData));
        sessionStorage.setItem(
          "last-quiz-gen",
          JSON.stringify(generationPayload)
        );
      }
      router.push("/quiz/create");
    } catch (e) {
      console.error("Generate flow error", e);
      setGenerationError("Something went wrong generating your quiz.");
    } finally {
      setIsLoading(false);
      setLoadingPhase(null);
    }
  }

  function uploadAreaProps(accept: string, kind: "file" | "image") {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (!f) return;
        if (
          !accept
            .split(",")
            .some((ext) =>
              f.name
                .toLowerCase()
                .endsWith(ext.trim().replace(/\./, ""))
            )
        )
          return;
        kind === "file" ? setFileInput(f) : setImageInput(f);
      },
    };
  }

  if (checkingAuth) {
    return (
      <AppShell
        extraActions={
          auth.currentUser && userProfile?.role === "user" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowJoinDialog(true)}
            >
              Join a class
            </Button>
          ) : null
        }
      >
        <div className="flex h-[60vh] items-center justify-center text-sm text-zinc-400">
          Checking your session...
        </div>
      </AppShell>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Main render                                                           */
  /* ---------------------------------------------------------------------- */

  return (
    <AppShell
      extraActions={
        auth.currentUser && userProfile?.role === "user" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowJoinDialog(true)}
          >
            Join a class
          </Button>
        ) : null
      }
    >
      <div className="space-y-8 px-4 pb-10 lg:space-y-12 lg:px-0">

        {/* HERO */}
        <section className="pt-2 lg:pt-0">
  <div className="mx-auto w-full max-w-full text-center">
    <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
  Create and manage <span className="text-slate-50/90">your</span> quizzes
</h1>

    

            <p className="mt-4 text-sm text-slate-400 md:text-base">
              Paste notes, upload PDFs or images, then generate and share
              AI-powered quizzes.
            </p>

            {/* Plan badge */}
            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                Plan: {isProOrAbove ? "Pro" : "Free"}
              </span>
            </div>

            {/* Free-plan notice + button */}
            {!isProOrAbove && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="w-full max-w-full rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1 text-center text-[11px] text-amber-200 md:text-xs wrap-break-word">
                  Free plan: 3 quizzes per month. Upgrade to unlock PDF &amp;
                  image to quiz.
                </div>
                <UpgradeToProButton />
              </div>
            )}
          </div>
        </section>

        {/* MAIN GRID */}
      <section className="grid min-w-0 max-w-full items-start gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.6fr)]">
          {/* LEFT: Create quiz */}
          <Card className="min-w-0 max-w-full">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Create a new quiz
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Turn any text, photo, or PDF into questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  if (!isProOrAbove && v !== "text") return;
                  setMode(v as any);
                }}
                className="w-full"
              >
                <TabsList className="text-xs sm:text-sm">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger
                    value="file"
                    className={
                      !isProOrAbove ? "pointer-events-none opacity-40" : ""
                    }
                    aria-disabled={!isProOrAbove}
                  >
                    File
                  </TabsTrigger>
                  <TabsTrigger
                    value="image"
                    className={
                      !isProOrAbove ? "pointer-events-none opacity-40" : ""
                    }
                    aria-disabled={!isProOrAbove}
                  >
                    Image
                  </TabsTrigger>
                </TabsList>

                {!isProOrAbove && (
                  <div className="pt-2 text-xs text-zinc-500">
                    Upgrade to unlock PDF &amp; image to quiz.
                  </div>
                )}

                {/* TEXT MODE */}
                <TabsContent value="text" className="space-y-4 pt-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste notes or content here..."
                    className="min-h-40 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none shadow-xs placeholder:text-zinc-500 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="num-questions">
                        Number of questions
                      </Label>
                      <select
                        id="num-questions"
                        value={numQuestions}
                        onChange={(e) =>
                          setNumQuestions(Number(e.target.value))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {[5, 10, 15, 20].map((n) => (
                          <option
                            key={n}
                            value={n}
                            className="bg-zinc-950"
                          >
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <select
                        id="difficulty"
                        value={difficulty}
                        onChange={(e) =>
                          setDifficulty(e.target.value)
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {["Auto", "Easy", "Medium", "Hard"].map((d) => (
                          <option
                            key={d}
                            value={d}
                            className="bg-zinc-950"
                          >
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={isLoading || !text.trim() || limitReached}
                    aria-busy={isLoading}
                  >
                    {isLoading
                      ? loadingPhase === "extract"
                        ? "Extracting text…"
                        : "Generating quiz…"
                      : "Generate quiz"}
                  </Button>
                  {generationError && (
                    <div className="mt-3 rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                      {generationError}
                    </div>
                  )}
                  {limitReached && (
                    <div className="text-[11px] text-zinc-500">
                      Free plan limit reached — upgrade to create more monthly
                      quizzes.
                    </div>
                  )}
                </TabsContent>

                {/* FILE MODE */}
                <TabsContent value="file" className="space-y-4 pt-2">
                  <div
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-zinc-700 p-6 text-sm text-zinc-400 transition hover:border-zinc-500"
                    {...uploadAreaProps(".pdf,.docx", "file")}
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                  >
                    <span>
                      {fileInput
                        ? fileInput.name
                        : "Click or drag a PDF / DOCX here"}
                    </span>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setFileInput(f);
                      }}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="num-questions-file">
                        Number of questions
                      </Label>
                      <select
                        id="num-questions-file"
                        value={numQuestions}
                        onChange={(e) =>
                          setNumQuestions(Number(e.target.value))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {[5, 10, 15, 20].map((n) => (
                          <option
                            key={n}
                            value={n}
                            className="bg-zinc-950"
                          >
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="difficulty-file">
                        Difficulty
                      </Label>
                      <select
                        id="difficulty-file"
                        value={difficulty}
                        onChange={(e) =>
                          setDifficulty(e.target.value)
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {["Auto", "Easy", "Medium", "Hard"].map((d) => (
                          <option
                            key={d}
                            value={d}
                            className="bg-zinc-950"
                          >
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={
                      isLoading ||
                      !fileInput ||
                      limitReached ||
                      !isProOrAbove
                    }
                    aria-busy={isLoading}
                  >
                    {isLoading
                      ? loadingPhase === "extract"
                        ? "Extracting text…"
                        : "Generating quiz…"
                      : "Generate quiz"}
                  </Button>
                  {generationError && (
                    <div className="mt-3 rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                      {generationError}
                    </div>
                  )}
                  {!isProOrAbove && (
                    <div className="text-[11px] text-zinc-500">
                      Upgrade to unlock PDF &amp; image to quiz.
                    </div>
                  )}
                </TabsContent>

                {/* IMAGE MODE */}
                <TabsContent value="image" className="space-y-4 pt-2">
                  <div
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-zinc-700 p-6 text-sm text-zinc-400 transition hover:border-zinc-500"
                    {...uploadAreaProps(".png,.jpg,.jpeg", "image")}
                    onClick={() =>
                      document.getElementById("image-input")?.click()
                    }
                  >
                    <span>
                      {imageInput
                        ? imageInput.name
                        : "Click or drag an image (PNG/JPG) here"}
                    </span>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/png,image/jpg,image/jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setImageInput(f);
                      }}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="num-questions-image">
                        Number of questions
                      </Label>
                      <select
                        id="num-questions-image"
                        value={numQuestions}
                        onChange={(e) =>
                          setNumQuestions(Number(e.target.value))
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {[5, 10, 15, 20].map((n) => (
                          <option
                            key={n}
                            value={n}
                            className="bg-zinc-950"
                          >
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="difficulty-image">
                        Difficulty
                      </Label>
                      <select
                        id="difficulty-image"
                        value={difficulty}
                        onChange={(e) =>
                          setDifficulty(e.target.value)
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {["Auto", "Easy", "Medium", "Hard"].map((d) => (
                          <option
                            key={d}
                            value={d}
                            className="bg-zinc-950"
                          >
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={
                      isLoading ||
                      !imageInput ||
                      limitReached ||
                      !isProOrAbove
                    }
                    aria-busy={isLoading}
                  >
                    {isLoading
                      ? loadingPhase === "extract"
                        ? "Extracting text…"
                        : "Generating quiz…"
                      : "Generate quiz"}
                  </Button>
                  {generationError && (
                    <div className="mt-3 rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                      {generationError}
                    </div>
                  )}
                  {!isProOrAbove && (
                    <div className="text-[11px] text-zinc-500">
                      Upgrade to unlock PDF &amp; image to quiz.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* RIGHT: Stats + My quizzes + Classes */}
          <div className="flex min-w-0 max-w-full flex-col gap-6">
            {userProfile?.role === "user" && (
              <Card className="min-w-0 max-w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loadingUserResults ? (
                    <div className="text-xs text-zinc-400">
                      Loading stats…
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                          Quizzes taken:
                        </span>
                        <span className="font-medium">
                          {totalQuizzesTaken}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                          Average score:
                        </span>
                        <span className="font-medium">
                          {averageScorePercent}%
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* My quizzes */}
            <Card className="min-w-0 max-w-full">
              <CardHeader>
                <CardTitle>My quizzes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="search" className="sr-only">
                    Search quizzes
                  </Label>
                  <Input id="search" placeholder="Search…" />
                </div>

                {quizzes.length === 0 ? (
                  <>
                    <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
                      <div className="font-medium">
                        You haven’t created any quizzes yet.
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">
                        Generate your first quiz or explore the demos below.
                      </div>
                    </div>
                    {demoQuizzes.length > 0 && (
                      <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium tracking-tight">
                            Demo quizzes
                          </h3>
                          <span className="text-[11px] text-zinc-500">
                            Read-only previews
                          </span>
                        </div>
                        <div className="space-y-3">
                          {demoQuizzes.map((d) => (
                            <Card
                              key={d.id}
                              className="border-zinc-800"
                            >
                              <CardContent className="py-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 truncate font-medium">
                                      <span className="truncate">
                                        {d.title}
                                      </span>
                                      <span className="inline-flex items-center rounded-full border border-indigo-600/60 bg-indigo-900/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-indigo-300">
                                        Demo
                                      </span>
                                    </div>
                                    <div className="text-sm text-zinc-400">
                                      {d.questionsCount} questions • Preview
                                      only
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <Button
                                      onClick={() => {
                                        setActiveDemoQuiz(d);
                                        setShowDemoDialog(true);
                                      }}
                                    >
                                      Open
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((q) => {
                      const title = q.title || "Untitled quiz";
                      const count = Array.isArray(q.questions)
                        ? q.questions.length
                        : 0;
                      const date = q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString()
                        : "—";
                      return (
                        <Card key={q.id} className="w-full">
                          <CardContent className="flex flex-col gap-2 py-4">
                            <div className="flex items-center gap-2 truncate font-medium">
                              <span className="truncate">{title}</span>
                              {q.publicId && (
                                <span className="inline-flex items-center rounded-full border border-emerald-600/60 bg-emerald-900/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                                  Shared
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {count}{" "}
                              {count === 1 ? "question" : "questions"} •
                              Created {date}
                            </div>
                            <div className="mt-2 flex w-full flex-col flex-wrap gap-2 xs:flex-row">
                              <Button
                                className="w-full xs:w-auto"
                                onClick={() =>
                                  router.push(`/quiz/${q.id}`)
                                }
                              >
                                Open
                              </Button>
                              <Button
                                className="w-full xs:w-auto"
                                variant="secondary"
                                onClick={() =>
                                  router.push(`/quiz/${q.id}/edit`)
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                className="w-full xs:w-auto"
                                variant="outline"
                                size="sm"
                                disabled={sharingQuizId === q.id}
                                aria-busy={sharingQuizId === q.id}
                                onClick={() => handleShare(q)}
                              >
                                {sharingQuizId === q.id
                                  ? "Sharing…"
                                  : "Share"}
                              </Button>
                            </div>
                            {shareLinks[q.id] && (
                              <div className="mt-3 flex items-center gap-2">
                                <Input
                                  readOnly
                                  value={shareLinks[q.id]}
                                  className="text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    const url = shareLinks[q.id];
                                    if (!url) return;
                                    navigator.clipboard
                                      .writeText(url)
                                      .catch((err) =>
                                        console.error(
                                          "Clipboard copy failed",
                                          err
                                        )
                                      );
                                  }}
                                >
                                  Copy
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Demo section below real quizzes */}
                {quizzes.length > 0 && demoQuizzes.length > 0 && (
                  <div className="space-y-3 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium tracking-tight">
                        Demo quizzes
                      </h3>
                      <span className="text-[11px] text-zinc-500">
                        Read-only previews
                      </span>
                    </div>
                    <div className="space-y-3">
                      {demoQuizzes.map((d) => (
                        <Card
                          key={d.id}
                          className="border-zinc-800"
                        >
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 truncate font-medium">
                                  <span className="truncate">
                                    {d.title}
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-indigo-600/60 bg-indigo-900/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-indigo-300">
                                    Demo
                                  </span>
                                </div>
                                <div className="text-sm text-zinc-400">
                                  {d.questionsCount} questions • Preview only
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <Button
                                  onClick={() => {
                                    setActiveDemoQuiz(d);
                                    setShowDemoDialog(true);
                                  }}
                                >
                                  Open
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Classes (teacher / institution) */}
                {userProfile &&
                  (userProfile.role === "teacher" ||
                    userProfile.role === "institution") &&
                  (currentTier === "free" ? (
                    <Card className="mt-6">
                      <CardContent className="py-6">
                        <div className="text-center text-xs text-zinc-500">
                          Classes &amp; assignments are available on Pro.
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="mt-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          Classes
                        </CardTitle>
                        <CardDescription>
                          Manage your class groups.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button
                          size="sm"
                          onClick={handleCreateClass}
                          disabled={loadingClasses}
                          aria-busy={loadingClasses}
                        >
                          {loadingClasses ? "Creating…" : "Create class"}
                        </Button>
                        {loadingClasses && classes.length === 0 && (
                          <div className="text-xs text-zinc-400">
                            Loading classes…
                          </div>
                        )}
                        {classes.length === 0 && !loadingClasses ? (
                          <div className="rounded-md border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-400">
                            No classes yet. Create one to get a join code.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {classes.map((cls) => (
                              <div
                                key={cls.id}
                                className="space-y-2 rounded-md border border-zinc-800 p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">
                                      {cls.name}
                                    </div>
                                    <div className="text-[11px] text-zinc-400">
                                      CODE: {cls.joinCode}
                                    </div>
                                    <div className="text-[11px] text-zinc-500">
                                      Assignments:{" "}
                                      {assignmentCounts[cls.id!] ?? 0}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setActiveAssignClass(cls);
                                      setShowAssignDialog(true);
                                    }}
                                  >
                                    Assign quiz
                                  </Button>
                                </div>
                                {(userProfile?.role === "teacher" ||
                                  userProfile?.role ===
                                    "institution") && (
                                  <div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        router.push(
                                          `/classes/${cls.id}/results`
                                        )
                                      }
                                    >
                                      View results
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* ASSIGN QUIZ DIALOG */}
      <Dialog
        open={showAssignDialog}
        onOpenChange={(open) => {
          if (!open) setShowAssignDialog(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a quiz</DialogTitle>
            <DialogDescription>
              {activeAssignClass
                ? `Create an assignment for ${activeAssignClass.name}`
                : "Select a quiz and title."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateAssignment}>
            {assignmentError && (
              <div className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                {assignmentError}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="assign-quiz-select">Quiz</Label>
              <select
                id="assign-quiz-select"
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="" className="bg-zinc-950">
                  Select a quiz…
                </option>
                {quizzes.map((q) => (
                  <option
                    key={q.id}
                    value={q.id}
                    className="bg-zinc-950"
                  >
                    {q.title || "Untitled quiz"}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assign-title">Assignment title</Label>
              <Input
                id="assign-title"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="e.g. Chapter 3 Review"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAssignDialog(false)}
                disabled={creatingAssignment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  creatingAssignment ||
                  !selectedQuizId ||
                  !assignmentTitle.trim()
                }
                aria-busy={creatingAssignment}
              >
                {creatingAssignment ? "Assigning…" : "Create assignment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DEMO QUIZ PREVIEW DIALOG */}
      <Dialog
        open={showDemoDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDemoDialog(false);
            setActiveDemoQuiz(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeDemoQuiz ? activeDemoQuiz.title : "Demo quiz"}
            </DialogTitle>
            <DialogDescription>
              Preview only — example structure for a generated quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-zinc-300">
            <p>
              This is a placeholder preview. Generate your own quiz by pasting
              text, uploading a PDF, or selecting an image on the left.
            </p>
            {activeDemoQuiz && (
              <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-400">
                {Array.from({
                  length: activeDemoQuiz.questionsCount,
                }).map((_, i) => (
                  <li key={i}>
                    Sample question {i + 1} (options &amp; answers would appear
                    here)
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-zinc-500">
              Demo quizzes don’t count toward your plan limits.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDemoDialog(false);
                setActiveDemoQuiz(null);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* JOIN CLASS DIALOG (new) */}
      <Dialog
        open={showJoinDialog}
        onOpenChange={(open) => {
          if (!open) setShowJoinDialog(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a class</DialogTitle>
            <DialogDescription>
              Enter your join code and see any assigned quizzes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase())
                }
                placeholder="Enter join code"
                className="bg-zinc-900 border-zinc-800 sm:flex-1"
              />
              <Button
                onClick={handleJoinClass}
                disabled={joiningClass || !joinCode.trim()}
                aria-busy={joiningClass}
              >
                {joiningClass ? "Joining…" : "Join"}
              </Button>
            </div>
            {joinError && (
              <div className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                {joinError}
              </div>
            )}
            <div className="space-y-2">
              {studentClasses.length === 0 ? (
                <div className="text-xs text-zinc-400">
                  You haven&apos;t joined any classes yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentClasses.map((cls) => {
                    const assignments =
                      studentAssignments[cls.id!] ?? [];
                    return (
                      <div
                        key={cls.id}
                        className="space-y-2 rounded-md border border-zinc-800 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {cls.name}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              Code: {cls.joinCode}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {assignments.length === 0 ? (
                            <div className="text-[11px] text-zinc-500">
                              No assignments yet.
                            </div>
                          ) : (
                            assignments.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between rounded-md border border-zinc-800 px-2 py-1"
                              >
                                <div className="truncate text-xs">
                                  {a.title}
                                </div>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    router.push(
                                      `/quiz/${a.quizId}?assignment=${a.id}`
                                    )
                                  }
                                >
                                  Start quiz
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
