import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Gets the database user for the currently authenticated Clerk user.
 * Creates the user if they don't exist yet (handles race condition before webhook fires).
 */
export async function getDbUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // Try to find existing user
  let user = await db.user.findUnique({
    where: { clerkId },
  });

  // If user doesn't exist (webhook hasn't fired yet), create a minimal record
  if (!user) {
    user = await db.user.create({
      data: {
        clerkId,
        email: `${clerkId}@pending.labflow`,
        name: null,
      },
    });
  }

  return user;
}

/**
 * Gets or creates the user's default notebook.
 */
export async function getDefaultNotebook(userId: string) {
  let notebook = await db.notebook.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!notebook) {
    notebook = await db.notebook.create({
      data: {
        userId,
        title: "My Lab Notebook",
        description: "Default notebook",
      },
    });
  }

  return notebook;
}

/**
 * Gets or creates the user's default paper library.
 */
export async function getDefaultLibrary(userId: string) {
  let library = await db.paperLibrary.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!library) {
    library = await db.paperLibrary.create({
      data: {
        userId,
        name: "My Library",
      },
    });
  }

  return library;
}
