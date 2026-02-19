import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/auth";
import { getUserIdFromRequest } from "@/lib/user-session";
import { ALL_TOOLKITS, ToolkitSlug } from "@/lib/composio";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolkit: string }> }
) {
  try {
    const { toolkit } = await params;

    // Validate toolkit is one of our supported ones (required OR optional)
    if (!ALL_TOOLKITS.includes(toolkit as ToolkitSlug)) {
      return NextResponse.json(
        {
          error: `Invalid toolkit: ${toolkit}`,
          validToolkits: ALL_TOOLKITS,
        },
        { status: 400 }
      );
    }

    const userId = await getUserIdFromRequest();
    const authUrl = await getAuthUrl(userId, toolkit as ToolkitSlug);

    return NextResponse.json({
      toolkit,
      authUrl,
      instructions: `Visit the URL to connect your ${toolkit} account. After connecting, the agent will be able to access your ${toolkit} data.`,
    });
  } catch (error) {
    console.error("Auth URL generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate auth URL",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
