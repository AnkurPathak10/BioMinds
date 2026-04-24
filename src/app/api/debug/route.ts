import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/ai";
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

    // Build the message content array with images + text
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

Please analyze the image(s) and provide your diagnosis as a JSON object with a "diagnoses" array.`,
    });

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      max_tokens: 2000,
      messages: [
        { role: "system", content: PROMPTS.experimentDebugger },
        { role: "user", content: contentParts },
      ],
    });

    const result = JSON.parse(
      completion.choices[0].message.content || '{"diagnoses":[]}'
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Failed to analyze experiment" },
      { status: 500 }
    );
  }
}
