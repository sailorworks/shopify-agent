import { NextRequest, NextResponse } from "next/server";
import { parseAgentResponse } from "@/lib/agent";

/**
 * POST /api/parse-dashboard
 * Parses a text analysis response into structured ProductData for the dashboard.
 * Kept server-side because agent.ts imports @composio/core which uses node: modules.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, productName } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field" },
        { status: 400 }
      );
    }

    const data = await parseAgentResponse(
      text,
      productName || "Analysis",
      []
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to parse dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to parse analysis data" },
      { status: 500 }
    );
  }
}
