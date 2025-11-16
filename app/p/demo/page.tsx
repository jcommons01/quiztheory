"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DemoQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    question: "What is the primary benefit of using QuizTheory?",
    options: [
      "Manual question writing",
      "AI-powered instant quiz generation",
      "Only flashcard review",
      "Printed worksheet creation"
    ],
    answer: "AI-powered instant quiz generation",
    explanation: "QuizTheory converts source material like notes or PDFs directly into structured quizzes in seconds."
  },
  {
    question: "Which types of content can you upload?",
    options: ["Only plain text", "Notes, PDFs, and images", "Only video files", "Only audio recordings"],
    answer: "Notes, PDFs, and images",
    explanation: "Users can bring diverse study resources—typed notes, PDF documents, or textbook photos—to generate quizzes."
  },
  {
    question: "Who commonly uses QuizTheory?",
    options: ["Gamers", "Students and educators", "Musicians", "Gardeners"],
    answer: "Students and educators",
    explanation: "Primary users include students self‑studying and educators preparing assessments or practice sets."
  },
  {
    question: "What happens when you share a quiz link?",
    options: [
      "The recipient must create an account first",
      "The recipient can take the quiz immediately",
      "It downloads a ZIP archive",
      "It emails support"
    ],
    answer: "The recipient can take the quiz immediately",
    explanation: "Public quiz links allow frictionless access—no sign‑up required for taking the quiz."
  },
  {
    question: "What can you do after finishing a demo quiz?",
    options: ["Export to CSV only", "Retry or create your own quiz", "Automatically grade peers", "Print certificates"],
    answer: "Retry or create your own quiz",
    explanation: "The demo flow encourages retaking for practice and onboarding via creating your own AI‑generated quiz." 
  }
];

export default function DemoQuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, { chosen: string; correct: boolean }>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);

  function handleSelect(option: string) {
    if (selectedOption) return; // already answered this question
    const q = DEMO_QUESTIONS[currentIndex];
    const correct = option === q.answer;
    setSelectedOption(option);
    setAnswers(prev => ({ ...prev, [currentIndex]: { chosen: option, correct } }));
    setShowExplanation(true);
  }

  function handleNext() {
    if (currentIndex + 1 < DEMO_QUESTIONS.length) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  }

  function handleRetry() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers({});
    setShowExplanation(false);
    setFinished(false);
  }

  const total = DEMO_QUESTIONS.length;
  const correctCount = Object.values(answers).filter(a => a.correct).length;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>QuizTheory Demo Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            {!finished && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">Question {currentIndex + 1} of {DEMO_QUESTIONS.length}</div>
                  <div className="text-sm text-zinc-300">Try this interactive demo—no sign up required.</div>
                </div>
                <div className="space-y-4">
                  <div className="text-base font-medium leading-relaxed">{DEMO_QUESTIONS[currentIndex].question}</div>
                  <div className="grid gap-2">
                    {DEMO_QUESTIONS[currentIndex].options.map(opt => {
                      const answered = !!selectedOption;
                      const isChosen = selectedOption === opt;
                      const q = DEMO_QUESTIONS[currentIndex];
                      const isCorrectAnswer = answered && opt === q.answer;
                      const isIncorrectChosen = answered && isChosen && opt !== q.answer;
                      return (
                        <Button
                          key={opt}
                          variant="secondary"
                          disabled={answered}
                          onClick={() => handleSelect(opt)}
                          className={[
                            "justify-start text-left whitespace-normal h-auto py-3 px-4",
                            isCorrectAnswer ? "border-green-600 bg-green-600/20" : "",
                            isIncorrectChosen ? "border-red-600 bg-red-600/20" : ""
                          ].filter(Boolean).join(" ")}
                        >{opt}</Button>
                      );
                    })}
                  </div>
                  {showExplanation && (
                    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm">
                      <div className="font-medium mb-1">Explanation</div>
                      <div className="text-zinc-300 whitespace-pre-line">{DEMO_QUESTIONS[currentIndex].explanation || "No explanation provided."}</div>
                    </div>
                  )}
                  {selectedOption && (
                    <div className="flex gap-3">
                      <Button onClick={handleNext}>{currentIndex + 1 === DEMO_QUESTIONS.length ? "Finish" : "Next"}</Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {finished && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-xl font-semibold">Demo Results</div>
                  <div className="text-sm text-zinc-400">You scored {correctCount} / {total} ({percent}%).</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleRetry}>Try again</Button>
                  <Button asChild variant="secondary">
                    <Link href="/auth">Create your own quiz</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="text-center text-xs text-zinc-500">
          This demo is static and does not save results.
        </div>
      </div>
    </div>
  );
}
