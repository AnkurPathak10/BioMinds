import OpenAI from "openai";

// Lazy-init to avoid build-time errors when OPENAI_API_KEY isn't set
let _openai: OpenAI | null = null;

export function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

/** Generate embedding vector for a piece of text */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " ").trim(),
  });
  return response.data[0].embedding;
}

/** Transcribe audio using Whisper */
export async function transcribeAudio(audioFile: File): Promise<string> {
  const openai = getOpenAI();
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en",
  });
  return transcription.text;
}
