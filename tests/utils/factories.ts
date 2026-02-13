import { vi } from "vitest";
import type { ProductData, Competitor } from "@/lib/mock-data";
import type { ConnectionStatus, ConnectionSummary } from "@/lib/auth";

/**
 * Create mock ProductData for testing
 */
export function createMockProductData(
  overrides?: Partial<ProductData>
): ProductData {
  const defaults: ProductData = {
    name: "Test Product",
    demandScore: 75,
    revenue: "$50,000/mo",
    trend: "up",
    opportunityLevel: "High",
    recommendation: "Test recommendation for product analysis",
    revenueHistory: [
      { month: "Jan", value: 40000 },
      { month: "Feb", value: 42000 },
      { month: "Mar", value: 45000 },
      { month: "Apr", value: 47000 },
      { month: "May", value: 48000 },
      { month: "Jun", value: 50000 },
    ],
    trafficDistribution: [
      { name: "Organic SEO", value: 45 },
      { name: "Paid Ads", value: 30 },
      { name: "Social Media", value: 15 },
      { name: "Direct", value: 10 },
    ],
    competitors: [
      {
        domain: "competitor1.com",
        traffic: "100k/mo",
        trafficSource: "Organic (SEO)",
        topKeywords: ["test keyword 1", "test keyword 2"],
      },
      {
        domain: "competitor2.com",
        traffic: "75k/mo",
        trafficSource: "Paid (Ads)",
        topKeywords: ["test keyword 3", "test keyword 4"],
      },
    ],
  };

  return { ...defaults, ...overrides };
}

/**
 * Create mock ConnectionStatus for testing
 */
export function createMockConnectionStatus(
  overrides?: Partial<ConnectionStatus>
): ConnectionStatus {
  const defaults: ConnectionStatus = {
    toolkit: "junglescout",
    connected: true,
    required: true,
  };

  return { ...defaults, ...overrides };
}

/**
 * Create mock ConnectionSummary for testing
 */
export function createMockConnectionSummary(
  overrides?: Partial<ConnectionSummary>
): ConnectionSummary {
  const defaults: ConnectionSummary = {
    status: [
      createMockConnectionStatus({ toolkit: "junglescout", connected: true, required: true }),
      createMockConnectionStatus({ toolkit: "semrush", connected: true, required: true }),
      createMockConnectionStatus({ toolkit: "shopify", connected: false, required: false }),
    ],
    requiredConnected: 2,
    requiredTotal: 2,
    optionalConnected: 0,
    optionalTotal: 1,
    canAnalyze: true,
    shopifyConnected: false,
  };

  return { ...defaults, ...overrides };
}

/**
 * Create mock Composio session for testing
 */
export function createMockComposioSession(connectedToolkits: string[] = []) {
  return {
    tools: vi.fn().mockResolvedValue({
      COMPOSIO_SEARCH_TOOLS: {},
      COMPOSIO_MULTI_EXECUTE_TOOL: {},
    }),
    toolkits: vi.fn().mockResolvedValue({
      items: [
        {
          slug: "junglescout",
          connection: connectedToolkits.includes("junglescout")
            ? { connectedAccount: "account-1" }
            : undefined,
        },
        {
          slug: "semrush",
          connection: connectedToolkits.includes("semrush")
            ? { connectedAccount: "account-2" }
            : undefined,
        },
        {
          slug: "shopify",
          connection: connectedToolkits.includes("shopify")
            ? { connectedAccount: "account-3" }
            : undefined,
        },
      ],
    }),
    authorize: vi.fn().mockImplementation((toolkit: string) =>
      Promise.resolve({
        redirectUrl: `https://composio.dev/auth/${toolkit}?user=test-user`,
        instructions: `Connect your ${toolkit} account`,
      })
    ),
  };
}

/**
 * Create mock agent response text for testing
 */
export function createMockAgentResponse(options: {
  revenue?: string;
  trend?: "up" | "down" | "stable";
  competitors?: string[];
  hasCaptcha?: boolean;
}): string {
  const {
    revenue = "$50,000/month",
    trend = "up",
    competitors = ["competitor1.com", "competitor2.com"],
    hasCaptcha = false,
  } = options;

  if (hasCaptcha) {
    return JSON.stringify({
      error: "CAPTCHA required",
      url: "https://geo.captcha-delivery.com/captcha",
      message: "Please enable JS and cookies",
    });
  }

  const trendText =
    trend === "up"
      ? "growing and trending upward"
      : trend === "down"
      ? "declining and trending downward"
      : "stable with consistent performance";

  const competitorList = competitors.map((c) => `- ${c}`).join("\n");

  return `
# Product Analysis Report

## Demand Validation
The product shows strong demand with estimated revenue of ${revenue}. The market is ${trendText}.

## Competitor Analysis
We found the following DTC competitors:
${competitorList}

## Recommendation
${
    trend === "up"
      ? "High demand validated. This is a strong opportunity for market entry."
      : trend === "down"
      ? "Low demand detected. Consider alternative products or market positioning."
      : "Medium demand. Proceed with caution and monitor market trends."
  }
  `.trim();
}
