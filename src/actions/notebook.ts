"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ── Helper: get current user from DB ──
async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found in database");

  return user;
}

// ── Notebooks ──
export async function getNotebooks() {
  const user = await getCurrentUser();
  return db.notebook.findMany({
    where: { userId: user.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createNotebook(data: {
  title: string;
  description?: string;
  emoji?: string;
}) {
  const user = await getCurrentUser();
  const notebook = await db.notebook.create({
    data: {
      userId: user.id,
      title: data.title,
      description: data.description,
      emoji: data.emoji || "🧪",
    },
  });
  revalidatePath("/dashboard/notebook");
  return notebook;
}

// ── Entries ──
export async function getEntries(notebookId?: string) {
  const user = await getCurrentUser();

  const whereClause: Record<string, unknown> = {
    notebook: { userId: user.id },
  };
  if (notebookId) {
    whereClause.notebookId = notebookId;
  }

  return db.entry.findMany({
    where: whereClause,
    include: { notebook: { select: { title: true, emoji: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEntry(data: {
  notebookId: string;
  title: string;
  hypothesis?: string;
  materials?: string[];
  procedure?: string;
  observations?: string;
  results?: string;
  conclusion?: string;
  rawVoiceText?: string;
  source?: string;
  tags?: string[];
  experimentDate?: string;
}) {
  const user = await getCurrentUser();

  // Verify notebook belongs to user
  const notebook = await db.notebook.findFirst({
    where: { id: data.notebookId, userId: user.id },
  });
  if (!notebook) throw new Error("Notebook not found");

  const entry = await db.entry.create({
    data: {
      notebookId: data.notebookId,
      title: data.title,
      hypothesis: data.hypothesis,
      materials: data.materials || [],
      procedure: data.procedure,
      observations: data.observations,
      results: data.results,
      conclusion: data.conclusion,
      rawVoiceText: data.rawVoiceText,
      source: data.source || "typed",
      tags: data.tags || [],
      experimentDate: data.experimentDate
        ? new Date(data.experimentDate)
        : null,
    },
  });

  revalidatePath("/dashboard/notebook");
  return entry;
}

export async function deleteEntry(entryId: string) {
  const user = await getCurrentUser();

  const entry = await db.entry.findFirst({
    where: { id: entryId, notebook: { userId: user.id } },
  });
  if (!entry) throw new Error("Entry not found");

  await db.entry.delete({ where: { id: entryId } });
  revalidatePath("/dashboard/notebook");
}
