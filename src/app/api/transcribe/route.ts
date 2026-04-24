import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, structureNotebookEntry } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Step 1: Transcribe with Groq Whisper (blazing fast)
    const rawText = await transcribeAudio(audioFile);

    // Step 2: Structure with Groq Llama 3.3
    const structured = await structureNotebookEntry(rawText);

    return NextResponse.json({
      rawText,
      structured,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Transcription error:", message);
    return NextResponse.json(
      { error: `Failed to process audio: ${message}` },
      { status: 500 }
    );
  }
}
