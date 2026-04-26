import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

// GET — Fetch all debug sessions for current user
export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.debugSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        diagnoses: {
          orderBy: { rank: "asc" },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Debug sessions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug sessions" },
      { status: 500 }
    );
  }
}

// POST — Save a debug session with diagnoses
export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const session = await db.debugSession.create({
      data: {
        userId: user.id,
        description: body.description,
        expectedResult: body.expectedResult || null,
        protocol: body.protocol || null,
        imageCount: body.imageCount || 0,
        diagnoses: {
          create: (body.diagnoses || []).map(
            (
              d: {
                title: string;
                probability: string;
                explanation: string;
                suggestedFix: string;
                possibleCauses: string[];
              },
              i: number
            ) => ({
              rank: i + 1,
              title: d.title || "Unknown Issue",
              probability: d.probability || "Medium",
              explanation: d.explanation || "",
              suggestedFix: d.suggestedFix || "",
              possibleCauses: d.possibleCauses || [],
            })
          ),
        },
      },
      include: {
        diagnoses: {
          orderBy: { rank: "asc" },
        },
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Debug sessions POST error:", error);
    return NextResponse.json(
      { error: "Failed to save debug session" },
      { status: 500 }
    );
  }
}
