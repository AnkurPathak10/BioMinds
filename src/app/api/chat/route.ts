import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { PROMPTS } from "@/lib/prompts";
import { db } from "@/lib/db";
import { getDbUser, getDefaultLibrary } from "@/lib/auth";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content;

    if (!lastMessage) {
      return new Response("No message provided", { status: 400 });
    }

    // Build context from user's library
    let context = "";

    const user = await getDbUser();
    if (user) {
      const library = await getDefaultLibrary(user.id);

      // Load paper titles + first few chunks for context
      const papers = await db.paper.findMany({
        where: { libraryId: library.id, status: "ready" },
        select: {
          title: true,
          fileName: true,
          chunks: {
            select: { content: true },
            orderBy: { chunkIndex: "asc" },
            take: 3, // first 3 chunks per paper
          },
        },
        take: 5,
      });

      if (papers.length > 0) {
        context = papers
          .map((p, i) => {
            const chunkText = p.chunks
              .map((c) => c.content)
              .join("\n\n");
            return `[Paper ${i + 1}: ${p.title}]\n${chunkText}`;
          })
          .join("\n\n---\n\n");
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
            ? `Here are excerpts from the researcher's uploaded papers:\n\n${context}\n\n---\n\nUser question: ${lastMessage}`
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
