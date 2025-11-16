import { NextResponse } from "next/server";

// Force Node runtime (pdf-parse relies on Node APIs)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExtractRequestBody {
  fileData?: string; // base64 string (may include data:... prefix)
  fileType?: string; // mime type e.g. application/pdf or image/png
}

// Lazy reference to pdf-parse so we only load it when needed
// eslint-disable-next-line @typescript-eslint/no-var-requires
let pdfParse: ((data: Buffer) => Promise<{ text?: string }>) | undefined;

function sanitizeBase64(input: string): string {
  // Remove any data URI prefix: data:application/pdf;base64,
  return input.replace(/^data:[^;]+;base64,/, "").trim();
}

export async function POST(req: Request) {
  try {
    const body: ExtractRequestBody = await req.json().catch(() => ({}));
    const { fileData, fileType } = body;

    if (!fileData || !fileType) {
      return NextResponse.json(
        { error: "Missing fileData or fileType." },
        { status: 400 }
      );
    }

    // Handle PDF extraction
    if (fileType === "application/pdf") {
      try {
        if (!pdfParse) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          pdfParse = require("pdf-parse") as (data: Buffer) => Promise<{ text?: string }>;
        }
        const cleaned = sanitizeBase64(fileData);
        const buffer = Buffer.from(cleaned, "base64");
        const parsed = await pdfParse(buffer);
        const extractedText = (parsed.text || "").trim();
        return NextResponse.json({ text: extractedText });
      } catch (err) {
        console.error("PDF extraction error", err);
        return NextResponse.json(
          { error: "Failed to extract text from PDF." },
          { status: 500 }
        );
      }
    }

    // Image placeholder (OCR to be added later)
    if (fileType.startsWith("image/")) {
      return NextResponse.json({ text: "Image text extraction coming soon." });
    }

    return NextResponse.json(
      { error: "Unsupported fileType. Provide a PDF or image." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Unhandled extract route error", error);
    return NextResponse.json(
      { error: "Unexpected error while processing file." },
      { status: 500 }
    );
  }
}
