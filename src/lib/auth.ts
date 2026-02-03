import {
  createUserSession,
  REQUIRED_TOOLKITS,
  OPTIONAL_TOOLKITS,
  ALL_TOOLKITS,
  ToolkitSlug,
} from "./composio";

export interface ConnectionStatus {
  toolkit: string;
  connected: boolean;
  required: boolean;
}

export interface ConnectionSummary {
  status: ConnectionStatus[];
  requiredConnected: number;
  requiredTotal: number;
  optionalConnected: number;
  optionalTotal: number;
  canAnalyze: boolean; // true if all required toolkits are connected
  shopifyConnected: boolean;
}

/**
 * Check which toolkits are connected for a user
 */
export async function getConnectionStatus(userId: string): Promise<ConnectionSummary> {
  const session = await createUserSession(userId);
  const toolkits = await session.toolkits();

  const status: ConnectionStatus[] = ALL_TOOLKITS.map((slug) => {
    const toolkit = toolkits.items.find((t: { slug: string }) => t.slug === slug);
    const isRequired = (REQUIRED_TOOLKITS as readonly string[]).includes(slug);
    return {
      toolkit: slug,
      connected: !!toolkit?.connection?.connectedAccount,
      required: isRequired,
    };
  });

  const requiredStatus = status.filter((s) => s.required);
  const optionalStatus = status.filter((s) => !s.required);

  return {
    status,
    requiredConnected: requiredStatus.filter((s) => s.connected).length,
    requiredTotal: requiredStatus.length,
    optionalConnected: optionalStatus.filter((s) => s.connected).length,
    optionalTotal: optionalStatus.length,
    canAnalyze: requiredStatus.every((s) => s.connected),
    shopifyConnected: status.find((s) => s.toolkit === "shopify")?.connected ?? false,
  };
}

/**
 * Get auth URL for a specific toolkit
 * Returns a Composio Connect Link that users can visit to authorize
 */
export async function getAuthUrl(userId: string, toolkit: ToolkitSlug): Promise<string> {
  const session = await createUserSession(userId);
  const connectionRequest = await session.authorize(toolkit);
  if (!connectionRequest.redirectUrl) {
    throw new Error(`Failed to get auth URL for ${toolkit}`);
  }
  return connectionRequest.redirectUrl;
}

/**
 * Check if all required toolkits are connected
 */
export async function canRunAnalysis(userId: string): Promise<boolean> {
  const summary = await getConnectionStatus(userId);
  return summary.canAnalyze;
}
