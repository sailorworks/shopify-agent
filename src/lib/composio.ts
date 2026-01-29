import { Composio } from "@composio/core";

// Initialize Composio SDK
// In a real app, you would use the API key from env
// For MVP/Mock mode, we might not strictly need this if we skip real calls
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

export const APP_NAME = "Shopify Competitive Agent";
