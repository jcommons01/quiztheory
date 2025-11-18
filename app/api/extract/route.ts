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
    let fileBuffer: Buffer | null = null;
    let fileType: string | undefined;
    let fileData: string | undefined;

    // Check if multipart/form-data (file upload)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.startsWith("multipart/form-data")) {
      // Use the web API to parse form data
      const formData = await req.formData();
      const file = formData.get("file");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const arrBuf = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrBuf);
        // @ts-ignore
        fileType = file.type;
      }
    } else {
      // Fallback to JSON body (legacy)
      const body: ExtractRequestBody = await req.json().catch(() => ({}));
      fileData = body.fileData;
      fileType = body.fileType;
      if (fileData) {
        fileBuffer = Buffer.from(sanitizeBase64(fileData), "base64");
      }
    }

    if (!fileBuffer || !fileType) {
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
        const parsed = await pdfParse(fileBuffer);
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


    // Image OCR using tesseract.js
    if (fileType.startsWith("image/")) {
      try {
        // Lazy load tesseract.js
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Tesseract = require("tesseract.js");
        // Timeout helper
        function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("OCR timed out")), ms);
            promise.then(
              (val) => {
                clearTimeout(timer);
                resolve(val);
              },
              (err) => {
                clearTimeout(timer);
                reject(err);
              }
            );
          });
        }
        // Run OCR with 20s timeout
        const result = await withTimeout(
          Tesseract.recognize(fileBuffer, "eng", { logger: () => {} }),
          20000
        );
        const data = (result as any).data;
        const extractedText = (data && data.text ? data.text : "").trim();
        return NextResponse.json({ text: extractedText });
      } catch (err) {
        console.error("Image OCR error", err);
        const errorMsg = (err && typeof err === "object" && "message" in err) ? (err as any).message : "Failed to extract text from image.";
        return NextResponse.json(
          { error: errorMsg },
          { status: 500 }
        );
      }
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
