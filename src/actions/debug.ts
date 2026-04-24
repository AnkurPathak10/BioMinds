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

// ── Debug Sessions ──
export async function getDebugSessions() {
  const user = await getCurrentUser();
  return db.debugSession.findMany({
    where: { userId: user.id },
    include: {
      diagnoses: { orderBy: { rank: "asc" } },
      experiment: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDebugSession(data: {
  experimentId?: string;
  userDescription: string;
  imageUrls: string[];
  diagnoses: Array<{
    rank: number;
    probableCause: string;
    explanation: string;
    suggestedFix: string;
    evidenceSource: string;
    confidenceScore: number;
  }>;
}) {
  const user = await getCurrentUser();

  const session = await db.debugSession.create({
    data: {
      userId: user.id,
      experimentId: data.experimentId || null,
      userDescription: data.userDescription,
      imageUrls: data.imageUrls,
      diagnoses: {
        create: data.diagnoses.map((d) => ({
          rank: d.rank,
          probableCause: d.probableCause,
          explanation: d.explanation,
          suggestedFix: d.suggestedFix,
          evidenceSource: d.evidenceSource,
          confidenceScore: d.confidenceScore,
        })),
      },
    },
    include: {
      diagnoses: { orderBy: { rank: "asc" } },
    },
  });

  revalidatePath("/dashboard/debug");
  return session;
}

export async function deleteDebugSession(sessionId: string) {
  const user = await getCurrentUser();

  const session = await db.debugSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) throw new Error("Session not found");

  await db.debugSession.delete({ where: { id: sessionId } });
  revalidatePath("/dashboard/debug");
}
