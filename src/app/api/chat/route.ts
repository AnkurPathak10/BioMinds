import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { PROMPTS } from "@/lib/prompts";
import { db } from "@/lib/db";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  try {
    const { messages, libraryId } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content;

    if (!lastMessage) {
      return new Response("No message provided", { status: 400 });
    }

    // Build context from the library (simplified — no embedding search for now)
    let context = "";

    if (libraryId) {
      const papers = await db.paper.findMany({
        where: { libraryId, status: "ready" },
        select: { title: true, authors: true, year: true },
        take: 10,
      });

      if (papers.length > 0) {
        context = papers
          .map(
            (p, i) =>
              `[Source ${i + 1}: ${p.title} (${p.authors}, ${p.year})]`
          )
          .join("\n");
      }
    }

    // Stream response with Vercel AI SDK + Groq
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: PROMPTS.literatureBrain,
      messages: [
        ...messages.slice(0, -1),
        {
          role: "user" as const,
          content: context
            ? `Here are relevant papers from the user's library:\n\n${context}\n\n---\n\nUser question: ${lastMessage}`
            : lastMessage,
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
