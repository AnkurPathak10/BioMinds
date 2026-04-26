import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser, getDefaultLibrary } from "@/lib/auth";

// GET — Fetch all papers for current user
export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const library = await getDefaultLibrary(user.id);

    const papers = await db.paper.findMany({
      where: { libraryId: library.id },
      orderBy: { createdAt: "desc" },
      include: {
        chunks: {
          select: { id: true, content: true },
        },
      },
    });

    return NextResponse.json({ papers });
  } catch (error) {
    console.error("Papers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch papers" },
      { status: 500 }
    );
  }
}

// DELETE — Delete a paper by ID
export async function DELETE(req: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("id");

    if (!paperId) {
      return NextResponse.json(
        { error: "Paper ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const paper = await db.paper.findUnique({
      where: { id: paperId },
      include: { library: true },
    });

    if (!paper || paper.library.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.paper.delete({ where: { id: paperId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Papers DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete paper" },
      { status: 500 }
    );
  }
}
