import { NextRequest, NextResponse } from "next/server";
import { composio, getUserId, ALL_TOOLKITS, ToolkitSlug } from "@/lib/composio";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ toolkit: string }> }
) {
  try {
    const { toolkit } = await params;

    // Validate toolkit
    if (!ALL_TOOLKITS.includes(toolkit as ToolkitSlug)) {
      return NextResponse.json(
        { error: `Invalid toolkit: ${toolkit}` },
        { status: 400 }
      );
    }

    const userId = getUserId();
    
    // Get connected accounts and delete the one for this toolkit
    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [userId],
      toolkitSlugs: [toolkit],
    });

    const account = connectedAccounts.items?.[0];

    if (!account) {
      return NextResponse.json(
        { error: `No connection found for ${toolkit}` },
        { status: 404 }
      );
    }

    // Delete the connection
    await composio.connectedAccounts.delete(account.id);

    return NextResponse.json({
      success: true,
      message: `Disconnected ${toolkit} successfully`,
      deletedAccountId: account.id,
    });
  } catch (error) {
    console.error("Disconnect failed:", error);
    return NextResponse.json(
      {
        error: "Failed to disconnect",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
