"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getQuizByPublicId } from "@/lib/firestore"

interface SharedQuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

interface LoadedQuiz {
  id: string
  title?: string
  questions: SharedQuizQuestion[]
}

export default function PublicQuizPage() {
  const params = useParams()
  const router = useRouter()
  const code = params?.code as string | undefined

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quiz, setQuiz] = useState<LoadedQuiz | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, { chosen: string; correct: boolean }>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!code) return
      try {
        const data = await getQuizByPublicId(code)
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
          setNotFound(true)
          return
        }
        const normalizedQuestions: SharedQuizQuestion[] = data.questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation
        }))
        setQuiz({ id: data.id, title: data.title, questions: normalizedQuestions })
      } catch (e) {
        console.error("Public quiz load error", e)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [code])

  function handleSelect(option: string) {
    if (!quiz) return
    if (selectedOption) return // already answered this question
    const q = quiz.questions[currentIndex]
    const correct = option === q.answer
    setSelectedOption(option)
    setAnswers(prev => ({ ...prev, [currentIndex]: { chosen: option, correct } }))
    setShowExplanation(true)
  }

  function handleNext() {
    if (!quiz) return
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex(i => i + 1)
      setSelectedOption(null)
      setShowExplanation(false)
    } else {
      setFinished(true)
    }
  }

  function handleRetry() {
    setCurrentIndex(0)
    setSelectedOption(null)
    setAnswers({})
    setShowExplanation(false)
    setFinished(false)
  }

  const total = quiz?.questions.length || 0
  const correctCount = Object.values(answers).filter(a => a.correct).length
  const percent = total ? Math.round((correctCount / total) * 100) : 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{quiz?.title || (notFound ? "Quiz not found" : "Shared Quiz")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-sm text-zinc-400">Loading quiz…</div>
            )}
            {!loading && notFound && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-300">This quiz link is invalid or no longer available.</p>
                <Button onClick={() => router.push("/")}>Go home</Button>
              </div>
            )}
            {!loading && quiz && !finished && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">Question {currentIndex + 1} of {quiz.questions.length}</div>
                  <div className="text-sm text-zinc-300">This is a shared quiz from QuizTheory.</div>
                </div>
                <div className="space-y-4">
                  <div className="text-base font-medium leading-relaxed">{quiz.questions[currentIndex].question}</div>
                  <div className="grid gap-2">
                    {quiz.questions[currentIndex].options.map(opt => {
                      const answered = !!selectedOption
                      const isChosen = selectedOption === opt
                      const q = quiz.questions[currentIndex]
                      const isCorrectAnswer = answered && opt === q.answer
                      const isIncorrectChosen = answered && isChosen && opt !== q.answer
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
                      )
                    })}
                  </div>
                  {showExplanation && (
                    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm">
                      <div className="font-medium mb-1">Explanation</div>
                      <div className="text-zinc-300 whitespace-pre-line">{quiz.questions[currentIndex].explanation || "No explanation provided."}</div>
                    </div>
                  )}
                  {selectedOption && (
                    <div className="flex gap-3">
                      <Button onClick={handleNext}>{currentIndex + 1 === quiz.questions.length ? "Finish" : "Next"}</Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!loading && quiz && finished && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-xl font-semibold">Results</div>
                  <div className="text-sm text-zinc-400">You scored {correctCount} / {total} ({percent}%).</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleRetry}>Retry</Button>
                  <Button variant="secondary" onClick={() => router.push("/")}>Create your own quizzes</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
