"use client";

import React, { useCallback, useRef, useState } from "react";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GeneratedQuizResponse {
  questions: any[]; // Adjust type if you have a Question type
  [key: string]: any;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("Medium");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<"extract" | "generate" | null>(null);

  const dropRef = useRef<HTMLDivElement | null>(null);

  const acceptedTypes = ["application/pdf", "image/png", "image/jpg", "image/jpeg"];

  const onFileSelect = useCallback((f: File) => {
    setFile(f);
    setFileName(f.name);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!acceptedTypes.includes(f.type)) {
      setError("Unsupported file type. Use PDF or PNG/JPG/JPEG.");
      return;
    }
    setError("");
    onFileSelect(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!acceptedTypes.includes(f.type)) {
      setError("Unsupported file type. Use PDF or PNG/JPG/JPEG.");
      return;
    }
    setError("");
    onFileSelect(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const readFileAsBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(f);
    });
  };

  const handleGenerate = async () => {
    setError("");

    if (!content.trim() && !file) {
      setError("Please paste text or upload a file first.");
      return;
    }

    setLoading(true);
    try {
      let effectiveContent = content.trim();

      // Step 1: Extract text if a file is provided
      if (file) {
        setLoadingStage("extract");
        const base64 = await readFileAsBase64(file);
        try {
          const extractRes = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileData: base64, fileType: file.type }),
          });
          if (!extractRes.ok) {
            const errJson = await extractRes.json().catch(() => ({}));
            throw new Error(errJson.error || "Failed to extract text from file.");
          }
          const extracted = await extractRes.json();
          const text = (extracted.text || "").trim();
          if (!text) {
            throw new Error("No text extracted from the file.");
          }
          effectiveContent = text;
          setContent(text);
        } catch (extractError: any) {
          throw new Error(extractError.message || "Problem extracting text.");
        }
      }

      if (!effectiveContent) {
        throw new Error("No content available for quiz generation.");
      }

      // Step 2: Generate quiz
      setLoadingStage("generate");
      const body = {
        content: effectiveContent,
        numQuestions,
        difficulty,
      };

      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to generate quiz.");
      }

      const data: GeneratedQuizResponse = await res.json();

      try {
        sessionStorage.setItem("quizDraft", JSON.stringify(data));
      } catch (e) {
        console.error("Failed to store quizDraft", e);
      }

      router.push("/quiz/create");
    } catch (e: any) {
      setError(e.message || "Unexpected error generating quiz.");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-8 lg:space-y-12">
          {/* Hero header */}
          <section className="pt-2 lg:pt-0">
            <div className="mx-auto w-full max-w-3xl text-center">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Create a quiz
              </h1>
              <p className="mt-4 text-sm text-slate-400 md:text-base">
                Paste your notes or upload a file to generate a custom quiz.
              </p>
            </div>
          </section>

          {/* Main content card */}
          <section className="mx-auto w-full max-w-2xl">
            <Card className="w-full rounded-3xl border border-white/5 bg-card/80 shadow-lg backdrop-blur">
              <CardContent className="space-y-8 px-4 py-8 sm:px-8">
                {/* Text area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Paste your notes or text
                  </label>
                  <Textarea
                    placeholder="Paste your source material here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[180px] bg-background/60"
                  />
                </div>

                {/* File upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Upload a file (optional)
                  </label>
                  <div
                    ref={dropRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-background/40 p-6 text-center transition hover:border-white/30 hover:bg-background/60"
                  >
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                      id="fileInputHidden"
                    />
                    <label
                      htmlFor="fileInputHidden"
                      className="flex flex-col items-center gap-2"
                    >
                      <span className="text-sm text-zinc-300">
                        Drag & drop or click to select a file
                      </span>
                      {fileName ? (
                        <span className="text-xs font-medium text-emerald-300">
                          Selected: {fileName}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">
                          PDF, PNG, JPG up to 5MB
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          document.getElementById("fileInputHidden")?.click()
                        }
                      >
                        Choose file
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="numQuestions"
                      className="text-sm font-medium text-zinc-200"
                    >
                      Number of questions
                    </label>
                    <select
                      id="numQuestions"
                      value={numQuestions}
                      onChange={(e) =>
                        setNumQuestions(Number(e.target.value))
                      }
                      className="h-10 w-full rounded-lg border border-white/10 bg-background/80 px-3 text-sm text-zinc-100 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      {[5, 10, 15, 20, 30].map((n) => (
                        <option
                          key={n}
                          value={n}
                          className="bg-zinc-950 text-zinc-100"
                        >
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="difficulty"
                      className="text-sm font-medium text-zinc-200"
                    >
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-background/80 px-3 text-sm text-zinc-100 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      {["Easy", "Medium", "Hard"].map((d) => (
                        <option
                          key={d}
                          value={d}
                          className="bg-zinc-950 text-zinc-100"
                        >
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Error state */}
                {error && (
                  <div
                    className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* Action button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {loadingStage === "extract" && "Extracting text…"}
                    {loadingStage === "generate" && "Generating quiz…"}
                    {!loadingStage && "Generate quiz"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
