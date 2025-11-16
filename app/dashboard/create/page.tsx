"use client";

import React, { useCallback, useRef, useState } from "react";
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
        // result is a data URL: we can strip the prefix for cleanliness
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
          // Replace existing content with extracted file text per requirements
          effectiveContent = text;
          setContent(text); // populate textarea so user can see what was extracted
        } catch (extractError: any) {
          throw new Error(extractError.message || "Problem extracting text.");
        }
      }

      // Guard again after extraction
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
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Create a Quiz</h1>
        <p className="text-muted-foreground mt-2">Paste your notes or upload a file to generate a custom quiz.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Paste your notes or text</label>
        <Textarea
          placeholder="Paste your source material here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[180px]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Upload a file (optional)</label>
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 p-6 text-center cursor-pointer hover:bg-muted/40 transition"
        >
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
            id="fileInputHidden"
          />
          <label htmlFor="fileInputHidden" className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted-foreground">Drag & drop or click to select a file</span>
            {fileName && (
              <span className="text-sm font-medium text-primary">Selected: {fileName}</span>
            )}
            {!fileName && (
              <span className="text-xs text-muted-foreground">PDF, PNG, JPG up to 5MB</span>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById("fileInputHidden")?.click()}>
              Choose File
            </Button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="numQuestions" className="text-sm font-medium">Number of Questions</label>
          <select
            id="numQuestions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[5,10,15,20,30].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="difficulty" className="text-sm font-medium">Difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {['Easy','Medium','Hard'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 font-medium" role="alert">{error}</div>
      )}

      <div className="flex items-center justify-end">
        <Button onClick={handleGenerate} disabled={loading}>
          {loadingStage === 'extract' && 'Extracting text…'}
          {loadingStage === 'generate' && 'Generating quiz…'}
          {!loadingStage && 'Generate Quiz'}
        </Button>
      </div>
    </div>
  );
}
