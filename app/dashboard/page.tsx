// Upgrade to Pro button for Stripe checkout
"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

function UpgradeToProButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      // maybe redirect to /auth
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
      className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 mt-2"
    >
      {loading ? "Redirecting…" : "Upgrade to Pro"}
    </Button>
  );
}


import * as React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  getUserQuizzes,
  getUserProfile,
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
  generatePublicId
} from "@/lib/firestore"
import AppShell from "@/components/layout/app-shell"

export default function DashboardPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  // Quiz generation state
  const [mode, setMode] = React.useState<'text'|'file'|'image'>('text')
  const [text, setText] = React.useState('')
  const [fileInput, setFileInput] = React.useState<File | null>(null)
  const [imageInput, setImageInput] = React.useState<File | null>(null)
  const [numQuestions, setNumQuestions] = React.useState(10)
  const [difficulty, setDifficulty] = React.useState('Auto')
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingPhase, setLoadingPhase] = React.useState<null|'extract'|'generate'>(null)
  // Quiz generation error state
  const [generationError, setGenerationError] = useState<string | null>(null)
  // Data
  const [quizzes, setQuizzes] = React.useState<Array<{ id: string; title?: string; createdAt?: number; questions?: unknown[]; publicId?: string }>>([])
  // Demo quizzes (read-only previews when a new user has none yet)
  const [demoQuizzes, setDemoQuizzes] = React.useState<Array<{ id: string; title: string; demo: true; questionsCount: number }>>([])
  const [shareLinks, setShareLinks] = React.useState<Record<string, string>>({})
  const [sharingQuizId, setSharingQuizId] = React.useState<string | null>(null)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = React.useState(true)
  // Classes (teacher/institution)
  const [classes, setClasses] = React.useState<ClassGroup[]>([])
  const [loadingClasses, setLoadingClasses] = React.useState(false)
  const [assignmentCounts, setAssignmentCounts] = React.useState<Record<string, number>>({})
  // Student join (individual)
  const [joinCode, setJoinCode] = React.useState('')
  const [studentClasses, setStudentClasses] = React.useState<ClassGroup[]>([])
  const [joiningClass, setJoiningClass] = React.useState(false)
  const [joinError, setJoinError] = React.useState<string | null>(null)
  // Assignment dialog
  const [showAssignDialog, setShowAssignDialog] = React.useState(false)
  const [activeAssignClass, setActiveAssignClass] = React.useState<ClassGroup | null>(null)
  const [selectedQuizId, setSelectedQuizId] = React.useState('')
  const [assignmentTitle, setAssignmentTitle] = React.useState('')
  const [creatingAssignment, setCreatingAssignment] = React.useState(false)
  const [assignmentError, setAssignmentError] = React.useState<string | null>(null)
  const [studentAssignments, setStudentAssignments] = React.useState<Record<string, QuizAssignment[]>>({})
  // User results (individual stats)
  const [userResults, setUserResults] = React.useState<QuizResult[]>([])
  const [loadingUserResults, setLoadingUserResults] = React.useState(false)
  // Demo quiz modal state
  const [showDemoDialog, setShowDemoDialog] = React.useState(false)
  const [activeDemoQuiz, setActiveDemoQuiz] = React.useState<{ id: string; title: string; demo: true; questionsCount: number } | null>(null)

  // Subscription plan derived value
  const currentTier = userProfile?.subscriptionTier ?? "free"
  const isProOrAbove = currentTier === 'pro' || currentTier === 'teacher' || currentTier === 'institution'
  const FREE_QUIZ_LIMIT = 3
  const limitReached = !isProOrAbove && quizzes.length >= FREE_QUIZ_LIMIT

  // Initial load
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
    const init = async () => {
      if (!auth.currentUser) return
      try {
        const uid = auth.currentUser.uid
        const profile = await getUserProfile(uid)
        setUserProfile(profile)
        const quizData = await getUserQuizzes(uid)
        setQuizzes(quizData as Array<{ id: string; title?: string; createdAt?: number; questions?: unknown[]; publicId?: string }>)
        // Seed demo quizzes if user has none (first-time experience)
        if (!quizData.length) {
          setDemoQuizzes([
            {
              id: 'demo-gcse-bio',
              title: 'Demo: GCSE Biology - Cells',
              demo: true,
              questionsCount: 5
            },
            {
              id: 'demo-history-ww2',
              title: 'Demo: Modern History - WWII Overview',
              demo: true,
              questionsCount: 6
            }
          ])
        }
        if (profile && (profile.role === 'teacher' || profile.role === 'institution')) {
          setLoadingClasses(true)
          try {
            const classData = await getTeacherClasses(uid)
            setClasses(classData)
          } finally {
            setLoadingClasses(false)
          }
        }
      } catch (e) {
        console.error('Dashboard init failed', e)
      } finally {
        setLoadingProfile(false)
      }
    }
    void init()
  }, [router])

  // Assignment counts
  React.useEffect(() => {
    const loadCounts = async () => {
      if (!auth.currentUser) return
      if (!userProfile || (userProfile.role !== 'teacher' && userProfile.role !== 'institution')) return
      try {
        const map: Record<string, number> = {}
        for (const c of classes) {
          if (!c.id) continue
          try {
            const list = await getClassAssignments(c.id)
            map[c.id] = list.length
          } catch { map[c.id] = 0 }
        }
        setAssignmentCounts(map)
      } catch (e) {
        console.error('Load assignment counts failed', e)
      }
    }
    void loadCounts()
  }, [classes, userProfile])

  // Student classes
  React.useEffect(() => {
    const loadStudent = async () => {
  if (!auth.currentUser || userProfile?.role !== 'user') return
      try {
        const list = await getStudentClasses(auth.currentUser.uid)
        setStudentClasses(list)
      } catch (e) { console.error('Load student classes failed', e) }
    }
    void loadStudent()
  }, [userProfile])

  // Load assignments for joined classes (individual users)
  React.useEffect(() => {
    const loadAssignments = async () => {
      if (!studentClasses.length) return
      try {
        const result: Record<string, QuizAssignment[]> = {}
        for (const cls of studentClasses) {
          if (!cls.id) continue
          try {
            const list = await getClassAssignments(cls.id)
            result[cls.id] = list
          } catch {
            result[cls.id] = []
          }
        }
        setStudentAssignments(result)
      } catch (e) {
        console.error('Load student assignments failed', e)
      }
    }
    void loadAssignments()
  }, [studentClasses])

  // Load individual user results for stats card
  React.useEffect(() => {
    const loadUserResults = async () => {
  if (!auth.currentUser || userProfile?.role !== 'user') return
      setLoadingUserResults(true)
      try {
        const list = await getResultsForUser(auth.currentUser.uid)
        setUserResults(list)
      } catch (e) {
        console.error('Load user results failed', e)
      } finally {
        setLoadingUserResults(false)
      }
    }
    loadUserResults()
  }, [userProfile])

  // Derived stats
  const totalQuizzesTaken = userResults.length
  const averageScorePercent = totalQuizzesTaken
    ? Math.round(userResults.reduce((acc, r) => acc + (r.total ? (r.score / r.total) * 100 : 0), 0) / totalQuizzesTaken)
    : 0

  async function handleCreateClass() {
    if (!auth.currentUser) return
    const name = prompt('Enter class name')
    if (!name?.trim()) return
    try {
      setLoadingClasses(true)
      await createClassGroup(auth.currentUser.uid, name.trim())
      const updated = await getTeacherClasses(auth.currentUser.uid)
      setClasses(updated)
    } catch (e) { console.error('Create class failed', e) } finally { setLoadingClasses(false) }
  }

  async function handleShare(q: { id: string; publicId?: string }) {
    if (!q?.id) return
    setSharingQuizId(q.id)
    try {
      let publicId = q.publicId
      if (!publicId) {
        publicId = generatePublicId()
        await setQuizPublicId(q.id, publicId)
        // update local quiz state
        setQuizzes(prev => prev.map(item => item.id === q.id ? { ...item, publicId } : item))
      }
      const url = `${appUrl}/p/${publicId}`
      setShareLinks(prev => ({ ...prev, [q.id]: url }))
    } catch (e) {
      console.error('Share link generation failed', e)
    } finally {
      setSharingQuizId(null)
    }
  }

  async function handleJoinClass() {
    if (!auth.currentUser) return
    const code = joinCode.trim().toUpperCase()
    if (!code || code.length < 4) return
    setJoiningClass(true)
    setJoinError(null)
    try {
      await joinClassByCode(auth.currentUser.uid, code)
      setJoinCode('')
      const updated = await getStudentClasses(auth.currentUser.uid)
      setStudentClasses(updated)
    } catch (e: any) {
      console.error('Join class failed', e)
      setJoinError(e?.message || 'Failed to join class')
    } finally { setJoiningClass(false) }
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!auth.currentUser || !activeAssignClass?.id) return
    if (!selectedQuizId || !assignmentTitle.trim()) { setAssignmentError('Select a quiz and enter a title.'); return }
    setCreatingAssignment(true)
    setAssignmentError(null)
    try {
      await createQuizAssignment({
        classId: activeAssignClass.id,
        quizId: selectedQuizId,
        title: assignmentTitle.trim(),
        createdBy: auth.currentUser.uid
      })
      const list = await getClassAssignments(activeAssignClass.id)
      setAssignmentCounts(prev => ({ ...prev, [activeAssignClass.id!]: list.length }))
      setSelectedQuizId('')
      setAssignmentTitle('')
      setShowAssignDialog(false)
    } catch (e: any) {
      console.error('Create assignment failed', e)
      setAssignmentError(e?.message || 'Failed to create assignment')
    } finally { setCreatingAssignment(false) }
  }

  async function handleGenerate() {
    if (mode === 'text' && !text.trim()) return
    if (mode === 'file' && !fileInput) return
    if (mode === 'image' && !imageInput) return
    setIsLoading(true); setLoadingPhase(null)
    // Clear any previous generation error before starting
    setGenerationError(null)
    try {
      let sourceText = ''
      if (mode === 'text') {
        sourceText = text.trim()
      } else {
        setLoadingPhase('extract')
        const fd = new FormData()
        fd.append('file', (mode === 'file' ? fileInput : imageInput)!)
        const extractRes = await fetch('/api/extract', { method: 'POST', body: fd })
        if (!extractRes.ok) {
          try {
            const errJson = await extractRes.json()
            setGenerationError(errJson.error ?? 'Something went wrong generating your quiz.')
          } catch {
            setGenerationError('Something went wrong generating your quiz.')
          }
          return
        }
        const data = await extractRes.json() as { text?: string; error?: string }
        if (!data.text) return
        sourceText = data.text.trim()
      }
      if (!sourceText) return
      setLoadingPhase('generate')
  const generationPayload = { content: sourceText, numQuestions, difficulty }
      const genRes = await fetch('/api/generate-quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(generationPayload) })
      if (!genRes.ok) {
        try {
          const errJson = await genRes.json()
          setGenerationError(errJson.error ?? 'Something went wrong generating your quiz.')
        } catch {
          setGenerationError('Something went wrong generating your quiz.')
        }
        return
      }
      const quizData = await genRes.json() as { questions: Array<{ question: string; options: string[]; answer: string; explanation?: string }> }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('new-quiz', JSON.stringify(quizData))
        // Persist generation settings for potential regeneration
        sessionStorage.setItem('last-quiz-gen', JSON.stringify(generationPayload))
      }
      router.push('/quiz/create')
    } catch (e) {
      console.error('Generate flow error', e)
      setGenerationError('Something went wrong generating your quiz.')
    } finally { setIsLoading(false); setLoadingPhase(null) }
  }

  function uploadAreaProps(accept: string, kind: 'file'|'image') {
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        const f = e.dataTransfer.files?.[0]; if (!f) return
        if (!accept.split(',').some(ext => f.name.toLowerCase().endsWith(ext.trim().replace(/\./,'')))) return
        kind === 'file' ? setFileInput(f) : setImageInput(f)
      }
    }
  }

  if (checkingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-sm text-zinc-400">Checking your session...</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-8">
        {/* Hero header */}
        <section className="relative flex flex-col justify-center items-center gap-4 text-center pt-8 pb-6 w-full">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-168 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
          </div>
          <h1 className="relative z-10 font-bold tracking-tight text-2xl sm:text-3xl md:text-5xl leading-tight pb-1 bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
            Create and manage your quizzes
          </h1>
          <p className="relative z-10 max-w-xl text-zinc-300 leading-relaxed text-base sm:text-lg md:text-xl mx-auto">
            Paste notes, upload PDFs or images, then generate and share AI-powered quizzes.
          </p>
          {userProfile && (
            <div className="relative z-10 inline-flex items-center gap-2 mt-2 text-xs text-zinc-400">
              <span className="rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1">Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>
              {!isProOrAbove && (
                <Button size="sm" onClick={() => router.push('/pricing')}>Upgrade</Button>
              )}
            </div>
          )}
          {!isProOrAbove && (
            <>
              <div className="relative z-10 mt-2 text-[11px] text-amber-300 bg-amber-900/30 border border-amber-800 rounded px-2 py-1">
                Free plan: 3 quizzes per month. Upgrade to unlock PDF & image to quiz.
              </div>
              <UpgradeToProButton />
            </>
          )}
        </section>

        {/* Main content grid */}
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          {/* Left: Create quiz */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Create a new quiz</CardTitle>
              <CardDescription className="text-sm sm:text-base">Turn any text, photo, or PDF into questions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={v => { if (!isProOrAbove && v !== 'text') return; setMode(v as any) }} className="w-full">
                <TabsList className="text-xs sm:text-sm">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="file" className={!isProOrAbove ? 'pointer-events-none opacity-40' : ''} aria-disabled={!isProOrAbove}>File</TabsTrigger>
                  <TabsTrigger value="image" className={!isProOrAbove ? 'pointer-events-none opacity-40' : ''} aria-disabled={!isProOrAbove}>Image</TabsTrigger>
                </TabsList>
                {!isProOrAbove && (
                  <div className="pt-2 text-xs text-zinc-500">Upgrade to unlock PDF & image to quiz.</div>
                )}
                {/* Text */}
                <TabsContent value="text" className="space-y-4 pt-2">
                  <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste notes or content here..." className="min-h-40 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base sm:text-sm outline-none shadow-xs placeholder:text-zinc-500 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="num-questions">Number of questions</Label>
                      <select id="num-questions" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                        {[5,10,15,20].map(n => <option key={n} value={n} className="bg-zinc-950">{n}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                        {['Auto','Easy','Medium','Hard'].map(d => <option key={d} value={d} className="bg-zinc-950">{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleGenerate} disabled={isLoading || !text.trim() || limitReached} aria-busy={isLoading}>{isLoading ? (loadingPhase === 'extract' ? 'Extracting text…' : 'Generating quiz…') : 'Generate quiz'}</Button>
                  {generationError && (
                    <div className="mt-3 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{generationError}</div>
                  )}
                  {limitReached && (
                    <div className="text-[11px] text-zinc-500">Free plan limit reached — upgrade to create more monthly quizzes.</div>
                  )}
                </TabsContent>
                {/* File */}
                <TabsContent value="file" className="space-y-4 pt-2">
                  <div className="border border-dashed border-zinc-700 rounded-md p-6 text-sm text-zinc-400 flex flex-col items-center gap-2 cursor-pointer hover:border-zinc-500 transition" {...uploadAreaProps('.pdf,.docx','file')} onClick={() => document.getElementById('file-input')?.click()}>
                    <span>{fileInput ? fileInput.name : 'Click or drag a PDF / DOCX here'}</span>
                    <input id="file-input" type="file" accept=".pdf,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFileInput(f) }} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="num-questions-file">Number of questions</Label>
                      <select id="num-questions-file" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                        {[5,10,15,20].map(n => <option key={n} value={n} className="bg-zinc-950">{n}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="difficulty-file">Difficulty</Label>
                      <select id="difficulty-file" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                        {['Auto','Easy','Medium','Hard'].map(d => <option key={d} value={d} className="bg-zinc-950">{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleGenerate} disabled={isLoading || !fileInput || limitReached || !isProOrAbove} aria-busy={isLoading}>{isLoading ? (loadingPhase === 'extract' ? 'Extracting text…' : 'Generating quiz…') : 'Generate quiz'}</Button>
                  {generationError && (
                    <div className="mt-3 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{generationError}</div>
                  )}
                  {!isProOrAbove && (
                    <div className="text-[11px] text-zinc-500">Upgrade to unlock PDF & image to quiz.</div>
                  )}
                  {limitReached && isProOrAbove && (
                    <div className="text-[11px] text-zinc-500">Free plan limit reached — upgrade to create more quizzes.</div>
                  )}
                </TabsContent>
                {/* Image */}
                <TabsContent value="image" className="space-y-4 pt-2">
                  <div className="border border-dashed border-zinc-700 rounded-md p-6 text-sm text-zinc-400 flex flex-col items-center gap-2 cursor-pointer hover:border-zinc-500 transition" {...uploadAreaProps('.png,.jpg,.jpeg','image')} onClick={() => document.getElementById('image-input')?.click()}>
                    <span>{imageInput ? imageInput.name : 'Click or drag an image (PNG/JPG) here'}</span>
                    <input id="image-input" type="file" accept="image/png,image/jpg,image/jpeg" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setImageInput(f) }} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="num-questions-image">Number of questions</Label>
                      <select id="num-questions-image" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                        {[5,10,15,20].map(n => <option key={n} value={n} className="bg-zinc-950">{n}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="difficulty-image">Difficulty</Label>
                      <select id="difficulty-image" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                        {['Auto','Easy','Medium','Hard'].map(d => <option key={d} value={d} className="bg-zinc-950">{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleGenerate} disabled={isLoading || !imageInput || limitReached || !isProOrAbove} aria-busy={isLoading}>{isLoading ? (loadingPhase === 'extract' ? 'Extracting text…' : 'Generating quiz…') : 'Generate quiz'}</Button>
                  {generationError && (
                    <div className="mt-3 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{generationError}</div>
                  )}
                  {!isProOrAbove && (
                    <div className="text-[11px] text-zinc-500">Upgrade to unlock PDF & image to quiz.</div>
                  )}
                  {limitReached && isProOrAbove && (
                    <div className="text-[11px] text-zinc-500">Free plan limit reached — upgrade to create more quizzes.</div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          {/* Right column: stats + my quizzes */}
          <div className="flex flex-col gap-6">
            {userProfile?.role === 'user' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loadingUserResults ? (
                    <div className="text-xs text-zinc-400">Loading stats…</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Quizzes taken:</span>
                        <span className="font-medium">{totalQuizzesTaken}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Average score:</span>
                        <span className="font-medium">{averageScorePercent}%</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
            <Card>
            <CardHeader><CardTitle>My quizzes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="search" className="sr-only">Search quizzes</Label>
                <Input id="search" placeholder="Search…" />
              </div>
              {quizzes.length === 0 ? (
                <>
                  <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
                    <div className="font-medium">You haven’t created any quizzes yet.</div>
                    <div className="mt-1 text-sm text-zinc-400">Generate your first quiz or explore the demos below.</div>
                  </div>
                  {demoQuizzes.length > 0 && (
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium tracking-tight">Demo quizzes</h3>
                        <span className="text-[11px] text-zinc-500">Read-only previews</span>
                      </div>
                      <div className="space-y-3">
                        {demoQuizzes.map(d => (
                          <Card key={d.id} className="border-zinc-800">
                            <CardContent className="py-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="font-medium truncate flex items-center gap-2">
                                    <span className="truncate">{d.title}</span>
                                    <span className="inline-flex items-center rounded-full bg-indigo-900/40 border border-indigo-600/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-indigo-300">Demo</span>
                                  </div>
                                  <div className="text-sm text-zinc-400">{d.questionsCount} questions • Preview only</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button onClick={() => { setActiveDemoQuiz(d); setShowDemoDialog(true) }}>Open</Button>
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
                  {quizzes.map(q => {
                    const title = q.title || 'Untitled quiz'
                    const count = Array.isArray(q.questions) ? q.questions.length : 0
                    const date = q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'
                    return (
                      <Card key={q.id} className="w-full">
                        <CardContent className="py-4 flex flex-col gap-2">
                          <div className="font-medium truncate flex items-center gap-2">
                            <span className="truncate">{title}</span>
                            {q.publicId && (
                              <span className="inline-flex items-center rounded-full bg-emerald-900/40 border border-emerald-600/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">Shared</span>
                            )}
                          </div>
                          <div className="text-sm text-zinc-400">{count} {count === 1 ? 'question' : 'questions'} • Created {date}</div>
                          <div className="flex flex-col xs:flex-row flex-wrap gap-2 mt-2 w-full">
                            <Button className="w-full xs:w-auto" onClick={() => router.push(`/quiz/${q.id}`)}>Open</Button>
                            <Button className="w-full xs:w-auto" variant="secondary" onClick={() => router.push(`/quiz/${q.id}/edit`)}>Edit</Button>
                            <Button
                              className="w-full xs:w-auto"
                              variant="outline"
                              size="sm"
                              disabled={sharingQuizId === q.id}
                              aria-busy={sharingQuizId === q.id}
                              onClick={() => handleShare(q)}
                            >{sharingQuizId === q.id ? 'Sharing…' : 'Share'}</Button>
                          </div>
                          {shareLinks[q.id] && (
                            <div className="mt-3 flex items-center gap-2">
                              <Input readOnly value={shareLinks[q.id]} className="text-xs" />
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  const url = shareLinks[q.id]
                                  if (url) navigator.clipboard.writeText(url).catch(err => console.error('Clipboard copy failed', err))
                                }}
                              >Copy</Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
              {/* Demo section appears below real quizzes if user has created at least one */}
              {quizzes.length > 0 && demoQuizzes.length > 0 && (
                <div className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium tracking-tight">Demo quizzes</h3>
                    <span className="text-[11px] text-zinc-500">Read-only previews</span>
                  </div>
                  <div className="space-y-3">
                    {demoQuizzes.map(d => (
                      <Card key={d.id} className="border-zinc-800">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-medium truncate flex items-center gap-2">
                                <span className="truncate">{d.title}</span>
                                <span className="inline-flex items-center rounded-full bg-indigo-900/40 border border-indigo-600/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-indigo-300">Demo</span>
                              </div>
                              <div className="text-sm text-zinc-400">{d.questionsCount} questions • Preview only</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button onClick={() => { setActiveDemoQuiz(d); setShowDemoDialog(true) }}>Open</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {userProfile && (userProfile.role === 'teacher' || userProfile.role === 'institution') && (
                currentTier === 'free' ? (
                  <Card className="mt-6">
                    <CardContent className="py-6">
                      <div className="text-xs text-zinc-500 text-center">Classes & assignments are available on Pro.</div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Classes</CardTitle>
                      <CardDescription>Manage your class groups.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button size="sm" onClick={handleCreateClass} disabled={loadingClasses} aria-busy={loadingClasses}>{loadingClasses ? 'Creating…' : 'Create class'}</Button>
                      {loadingClasses && classes.length === 0 && <div className="text-xs text-zinc-400">Loading classes…</div>}
                      {classes.length === 0 && !loadingClasses ? (
                        <div className="rounded-md border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-400">No classes yet. Create one to get a join code.</div>
                      ) : (
                        <div className="space-y-2">
                          {classes.map(cls => (
                            <div key={cls.id} className="space-y-2 rounded-md border border-zinc-800 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{cls.name}</div>
                                  <div className="text-[11px] text-zinc-400">CODE: {cls.joinCode}</div>
                                  <div className="text-[11px] text-zinc-500">Assignments: {assignmentCounts[cls.id!] ?? 0}</div>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => { setActiveAssignClass(cls); setShowAssignDialog(true) }}>Assign quiz</Button>
                              </div>
                              {(userProfile?.role === 'teacher' || userProfile?.role === 'institution') && (
                                <div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/classes/${cls.id}/results`)}
                                  >View results</Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
  {auth.currentUser && (
          <Card className="max-w-6xl mx-auto border-zinc-800">
            <CardHeader className="pb-2"><CardTitle className="text-base">Join a class</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter join code" className="sm:flex-1 bg-zinc-900 border-zinc-800" />
                <Button onClick={handleJoinClass} disabled={joiningClass || !joinCode.trim()} aria-busy={joiningClass}>{joiningClass ? 'Joining…' : 'Join'}</Button>
              </div>
              {joinError && <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{joinError}</div>}
              <div className="space-y-2">
                {studentClasses.length === 0 ? (
                  <div className="text-xs text-zinc-400">You haven't joined any classes yet.</div>
                ) : (
                  <div className="space-y-3">
                    {studentClasses.map(cls => {
                      const assignments = studentAssignments[cls.id!] ?? []
                      return (
                        <div key={cls.id} className="rounded-md border border-zinc-800 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{cls.name}</div>
                              <div className="text-[11px] text-zinc-400">Code: {cls.joinCode}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {assignments.length === 0 ? (
                              <div className="text-[11px] text-zinc-500">No assignments yet.</div>
                            ) : (
                              assignments.map(a => (
                                <div key={a.id} className="flex items-center justify-between rounded-md border border-zinc-800 px-2 py-1">
                                  <div className="text-xs truncate">{a.title}</div>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => router.push(`/quiz/${a.quizId}?assignment=${a.id}`)}
                                  >Start quiz</Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
      )}
      <Dialog open={showAssignDialog} onOpenChange={o => !o && setShowAssignDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a quiz</DialogTitle>
            <DialogDescription>{activeAssignClass ? `Create an assignment for ${activeAssignClass.name}` : 'Select quiz and title.'}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateAssignment}>
            {assignmentError && <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{assignmentError}</div>}
            <div className="grid gap-2">
              <Label htmlFor="assign-quiz-select">Quiz</Label>
              <select id="assign-quiz-select" value={selectedQuizId} onChange={e => setSelectedQuizId(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                <option value="" className="bg-zinc-950">Select a quiz…</option>
                {quizzes.map(q => <option key={q.id} value={q.id} className="bg-zinc-950">{q.title || 'Untitled quiz'}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assign-title">Assignment title</Label>
              <Input id="assign-title" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} placeholder="e.g. Chapter 3 Review" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowAssignDialog(false)} disabled={creatingAssignment}>Cancel</Button>
              <Button type="submit" disabled={creatingAssignment || !selectedQuizId || !assignmentTitle.trim()} aria-busy={creatingAssignment}>{creatingAssignment ? 'Assigning…' : 'Create assignment'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Demo quiz preview dialog */}
      <Dialog open={showDemoDialog} onOpenChange={o => { if (!o) { setShowDemoDialog(false); setActiveDemoQuiz(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeDemoQuiz ? activeDemoQuiz.title : 'Demo quiz'}</DialogTitle>
            <DialogDescription>Preview only — example structure for a generated quiz.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-zinc-300">
            <p>This is a placeholder preview. Generate your own quiz by pasting text, uploading a PDF, or selecting an image on the left.</p>
            {activeDemoQuiz && (
              <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400">
                {Array.from({ length: activeDemoQuiz.questionsCount }).map((_, i) => (
                  <li key={i}>Sample question {i + 1} (options & answers would appear here)</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-zinc-500">Demo quizzes don’t count toward your plan limits.</p>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => { setShowDemoDialog(false); setActiveDemoQuiz(null) }}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
