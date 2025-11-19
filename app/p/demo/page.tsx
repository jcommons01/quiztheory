"use client";

import * as React from "react";
import Link from "next/link";

import AppShell, { PageContainer } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DemoQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

// These are product-style questions that describe how QuizRevise works.
// You can tweak wording to exactly match your marketing copy.
const BASE_QUESTIONS: DemoQuestion[] = [
  {
    question: "What is the main benefit of using QuizRevise for revision?",
    options: [
      "It prints worksheets automatically",
      "It turns your own notes into auto-marked quizzes in seconds",
      "It replaces teachers completely",
      "It only stores flashcards for later",
    ],
    answer: "It turns your own notes into auto-marked quizzes in seconds",
    explanation:
      "QuizRevise takes your notes, PDFs or images and generates structured, self-marking quizzes from them.",
  },
  {
    question:
      "Which types of content can you turn into quizzes with QuizRevise?",
    options: [
      "Only plain text typed by hand",
      "Notes, PDFs, and textbook or worksheet photos",
      "Only videos and audio files",
      "Only multiple-choice questions you write manually",
    ],
    answer: "Notes, PDFs, and textbook or worksheet photos",
    explanation:
      "You can paste notes, upload PDFs, or use clear photos of pages to generate questions.",
  },
  {
    question:
      "What can you do on the QuizRevise quiz editor screen after generation?",
    options: [
      "Only delete the quiz",
      "Edit questions, change options, and update explanations",
      "Download the raw AI prompt",
      "Change colours but not the questions",
    ],
    answer: "Edit questions, change options, and update explanations",
    explanation:
      "In the editor you can tweak wording, adjust answers, and add short explanations before saving.",
  },
  {
    question:
      "How does sharing a quiz with a class or friend usually work in QuizRevise?",
    options: [
      "You must export a PDF and email it",
      "You send them a public quiz link they can open instantly",
      "They must sign up and search for the quiz ID manually",
      "You need to invite them by phone number",
    ],
    answer: "You send them a public quiz link they can open instantly",
    explanation:
      "Public quiz links let people take a quiz straight away in the browser, no extra setup needed.",
  },
  {
    question:
      "What happens on the results side when students or team members finish a quiz?",
    options: [
      "Nothing is saved anywhere",
      "Scores and attempts can be tracked on the results / dashboard pages",
      "Only the first attempt is stored forever",
      "Results are emailed but not visible in the app",
    ],
    answer:
      "Scores and attempts can be tracked on the results / dashboard pages",
    explanation:
      "QuizRevise records attempts so you can review performance later from the My Results / dashboard views.",
  },
];

// Simple answer-shuffler that keeps the correct answer string intact.
function randomizeQuestions(src: DemoQuestion[]): DemoQuestion[] {
  return src.map((q) => {
    const opts = [...q.options];
    // Fisher–Yates shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { ...q, options: opts };
  });
}


export default function DemoQuizPage() {
  // Fix hydration: shuffle only on client after mount
  const [questions, setQuestions] = React.useState<DemoQuestion[]>(BASE_QUESTIONS);
  React.useEffect(() => {
    setQuestions(randomizeQuestions(BASE_QUESTIONS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  );
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  const [answers, setAnswers] = React.useState<
    Record<number, { chosen: string; correct: boolean }>
  >({});

  const total = questions.length;
  const q = questions[currentIndex];

  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;
  const progressPercent =
    total && !finished ? ((currentIndex + 1) / total) * 100 : 100;

  function handleSelect(option: string) {
    if (showAnswer) return;
    const correct = option === q.answer;
    setSelectedOption(option);
    setShowAnswer(true);
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { chosen: option, correct },
    }));
  }

  function handleNext() {
    if (currentIndex + 1 < total) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      setFinished(true);
    }
  }

  function handleRetry() {
    setFinished(false);
    setSelectedOption(null);
    setShowAnswer(false);
    setAnswers({});
    setCurrentIndex(0);
  }

  return (
    <AppShell>
      <PageContainer>
        {/* Hero header – matches main quiz header style */}
        <section className="pt-2 lg:pt-0">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
              QuizRevise Demo Quiz
            </h1>
            <p className="mt-4 text-sm text-slate-400 md:text-base">
              Try this interactive demo — no sign-up required.
            </p>
          </div>
        </section>

        {/* Main content card – styled like the real quiz-taking page */}
        <div className="mx-auto max-w-xl pt-10">
          <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            {!finished ? (
              <>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg text-zinc-100">
                    Live demo experience
                  </CardTitle>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Question {currentIndex + 1} of {total}
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 py-6 px-4 sm:px-8">
                  <div className="text-base sm:text-lg font-medium text-zinc-100">
                    {q.question}
                  </div>
                  <div className="grid gap-2">
                    {(() => {
                      const baseButtonClasses =
                        "w-full whitespace-normal break-words text-center leading-normal text-sm sm:text-base";
                      return q.options.map((opt) => {
                        const isCorrect = opt === q.answer;
                        const isSelected = selectedOption === opt;
                        let classes = "";
                        if (showAnswer) {
                          if (isCorrect) {
                            classes =
                              "bg-green-600 text-white hover:bg-green-600/90";
                          } else if (isSelected && !isCorrect) {
                            classes = "bg-red-600 text-white hover:bg-red-600/90";
                          }
                        }
                        return (
                          <Button
                            key={opt}
                            className={cn(baseButtonClasses, classes)}
                            onClick={() => handleSelect(opt)}
                            disabled={showAnswer}
                          >
                            {opt}
                          </Button>
                        );
                      });
                    })()}
                  </div>
                  {showAnswer && (
                    <div className="mt-4 text-sm text-zinc-300 bg-zinc-900/70 border border-zinc-800 rounded-md p-3">
                      <span className="font-medium text-zinc-200">
                        Explanation:
                      </span>{" "}
                      {q.explanation || "No explanation provided."}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex w-full justify-end">
                  {showAnswer && (
                    <Button onClick={handleNext}>
                      {currentIndex + 1 === total ? "Finish demo" : "Next"}
                    </Button>
                  )}
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-zinc-100">
                    Demo complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-6 px-4 sm:px-8">
                  <div className="text-sm text-zinc-300">
                    You scored {correctCount} / {total} ({percent}%).
                  </div>
                  <div className="text-sm text-zinc-400">
                    In the full app, these attempts are saved to your{" "}
                    <span className="font-medium text-zinc-200">
                      My results
                    </span>{" "}
                    page and can be linked to classes.
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3">
                  <Button onClick={handleRetry}>Try again</Button>
                  <Button asChild variant="secondary">
                    <Link href="/auth">Create your own quiz</Link>
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>

          <div className="mt-6 text-center text-xs text-zinc-500">
            This demo is static and does not save results.
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
