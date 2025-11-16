"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { saveQuiz } from "@/lib/firestore"
import { auth } from "@/lib/firebase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface PreviewQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
}

interface QuizPayload {
  questions: PreviewQuestion[]
}

interface GenerationSettings {
  content: string
  numQuestions: number
  difficulty: string
}

export default function CreateQuizPage() {
  const router = useRouter()
  const [quiz, setQuiz] = React.useState<QuizPayload | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRegenerating, setIsRegenerating] = React.useState(false)
  const [regenError, setRegenError] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState("Untitled quiz")
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("new-quiz")
      if (raw) {
        setQuiz(JSON.parse(raw) as QuizPayload)
      }
    } catch {}
  }, [])

  async function handleRegenerate() {
    setRegenError(null)
    if (isRegenerating) return
    try {
      const metaRaw = sessionStorage.getItem('last-quiz-gen')
      if (!metaRaw) {
        setRegenError('Original generation settings not found (TODO: store them earlier).')
        return
      }
      const meta = JSON.parse(metaRaw) as Partial<GenerationSettings>
      if (!meta.content || !meta.numQuestions || !meta.difficulty) {
        setRegenError('Generation settings incomplete.')
        return
      }
      setIsRegenerating(true)
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: meta.content,
          numQuestions: meta.numQuestions,
          difficulty: meta.difficulty,
        })
      })
      if (!res.ok) throw new Error('Regenerate request failed')
      const data = await res.json() as { questions: PreviewQuestion[] }
      setQuiz({ questions: data.questions })
      sessionStorage.setItem('new-quiz', JSON.stringify(data))
    } catch (e: any) {
      console.error('Regenerate quiz failed', e)
      setRegenError(e?.message || 'Failed to regenerate quiz')
    } finally {
      setIsRegenerating(false)
    }
  }

  // --- Editing helpers -------------------------------------------------
  function updateQuestionText(index: number, value: string) {
    setQuiz((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      next.questions = [...next.questions]
      next.questions[index] = { ...next.questions[index], question: value }
      return next
    })
  }

  function updateOption(index: number, optionIdx: number, value: string) {
    setQuiz((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      const q = { ...next.questions[index] }
      const opts = [...q.options]
      const oldVal = opts[optionIdx]
      opts[optionIdx] = value
      q.options = opts
      if (q.answer === oldVal) {
        q.answer = value
      }
      next.questions = [...next.questions]
      next.questions[index] = q
      return next
    })
  }

  function markCorrect(index: number, optionIdx: number) {
    setQuiz((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      const q = { ...next.questions[index] }
      q.answer = q.options[optionIdx] ?? ""
      next.questions = [...next.questions]
      next.questions[index] = q
      return next
    })
  }

  function updateExplanation(index: number, value: string) {
    setQuiz((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      next.questions = [...next.questions]
      next.questions[index] = { ...next.questions[index], explanation: value }
      return next
    })
  }

  function addQuestion() {
    setQuiz((prev) => {
      const base: QuizPayload = prev ?? { questions: [] }
      return {
        questions: [
          ...base.questions,
          { question: "", options: ["", "", "", ""], answer: "", explanation: "" },
        ],
      }
    })
  }

  function deleteQuestion(index: number) {
    setQuiz((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      next.questions = next.questions.filter((_, i) => i !== index)
      return next
    })
  }

  function validate(questions: PreviewQuestion[]): string | null {
    if (!questions.length) return "There are no questions to save."
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question?.trim()) return `Question ${i + 1} is empty.`
      if (!Array.isArray(q.options) || q.options.length < 4) return `Question ${i + 1} must have 4 options.`
      const hasEmpty = q.options.some(o => !o?.trim())
      if (hasEmpty) return `All options for question ${i + 1} must be filled.`
      if (!q.answer?.trim()) return `Select the correct answer for question ${i + 1}.`
      if (!q.options.includes(q.answer)) return `The correct answer for question ${i + 1} must match one of the options.`
    }
    return null
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 px-4 w-full max-w-screen-sm mx-auto">
      {/* Hero header to match homepage/auth */}
      <section className="relative flex flex-col justify-center items-center gap-4 text-center px-4 pt-20 pb-8 w-full">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-168 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
        </div>
        <h1 className="relative z-10 font-bold tracking-tight text-3xl md:text-5xl leading-[1.1] bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
          Quiz Preview
        </h1>
        <p className="relative z-10 max-w-2xl text-zinc-300 leading-relaxed text-sm md:text-base">
          Review the generated questions, tweak the title, then save or regenerate.
        </p>
      </section>

  <div className="mx-auto pb-10 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Preview</CardTitle>
            <CardDescription>Review and edit the questions, then save or regenerate.</CardDescription>
          </CardHeader>
          {!quiz ? (
            <CardContent>
              <div className="text-zinc-400">
                No quiz data found. Go back to the dashboard and generate a quiz.
              </div>
            </CardContent>
          ) : (
            <>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="quiz-title">Quiz title</Label>
                  <Input
                    id="quiz-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled quiz"
                  />
                </div>
                <div className="space-y-5">
                  {quiz.questions.map((q, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle className="text-base">Question {i + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor={`q-${i}`}>Question text</Label>
                          <Textarea
                            id={`q-${i}`}
                            value={q.question}
                            onChange={(e) => updateQuestionText(i, e.target.value)}
                            placeholder="Enter question…"
                          />
                        </div>

                        <div className="grid gap-3">
                          <div className="text-sm text-zinc-400">Options (mark the correct one)</div>
                          {[0,1,2,3].map((optIdx) => (
                            <div key={optIdx} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`answer-${i}`}
                                className="size-4 accent-green-600"
                                checked={q.options[optIdx] === q.answer}
                                onChange={() => markCorrect(i, optIdx)}
                                aria-label={`Mark option ${optIdx + 1} correct`}
                              />
                              <Input
                                value={q.options[optIdx] ?? ""}
                                onChange={(e) => updateOption(i, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`exp-${i}`}>Explanation</Label>
                          <Textarea
                            id={`exp-${i}`}
                            value={q.explanation}
                            onChange={(e) => updateExplanation(i, e.target.value)}
                            placeholder="Brief explanation (1–3 sentences)…"
                            className="text-sm"
                          />
                          <p className="text-xs text-zinc-400">Shown to users after answering.</p>
                        </div>
                      </CardContent>
                      <CardFooter className="flex items-center">
                        <Button variant="secondary" onClick={() => deleteQuestion(i)} className="ms-auto">Delete question</Button>
                      </CardFooter>
                    </Card>
                  ))}

                  <div>
                    <Button variant="secondary" onClick={addQuestion}>+ Add question</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={async () => {
                    if (!quiz?.questions?.length) {
                      setSaveError("Could not save this quiz. Please try again.")
                      setSaveMessage(null)
                      return
                    }
                    const user = auth.currentUser
                    if (!user) {
                      setSaveError("Could not save this quiz. Please try again.")
                      setSaveMessage(null)
                      return
                    }
                    const vErr = validate(quiz.questions)
                    if (vErr) {
                      setValidationError(vErr)
                      setSaveMessage(null)
                      return
                    }
                    setSaveMessage(null)
                    setSaveError(null)
                    setValidationError(null)
                    try {
                      setIsSaving(true)
                      await saveQuiz(user.uid, {
                        title: title?.trim() || "Untitled quiz",
                        questions: quiz.questions,
                        createdAt: Date.now(),
                      })
                      setSaveError(null)
                      setSaveMessage("Quiz saved! You can find it on your dashboard.")
                      router.push("/dashboard")
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error("Save quiz failed", err)
                      setSaveMessage(null)
                      setSaveError("Could not save this quiz. Please try again.")
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                  disabled={isSaving}
                  aria-busy={isSaving}
                >
                  {isSaving ? "Saving…" : "Save quiz"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  aria-busy={isRegenerating}
                >
                  {isRegenerating ? 'Regenerating…' : 'Regenerate'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                >
                  Generate another
                </Button>
                {saveMessage && <p className="mt-3 text-xs text-emerald-400">{saveMessage}</p>}
                {saveError && <p className="mt-3 text-xs text-red-400">{saveError}</p>}
                {validationError && <p className="mt-3 text-xs text-red-400">{validationError}</p>}
              </CardFooter>
              {regenError && (
                <div className="px-6 pb-6 -mt-2 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md">
                  {regenError}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
