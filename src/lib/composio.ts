import { Composio } from "@composio/core";

// Lazy initialization - SDK is created on first use, not at import time
let _composio: Composio | null = null;

export function getComposio(): Composio {
  if (!_composio) {
    if (!process.env.COMPOSIO_API_KEY) {
      throw new Error("COMPOSIO_API_KEY environment variable is not set");
    }
    _composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
    });
  }
  return _composio;
}

// For backward compatibility (used in disconnect route)
export const composio = new Proxy({} as Composio, {
  get(_, prop) {
    return (getComposio() as any)[prop];
  },
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

// Create a session for a user with specified toolkits enabled
export async function createUserSession(userId: string) {
  return getComposio().create(userId, {
    toolkits: [...ALL_TOOLKITS],
    manageConnections: false, // We handle auth manually via authorize()
  });
}

// Get user ID - in production this would come from auth
export function getUserId(): string {
  return process.env.DEFAULT_USER_ID || "shopify_demo_user";
}
