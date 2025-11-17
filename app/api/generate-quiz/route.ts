import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserProfile } from "@/lib/firestore";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firestore";
export const runtime = "nodejs";

// Node.js runtime ensures OpenAI and any Node libs function correctly

type Difficulty = "Auto" | "Easy" | "Medium" | "Hard";

interface GenerateQuizRequestBody {
  content: string;
  numQuestions: number;
  difficulty: Difficulty;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizResponseShape {
  questions: QuizQuestion[];
}

function isValidDifficulty(v: unknown): v is Difficulty {
  return v === "Auto" || v === "Easy" || v === "Medium" || v === "Hard";
}

export async function POST(req: Request) {
  let body: Partial<GenerateQuizRequestBody & { userId?: string }>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const numQuestions = typeof body?.numQuestions === "number" ? body.numQuestions : NaN;
  const difficulty = body?.difficulty;
  const userId = typeof body?.userId === "string" ? body.userId : undefined;

  // Enforce quiz limit for free users
  if (userId) {
    const userDoc = await getUserProfile(userId);
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
    const isPro = userDoc.subscriptionTier === "pro" || userDoc.subscriptionTier === "teacher" || userDoc.subscriptionTier === "institution";
    if (!isPro) {
      if ((userDoc.freeQuizCountThisMonth ?? 0) >= 3) {
        return NextResponse.json(
          { error: "Free plan limit reached. Please upgrade to generate more quizzes." },
          { status: 403 },
        );
      }
      // Increment counter
      await setDoc(doc(db, "users", userId), {
        freeQuizCountThisMonth: (userDoc.freeQuizCountThisMonth ?? 0) + 1,
        freeQuizLastUpdatedAt: Date.now(),
      }, { merge: true });
    }
  }

  if (!content || !Number.isFinite(numQuestions) || !isValidDifficulty(difficulty)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    // Per requirements, standardize the error message
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are an assistant that generates high-quality multiple-choice quizzes.

Instructions:
1. Use ONLY the provided source content. Do NOT invent facts.
2. Generate EXACTLY ${numQuestions} multiple-choice questions.
3. For each question produce:
   - question: concise, clear, exam-style.
  - options: an array of 4 plausible distinct answers.
  - answer: EXACT string match of one option (the correct one).
   - explanation: 1–3 sentences, simple language, why the answer is correct.
  IMPORTANT option formatting rules:
  - The correct answer MUST be as short or shorter than every distractor (never the longest by characters).
  - Keep all options succinct (typically under 80 characters) and similar length.
4. Avoid trick questions. Avoid ambiguity. Only ask about information present in the source.
5. Difficulty setting: ${difficulty}. Interpret as:
   - Easy: Basic recall.
   - Medium: Some reasoning / application.
   - Hard: Deeper conceptual understanding.
   - Auto: Mix of easy/medium/hard appropriate to the content.
6. Output STRICT JSON ONLY with this top-level shape:
   { "questions": [ { "question": string, "options": string[], "answer": string, "explanation": string }, ... ] }
7. NO markdown, NO commentary, NO trailing commas, NO additional keys.
8. Guarantee valid JSON.`;

  const userPrompt = `Source Content:\n\n${content}\n\nGenerate ${numQuestions} questions now. Return only JSON.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const text = completion.choices?.[0]?.message?.content || "{}";
    let parsed: QuizResponseShape;
    try {
      parsed = JSON.parse(text) as QuizResponseShape;
    } catch (error) {
      throw new Error("json_parse_failed");
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error("invalid_structure");
    }

    let normalized: QuizQuestion[] = parsed.questions.slice(0, numQuestions).map((q) => ({
      question: String(q.question ?? "").trim(),
      options: Array.isArray(q.options) ? q.options.map((o) => String(o ?? "").trim()).slice(0, 4) : [],
      answer: String(q.answer ?? "").trim(),
      explanation: String(q.explanation ?? "").trim(),
    })).filter((q) =>
      q.question &&
      q.options.length === 4 &&
      q.options.includes(q.answer) &&
      q.explanation && q.explanation.length > 0
    );

    if (normalized.length !== numQuestions) {
      throw new Error("validation_failed");
    }

    // Enforce: correct answer should not be longer than distractors
    normalized = normalized.map((q) => {
      try {
        const answerLen = q.answer.length;
        const maxDistractor = Math.max(...q.options.filter((o) => o !== q.answer).map((o) => o.length));
        if (answerLen > maxDistractor) {
          // If violation, try a simple mitigation: sort options by length descending so the longest becomes a distractor.
          // Keep answer string intact, then place it among others but do not exceed 4 options.
          const opts = [...q.options];
          // Ensure the answer is present
          const idx = opts.findIndex((o) => o === q.answer);
          if (idx === -1) return q;
          opts.splice(idx, 1); // remove answer
          // Sort remaining by length desc
          opts.sort((a, b) => b.length - a.length);
          // Reinsert answer at end so it's not the longest by position (we'll rebalance later anyway)
          const newOptions = [...opts.slice(0, 3)];
          // Guarantee 3 distractors; if slicing cut below 3 (shouldn't), pad with originals
          while (newOptions.length < 3 && opts.length > newOptions.length) {
            newOptions.push(opts[newOptions.length]);
          }
          newOptions.push(q.answer);
          q.options = newOptions;
        }
      } catch {}
      return q;
    });

    // Enforce even spread of correct answer positions across questions (0..3)
    const n = normalized.length;
    const positions: number[] = [];
    for (let i = 0; i < 4; i++) {
      const count = Math.floor(n / 4) + (i < (n % 4) ? 1 : 0);
      for (let j = 0; j < count; j++) positions.push(i);
    }
    // Randomize the balanced positions across all questions so there's no visible block pattern
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    // Apply shuffled balanced positions to canonical saved quiz
    normalized = normalized.map((q, i) => {
      const target = positions[i] ?? 0;
      const idx = q.options.findIndex((o) => o === q.answer);
      if (idx === -1 || idx === target) return q;
      const opts = [...q.options];
      const [ans] = opts.splice(idx, 1);
      opts.splice(target, 0, ans);
      return { ...q, options: opts };
    });

    return NextResponse.json<QuizResponseShape>({ questions: normalized });
  } catch (error) {
    console.error("generate-quiz error", error);
    return NextResponse.json({
      error: "There was a problem generating your quiz. Please try again with simpler or shorter text.",
    }, { status: 500 });
  }
}
