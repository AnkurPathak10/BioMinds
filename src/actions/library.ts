"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found in database");

  return user;
}

// ── Paper Libraries ──
export async function getLibraries() {
  const user = await getCurrentUser();
  return db.paperLibrary.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { papers: true } },
      papers: {
        select: { id: true, title: true, status: true, chunkCount: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLibrary(name: string) {
  const user = await getCurrentUser();
  const library = await db.paperLibrary.create({
    data: { userId: user.id, name },
  });
  revalidatePath("/dashboard/library");
  return library;
}

// ── Papers ──
export async function addPaper(data: {
  libraryId: string;
  title: string;
  fileUrl: string;
  fileKey: string;
}) {
  const user = await getCurrentUser();

  // Verify library belongs to user
  const library = await db.paperLibrary.findFirst({
    where: { id: data.libraryId, userId: user.id },
  });
  if (!library) throw new Error("Library not found");

  const paper = await db.paper.create({
    data: {
      libraryId: data.libraryId,
      title: data.title,
      fileUrl: data.fileUrl,
      fileKey: data.fileKey,
      status: "processing",
    },
  });

  revalidatePath("/dashboard/library");
  return paper;
}

export async function getPapers(libraryId: string) {
  const user = await getCurrentUser();

  return db.paper.findMany({
    where: {
      libraryId,
      library: { userId: user.id },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deletePaper(paperId: string) {
  const user = await getCurrentUser();

  const paper = await db.paper.findFirst({
    where: { id: paperId, library: { userId: user.id } },
  });
  if (!paper) throw new Error("Paper not found");

  await db.paper.delete({ where: { id: paperId } });
  revalidatePath("/dashboard/library");
}
