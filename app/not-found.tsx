import Link from "next/link"
import { Button } from "@/components/ui/button"

// Global 404 page for the App Router
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm text-zinc-400">This quiz or page doesn’t exist anymore.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
        <p className="text-[11px] text-zinc-500">QuizTheory • Empowering learning through adaptive quizzes.</p>
      </div>
    </div>
  )
}
