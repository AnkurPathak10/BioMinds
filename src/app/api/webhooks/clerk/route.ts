import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Clerk webhook to sync users to our database
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { type, data } = payload;

    switch (type) {
      case "user.created": {
        await db.user.create({
          data: {
            clerkId: data.id,
            email: data.email_addresses?.[0]?.email_address ?? "",
            name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null,
            imageUrl: data.image_url ?? null,
          },
        });
        break;
      }

      case "user.updated": {
        await db.user.update({
          where: { clerkId: data.id },
          data: {
            email: data.email_addresses?.[0]?.email_address,
            name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null,
            imageUrl: data.image_url ?? null,
          },
        });
        break;
      }

      case "user.deleted": {
        await db.user.delete({
          where: { clerkId: data.id },
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
