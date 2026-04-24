import { openai as openaiClient } from "@ai-sdk/openai";
import { streamText } from "ai";
import { PROMPTS } from "@/lib/prompts";
import { generateEmbedding } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { messages, libraryId } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content;

    if (!lastMessage) {
      return new Response("No message provided", { status: 400 });
    }

    // Step 1: Generate embedding for the user's question
    const queryEmbedding = await generateEmbedding(lastMessage);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Step 2: Search for similar chunks via pgvector cosine similarity
    const relevantChunks = await db.$queryRaw<
      Array<{
        content: string;
        paper_title: string;
        paper_authors: string | null;
        paper_year: number | null;
        section: string | null;
        similarity: number;
      }>
    >`
      SELECT
        pc.content,
        p.title as paper_title,
        p.authors as paper_authors,
        p.year as paper_year,
        pc.section,
        1 - (ce.embedding <=> ${embeddingStr}::vector) as similarity
      FROM chunk_embeddings ce
      JOIN paper_chunks pc ON pc.id = ce.chunk_id
      JOIN papers p ON p.id = pc.paper_id
      WHERE p.library_id = ${libraryId}
        AND p.status = 'ready'
      ORDER BY ce.embedding <=> ${embeddingStr}::vector
      LIMIT 10
    `;

    // Step 3: Build context from retrieved chunks
    const context = relevantChunks
      .map(
        (chunk, i) =>
          `[Source ${i + 1}: ${chunk.paper_title} (${chunk.paper_authors}, ${chunk.paper_year})${chunk.section ? ` — ${chunk.section}` : ""}]\n${chunk.content}`
      )
      .join("\n\n---\n\n");

    // Step 4: Stream response with Vercel AI SDK
    const result = streamText({
      model: openaiClient("gpt-4o"),
      system: PROMPTS.literatureBrain,
      messages: [
        ...messages.slice(0, -1),
        {
          role: "user",
          content: `Here are relevant excerpts from the user's paper library:\n\n${context}\n\n---\n\nUser question: ${lastMessage}`,
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
