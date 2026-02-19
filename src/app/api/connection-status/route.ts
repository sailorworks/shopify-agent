import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/user-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    const summary = await getConnectionStatus(userId);

    return NextResponse.json({
      userId,
      ...summary,
    });
  } catch (error) {
    console.error("Connection status check failed:", error);
    return NextResponse.json(
      {
        error: "Failed to check connection status",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
