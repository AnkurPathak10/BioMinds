import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, getOpenAI } from "@/lib/ai";
import { PROMPTS } from "@/lib/prompts";

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

    // Step 1: Transcribe with Whisper
    const rawText = await transcribeAudio(audioFile);

    // Step 2: Structure with GPT-4o
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PROMPTS.structureNotebookEntry },
        {
          role: "user",
          content: `Here is the raw voice transcription from a lab researcher:\n\n"${rawText}"\n\nPlease structure this into a proper lab notebook entry. Return as JSON.`,
        },
      ],
    });

    const structured = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

    return NextResponse.json({
      rawText,
      structured,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
