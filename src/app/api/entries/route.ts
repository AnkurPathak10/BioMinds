import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser, getDefaultNotebook } from "@/lib/auth";

// GET — Fetch all entries for current user
export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notebook = await getDefaultNotebook(user.id);

    const entries = await db.entry.findMany({
      where: { notebookId: notebook.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Entries GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

// POST — Create a new entry
export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notebook = await getDefaultNotebook(user.id);
    const body = await req.json();

    const entry = await db.entry.create({
      data: {
        notebookId: notebook.id,
        title: body.title || "Untitled Experiment",
        hypothesis: body.hypothesis || null,
        materials: body.materials || null,
        procedure: body.procedure || null,
        observations: body.observations || null,
        results: body.results || null,
        conclusion: body.conclusion || null,
        rawVoiceText: body.rawVoiceText || null,
        source: body.source || "typed",
        tags: body.tags || [],
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Entries POST error:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}

// DELETE — Delete an entry by ID (passed as query param)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get("id");

    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const entry = await db.entry.findUnique({
      where: { id: entryId },
      include: { notebook: true },
    });

    if (!entry || entry.notebook.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.entry.delete({ where: { id: entryId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Entries DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
