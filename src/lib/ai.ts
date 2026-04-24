import Groq from "groq-sdk";

// Lazy-init to avoid build-time errors when API key isn't set
let _groq: Groq | null = null;

export function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return _groq;
}

/** Transcribe audio using Groq's Whisper */
export async function transcribeAudio(audioFile: File): Promise<string> {
  const groq = getGroq();
  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-large-v3-turbo",
    language: "en",
  });
  return transcription.text;
}

/** Structure raw text into lab notebook fields using Groq's Llama */
export async function structureNotebookEntry(
  rawText: string
): Promise<Record<string, unknown>> {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert lab scientist assistant. Structure the given raw lab notes into a proper notebook entry. Return a JSON object with these fields:
- title: A concise experiment title (max 80 chars)
- hypothesis: The hypothesis being tested
- materials: A comma-separated string of materials/reagents
- procedure: Step-by-step procedure, numbered
- observations: Any observations during the experiment  
- results: Quantitative or qualitative results
- conclusion: Summary and next steps
- tags: A comma-separated string of relevant tags (technique names, cell lines, genes, etc.)

If a field was not mentioned, set it to an empty string.`,
      },
      {
        role: "user",
        content: `Here are the raw voice notes from a lab researcher:\n\n"${rawText}"\n\nPlease structure this into a proper lab notebook entry. Return as JSON.`,
      },
    ],
  });

  return JSON.parse(completion.choices[0].message.content || "{}");
}
