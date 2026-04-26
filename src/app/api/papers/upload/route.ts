import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { db } from "@/lib/db";
import { getDbUser, getDefaultLibrary } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const library = await getDefaultLibrary(user.id);

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File | null;

    if (!pdfFile) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (!pdfFile.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Parse PDF with unpdf
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    const { text: rawText, totalPages } = await extractText(pdf, {
      mergePages: true,
    });

    const text = typeof rawText === "string" ? rawText : String(rawText);

    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF. It may be scanned/image-based.",
        },
        { status: 400 }
      );
    }

    // Extract title from first meaningful line or filename
    const fileName = pdfFile.name.replace(/\.pdf$/i, "");
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 10 && l.length < 200);
    const extractedTitle = lines[0] || fileName;

    // Split text into chunks (~500 words each)
    const words = text.split(/\s+/);
    const chunkSize = 500;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      if (chunk.trim().length > 50) {
        chunks.push(chunk.trim());
      }
    }

    // Save paper to database
    const paper = await db.paper.create({
      data: {
        libraryId: library.id,
        title: extractedTitle,
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        numPages: totalPages,
        wordCount: words.length,
        preview: text.substring(0, 500),
        status: "ready",
        chunkCount: chunks.length,
        chunks: {
          create: chunks.map((content, index) => ({
            chunkIndex: index,
            content,
          })),
        },
      },
      include: {
        chunks: {
          select: { id: true, content: true },
        },
      },
    });

    return NextResponse.json({ paper }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PDF upload error:", message);
    return NextResponse.json(
      { error: `Failed to process PDF: ${message}` },
      { status: 500 }
    );
  }
}
