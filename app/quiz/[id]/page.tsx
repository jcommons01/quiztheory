"use client"

import * as React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"

import { db, saveQuizResult } from "@/lib/firestore"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import AppShell from "@/components/layout/app-shell"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

type QuizQuestion = {
  question: string
  options: string[]
  answer: string
  explanation: string
}

type QuizDoc = {
  title?: string
  questions: QuizQuestion[]
  createdAt?: number
  userId?: string
}

export default function QuizTakingPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const searchParams = useSearchParams()
  const assignmentId = searchParams.get("assignment") ?? undefined

  const [checkingAuth, setCheckingAuth] = useState(true)

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [quiz, setQuiz] = React.useState<QuizDoc | null>(null)

  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null)
  const [showAnswer, setShowAnswer] = React.useState(false)
  const [score, setScore] = React.useState(0)
  const [finished, setFinished] = React.useState(false)
  // Ref to the question card for scroll behavior
  const questionCardRef = useRef<HTMLDivElement | null>(null)
  // Track user answers for review
  const [answers, setAnswers] = useState<{ questionIndex: number; selected: string; correct: boolean; }[]>([])
  const [showReview, setShowReview] = useState(false)

  // Auth guard
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) {
        router.push("/")
      } else {
        setCheckingAuth(false)
      }
    })
    return () => unsub()
  }, [router])

  React.useEffect(() => {
    let active = true
    const randomizeQuiz = (src: QuizQuestion[]): QuizQuestion[] => {
      // 1) shuffle questions
      const shuffled = [...src]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      // 2) balanced positions for correct answers
      const n = shuffled.length
      const positions: number[] = []
      for (let i = 0; i < 4; i++) {
        const count = Math.floor(n / 4) + (i < (n % 4) ? 1 : 0)
        for (let j = 0; j < count; j++) positions.push(i)
      }
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[positions[i], positions[j]] = [positions[j], positions[i]]
      }
      // 3) rearrange options per question so answer lands at target index; shuffle distractors
      const randomized = shuffled.map((q, i) => {
        const target = positions[i] ?? 0
        const opts = [...q.options]
        const idx = opts.findIndex(o => o === q.answer)
        if (idx === -1) return q
        const [ans] = opts.splice(idx, 1)
        for (let d = opts.length - 1; d > 0; d--) {
          const k = Math.floor(Math.random() * (d + 1))
          ;[opts[d], opts[k]] = [opts[k], opts[d]]
        }
        opts.splice(Math.min(Math.max(target,0),3), 0, ans)
        return { ...q, options: opts }
      })
      return randomized
    }
    const load = async () => {
      try {
        if (!auth.currentUser) return
        if (!id) return
        const ref = doc(db, "quizzes", String(id))
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          if (!active) return
          setError("Quiz not found.")
          setLoading(false)
          return
        }
        const data = snap.data() as QuizDoc
        if (!data?.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          if (!active) return
          setError("Quiz is missing questions.")
          setLoading(false)
          return
        }
        if (!active) return
        // Normalize to ensure explanation exists
        // Normalize first
        let normalized: QuizDoc = {
          ...data,
          questions: data.questions.map(q => ({
            question: q.question ?? "",
            options: Array.isArray(q.options) ? q.options.slice(0,4).map(o => o ?? "") : ["","","",""],
            answer: q.answer ?? "",
            explanation: (q as any).explanation ?? "",
          }))
        }

        // Per-attempt randomization with even spread of correct positions
        normalized = { ...normalized, questions: randomizeQuiz(normalized.questions) }
        setQuiz(normalized)
        setLoading(false)
      } catch (e) {
        if (!active) return
        setError("Failed to load quiz.")
        setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [id])

  function handleSelectOption(idx: number) {
    if (showAnswer) return
    setSelectedOption(idx)
    setShowAnswer(true)
    const q = quiz!.questions[currentQuestionIndex]
    const isCorrect = q.options[idx] === q.answer
    if (isCorrect) setScore((s) => s + 1)
    // Record the user's selection
    setAnswers(prev => {
      // Avoid duplicates if somehow re-triggered
      if (prev.some(a => a.questionIndex === currentQuestionIndex)) return prev
      return [...prev, { questionIndex: currentQuestionIndex, selected: q.options[idx], correct: isCorrect }]
    })
  }

  function handleNext() {
    if (!quiz) return
    const next = currentQuestionIndex + 1
    if (next >= quiz.questions.length) {
      setFinished(true)
      return
    }
    setCurrentQuestionIndex(next)
    setSelectedOption(null)
    setShowAnswer(false)
    // Smoothly scroll the question card back into view after advancing
    setTimeout(() => {
      questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  function handleRetry() {
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setShowAnswer(false)
    setScore(0)
    setFinished(false)
    setAnswers([])
    setShowReview(false)
    // Re-randomize the quiz for a fresh layout each retry
    setQuiz(prev => {
      if (!prev) return prev
      return { ...prev, questions: (() => {
        const src = prev.questions.map(q => ({ ...q, options: [...q.options] }))
        // Ensure randomization works off current data; correct answer is the string answer.
        // Build a fresh randomized set.
        // Reuse same logic as initial load
        // 1) shuffle questions; 2) balance answer positions; 3) shuffle distractors
        const shuffled = [...src]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        const n = shuffled.length
        const positions: number[] = []
        for (let i = 0; i < 4; i++) {
          const count = Math.floor(n / 4) + (i < (n % 4) ? 1 : 0)
          for (let j = 0; j < count; j++) positions.push(i)
        }
        for (let i = positions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[positions[i], positions[j]] = [positions[j], positions[i]]
        }
        return shuffled.map((q, i) => {
          const target = positions[i] ?? 0
          const opts = [...q.options]
          const idx = opts.findIndex(o => o === q.answer)
          if (idx === -1) return q
          const [ans] = opts.splice(idx, 1)
          for (let d = opts.length - 1; d > 0; d--) {
            const k = Math.floor(Math.random() * (d + 1))
            ;[opts[d], opts[k]] = [opts[k], opts[d]]
          }
          opts.splice(Math.min(Math.max(target,0),3), 0, ans)
          return { ...q, options: opts }
        })
      })() }
    })
    // Scroll back to the top of the question card
    setTimeout(() => questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  // Derived total questions (safe even when quiz is null)
  const total = quiz?.questions?.length ?? 0

  // Persist quiz result once finished (non-blocking, silent failure)
  React.useEffect(() => {
    if (!finished) return
    if (!id) return
    if (!auth.currentUser) return
    if (!total) return
    const run = async () => {
      try {
        await saveQuizResult({
          userId: auth.currentUser!.uid,
          quizId: String(id),
          assignmentId,
          score,
          total,
          quizTitle: quiz?.title || "Untitled quiz",
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to save quiz result", e)
      }
    }
    void run()
  }, [finished, id, assignmentId, score, total, quiz?.title])

  // Keyboard navigation: 1-4 to select options when unanswered, Enter to advance when answer shown
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return
      // Avoid interfering with typing in inputs / textareas
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!showAnswer) {
        if (['1','2','3','4'].includes(e.key)) {
          const idx = Number(e.key) - 1
          if (quiz && quiz.questions[currentQuestionIndex]?.options[idx]) {
            handleSelectOption(idx)
          }
        }
      } else {
        if (e.key === 'Enter') {
          handleNext()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showAnswer, quiz, currentQuestionIndex, finished])

  if (checkingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-sm text-zinc-400">Checking your session...</div>
      </AppShell>
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto p-6">Loading…</div>
      </AppShell>
    )
  }

  if (error || !quiz) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto p-6">
          <Card>
            <CardContent className="py-6">{error ?? "Quiz not found."}</CardContent>
            <CardFooter className="py-4">
              <Button onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
            </CardFooter>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (finished) {
    return (
      <AppShell>
    <div className="mx-auto p-4 space-y-4 w-full max-w-screen-sm">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg">You scored {score} / {total}</div>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowReview(r => !r)}
                  className="text-xs"
                >{showReview ? 'Hide review' : 'Review your answers'}</Button>
                {showReview && (
                  <div className="mt-2 space-y-2">
                    {quiz!.questions.map((question, i) => {
                      const answerEntry = answers.find(a => a.questionIndex === i)
                      const userSelected = answerEntry?.selected
                      const isCorrect = answerEntry?.correct
                      return (
                        <div key={i} className="rounded-md border border-zinc-800 bg-zinc-900/40 p-3 space-y-1">
                          <div className="text-xs font-medium text-zinc-200">Q{i+1}. {question.question}</div>
                          <div className="text-[11px] text-zinc-400">
                            Your answer: {userSelected ? (
                              <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>{userSelected}</span>
                            ) : '—'}
                          </div>
                          <div className="text-[11px] text-zinc-400">Correct answer: <span className="text-emerald-400">{question.answer}</span></div>
                          {question.explanation && (
                            <div className="text-[11px] text-zinc-500">Explanation: {question.explanation}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
              <Button variant="secondary" onClick={handleRetry}>Retry quiz</Button>
            </CardFooter>
          </Card>
        </div>
      </AppShell>
    )
  }

  const q = quiz.questions[currentQuestionIndex]

  return (
    <AppShell>
  {/* ...existing code... */}
  <div className="mx-auto p-4 space-y-4 w-full max-w-screen-sm">
        <div ref={questionCardRef}>
        <Card>
          <CardHeader>
            <CardTitle>
              Question {currentQuestionIndex + 1} of {total}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-base sm:text-lg font-medium text-zinc-100">{q.question}</div>
            <div className="grid gap-2">
              {q.options.map((opt, idx) => {
                const isCorrect = opt === q.answer
                const isSelected = selectedOption === idx
                let classes = ""
                if (showAnswer) {
                  if (isCorrect) {
                    classes = "bg-green-600 text-white hover:bg-green-600/90"
                  } else if (isSelected && !isCorrect) {
                    classes = "bg-red-600 text-white hover:bg-red-600/90"
                  }
                }
                return (
                  <Button
                    key={idx}
                    className={classes}
                    onClick={() => handleSelectOption(idx)}
                    disabled={showAnswer}
                  >
                    {opt}
                  </Button>
                )
              })}
            </div>
            {showAnswer && (
              <div className="mt-4 text-sm text-zinc-300 bg-zinc-900/70 border border-zinc-800 rounded-md p-3">
                <span className="font-medium text-zinc-200">Explanation:</span>{" "}
                {q.explanation || "No explanation provided."}
              </div>
            )}
          </CardContent>
          <CardFooter>
            {showAnswer && (
              <div className="flex w-full justify-end">
                <Button onClick={handleNext}>
                  {currentQuestionIndex + 1 === total ? "Finish Quiz" : "Next"}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
        </div>
      </div>
    </AppShell>
  )
}
