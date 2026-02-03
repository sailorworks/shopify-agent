import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

// Initialize Composio SDK with Vercel AI SDK provider
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

// Required toolkits (must be connected to use real analysis)
export const REQUIRED_TOOLKITS = ["junglescout", "semrush"] as const;

// Optional toolkits (enhance experience but not required)
export const OPTIONAL_TOOLKITS = ["shopify"] as const;

// All toolkits
export const ALL_TOOLKITS = [...REQUIRED_TOOLKITS, ...OPTIONAL_TOOLKITS] as const;

export type RequiredToolkit = (typeof REQUIRED_TOOLKITS)[number];
export type OptionalToolkit = (typeof OPTIONAL_TOOLKITS)[number];
export type ToolkitSlug = RequiredToolkit | OptionalToolkit;

// Create a session for a user with all toolkits enabled
export async function createUserSession(userId: string) {
  return composio.create(userId, {
    toolkits: [...ALL_TOOLKITS],
    manageConnections: false, // We handle auth manually via authorize()
  });
}

// Get user ID - in production this would come from auth
export function getUserId(): string {
  return process.env.DEFAULT_USER_ID || "shopify_demo_user";
}
