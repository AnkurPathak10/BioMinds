import { NextRequest, NextResponse } from "next/server";
import { getGroq } from "@/lib/ai";
import { PROMPTS } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const { imageUrls, description, expectedResult, protocol } =
      await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const groq = getGroq();

    // Build message content — Groq vision model supports images
    const contentParts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [];

    // Add images if provided
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        contentParts.push({
          type: "image_url",
          image_url: { url },
        });
      }
    }

    // Add text description
    contentParts.push({
      type: "text",
      text: `## Failed Experiment Details

**What went wrong:** ${description}

**Expected result:** ${expectedResult || "Not specified"}

**Protocol used:** ${protocol || "Not specified"}

Please analyze and provide your diagnosis as a JSON object with a "diagnoses" array. Each diagnosis should have: "title", "probability" (string like "High"), "explanation", "suggestedFix", and "possibleCauses" (array of strings).`,
    });

    const completion = await groq.chat.completions.create({
      model:
        imageUrls && imageUrls.length > 0
          ? "llama-3.2-90b-vision-preview"
          : "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      max_tokens: 2000,
      messages: [
        { role: "system", content: PROMPTS.experimentDebugger },
        { role: "user", content: contentParts },
      ],
    });

    const text = completion.choices[0].message.content || '{"diagnoses":[]}';
    const result = JSON.parse(text);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Debug error:", message);
    return NextResponse.json(
      { error: `Failed to analyze experiment: ${message}` },
      { status: 500 }
    );
  }
}
