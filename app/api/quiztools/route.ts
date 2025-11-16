import { NextResponse } from "next/server";
import OpenAI from "openai";

// Types for request/response
interface QuiztoolsRequestBase {
  action: "rewrite_question" | "regenerate_options";
  question?: string;
  // Only required for rewrite_question per spec
  options?: string[];
}

export async function POST(req: Request) {
  let body: QuiztoolsRequestBase | null = null;
  try {
    body = (await req.json()) as QuiztoolsRequestBase;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const action = body?.action;
  if (action !== "rewrite_question" && action !== "regenerate_options") {
    return NextResponse.json({ error: "Missing or invalid action" }, { status: 400 });
  }

  const question = typeof body?.question === "string" ? body!.question.trim() : "";
  const options = Array.isArray(body?.options) ? body!.options.map(o => String(o ?? "").trim()) : [];

  try {
    if (action === "rewrite_question") {
      if (!question || options.length === 0) {
        // Treat invalid input as an error per spec
        return NextResponse.json({ error: "AI error" }, { status: 500 });
      }

      const system = `You are a helpful quiz editor. Improve clarity, grammar, and maintain original difficulty. Return STRICT JSON: { "question": string } ONLY.`;
      const user = `Rewrite this multiple-choice question keeping difficulty similar.\nQuestion: ${question}\nOptions: ${JSON.stringify(options)}`;

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

  const content = completion.choices?.[0]?.message?.content || "{}";
      let parsed: { question?: string } | null = null;
      try {
        parsed = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: "AI error" }, { status: 500 });
      }
      const out = (parsed && typeof parsed.question === "string" && parsed.question.trim())
        ? { question: parsed.question.trim() }
        : null;
      if (!out) return NextResponse.json({ error: "AI error" }, { status: 500 });

      return NextResponse.json(out);
    }

    if (action === "regenerate_options") {
      if (!question) {
        return NextResponse.json({ error: "AI error" }, { status: 500 });
      }

      const system = `Generate exactly 4 believable options for the given question: one correct answer and 3 plausible distractors. Return STRICT JSON ONLY: { "options": string[], "answer": string }. Ensure answer appears verbatim in options.`;
      const user = `Question: ${question}`;

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

  const content = completion.choices?.[0]?.message?.content || "{}";
      let parsed: { options?: unknown; answer?: unknown } | null = null;
      try {
        parsed = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: "AI error" }, { status: 500 });
      }
      const outOptions = Array.isArray(parsed?.options)
        ? (parsed!.options as unknown[]).map((o) => String(o ?? "").trim()).filter(Boolean)
        : [];
      const outAnswer = typeof parsed?.answer === "string" ? parsed!.answer.trim() : "";

      if (outOptions.length !== 4 || !outOptions.includes(outAnswer)) {
        return NextResponse.json({ error: "AI error" }, { status: 500 });
      }

      return NextResponse.json({ options: outOptions, answer: outAnswer });
    }

    // Fallback
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
