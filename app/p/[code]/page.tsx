"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQuizByPublicId } from "@/lib/firestore";

interface SharedQuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface LoadedQuiz {
  id: string;
  title?: string;
  questions: SharedQuizQuestion[];
}

export default function PublicQuizPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string | undefined;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quiz, setQuiz] = useState<LoadedQuiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<
    Record<number, { chosen: string; correct: boolean }>
  >({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!code) return;
      try {
        const data = await getQuizByPublicId(code);
        if (
          !data ||
          !Array.isArray(data.questions) ||
          data.questions.length === 0
        ) {
          setNotFound(true);
          return;
        }

        const normalizedQuestions: SharedQuizQuestion[] = data.questions.map(
          (q: any) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          })
        );

        setQuiz({
          id: data.id,
          title: data.title,
          questions: normalizedQuestions,
        });
      } catch (e) {
        console.error("Public quiz load error", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [code]);

  function handleSelect(option: string) {
    if (!quiz) return;
    if (selectedOption) return; // already answered this question

    const q = quiz.questions[currentIndex];
    const correct = option === q.answer;

    setSelectedOption(option);
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { chosen: option, correct },
    }));
    setShowExplanation(true);
  }

  function handleNext() {
    if (!quiz) return;

    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((i) => i + 1);
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

  const total = quiz?.questions.length || 0;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;

  const headingTitle =
    quiz?.title || (notFound ? "Quiz not found" : "Shared Quiz");
  const headingSubtitle = notFound
    ? "This quiz link is invalid or no longer available."
    : "This is a shared quiz from QuizTheory.";

  return (
    <AppShell>
      <PageContainer>
        {/* Hero header (consistent with other pages) */}
        <section className="pt-2 lg:pt-0">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
              {headingTitle}
            </h1>
            <p className="mt-4 text-sm text-slate-400 md:text-base">
              {headingSubtitle}
            </p>
          </div>
        </section>

        {/* Main content card */}
        <div className="mx-auto max-w-xl pt-10">
          <Card className="w-full rounded-2xl border border-white/5 bg-card/70 shadow-lg">
            <CardHeader className="pb-4">
              {!notFound && quiz && (
                <>
                  <CardTitle className="text-base sm:text-lg">
                    Public quiz preview
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-400">
                    Answer the questions below. Explanations appear after each
                    answer.
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="py-4 px-4 sm:px-6 space-y-4">
              {loading && (
                <div className="text-sm text-zinc-400">Loading quiz…</div>
              )}

              {!loading && notFound && (
                <div className="space-y-4">
                  <div className="text-sm text-zinc-400">
                    We couldn&apos;t find a quiz for this link.
                  </div>
                  <Button onClick={() => router.push("/")}>Go home</Button>
                </div>
              )}

              {!loading && quiz && !finished && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Question {currentIndex + 1} of {quiz.questions.length}
                    </div>
                    {total > 0 && (
                      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${((currentIndex + 1) / total) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="text-base font-medium leading-relaxed text-zinc-100">
                      {quiz.questions[currentIndex].question}
                    </div>

                    <div className="grid gap-2">
                      {quiz.questions[currentIndex].options.map((opt) => {
                        const answered = !!selectedOption;
                        const isChosen = selectedOption === opt;
                        const q = quiz.questions[currentIndex];
                        const isCorrectAnswer = answered && opt === q.answer;
                        const isIncorrectChosen =
                          answered && isChosen && opt !== q.answer;

                        return (
                          <Button
                            key={opt}
                            variant="secondary"
                            disabled={answered}
                            onClick={() => handleSelect(opt)}
                            className={[
                              "justify-start text-left whitespace-normal h-auto py-3 px-4",
                              isCorrectAnswer
                                ? "border-green-600 bg-green-600/20"
                                : "",
                              isIncorrectChosen
                                ? "border-red-600 bg-red-600/20"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {opt}
                          </Button>
                        );
                      })}
                    </div>

                    {showExplanation && (
                      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm">
                        <div className="mb-1 font-medium text-zinc-100">
                          Explanation
                        </div>
                        <div className="whitespace-pre-line text-zinc-300">
                          {quiz.questions[currentIndex].explanation ||
                            "No explanation provided."}
                        </div>
                      </div>
                    )}

                    {selectedOption && (
                      <div className="flex gap-3">
                        <Button onClick={handleNext}>
                          {currentIndex + 1 === quiz.questions.length
                            ? "Finish"
                            : "Next"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!loading && quiz && finished && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-xl font-semibold text-zinc-100">
                      Results
                    </div>
                    <div className="text-sm text-zinc-400">
                      You scored {correctCount} / {total} ({percent}%).
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleRetry}>Retry</Button>
                    <Button
                      variant="secondary"
                      onClick={() => router.push("/")}
                    >
                      Create your own quizzes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
