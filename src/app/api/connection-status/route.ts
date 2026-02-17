import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/lib/auth";
import { getUserId } from "@/lib/composio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = getUserId();
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
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
