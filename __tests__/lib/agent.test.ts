import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI modules first
vi.mock("ai");
vi.mock("@ai-sdk/openai");

// Mock composio with a factory function
vi.mock("@/lib/composio", async () => {
  return {
    composio: {
      create: vi.fn(),
      connectedAccounts: {
        list: vi.fn().mockResolvedValue({ items: [] }),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    },
    createUserSession: vi.fn(),
    getUserId: vi.fn().mockReturnValue("test-user-id"),
    REQUIRED_TOOLKITS: ["junglescout", "semrush"],
    OPTIONAL_TOOLKITS: ["shopify"],
    ALL_TOOLKITS: ["junglescout", "semrush", "shopify"],
  };
});

// Now import after mocks are set up
import { analyzeProduct } from "@/lib/agent";
import { generateText } from "ai";
import { createUserSession } from "@/lib/composio";

describe("agent.test.ts - Library Function Tests", () => {
  const mockSession = {
    tools: vi.fn().mockResolvedValue({
      COMPOSIO_SEARCH_TOOLS: { description: "Search tools" },
      COMPOSIO_MULTI_EXECUTE_TOOL: { description: "Multi-execute tool" },
    }),
    toolkits: vi.fn().mockResolvedValue({
      items: [
        {
          slug: "junglescout",
          connection: { connectedAccount: "account-1" },
        },
        {
          slug: "semrush",
          connection: { connectedAccount: "account-2" },
        },
      ],
    }),
    authorize: vi.fn().mockResolvedValue({
      redirectUrl: "https://composio.dev/auth/test",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementations
    mockSession.tools.mockResolvedValue({
      COMPOSIO_SEARCH_TOOLS: { description: "Search tools" },
      COMPOSIO_MULTI_EXECUTE_TOOL: { description: "Multi-execute tool" },
    });
    // Setup the mock to return our session
    vi.mocked(createUserSession).mockResolvedValue(mockSession as any);
  });

  describe("analyzeProduct() in mock mode", () => {
    it("should return known product data for 'Clay Mask'", async () => {
      const result = await analyzeProduct("Clay Mask", true);

      expect(result.name).toBe("Clay Mask");
      expect(result.demandScore).toBe(85);
      expect(result.revenue).toBe("$52,000/mo");
      expect(result.trend).toBe("up");
      expect(result.opportunityLevel).toBe("High");
      expect(result.competitors).toHaveLength(3);
      expect(result.revenueHistory).toHaveLength(6);
    });

    it("should return known product data for 'Snail Mucin'", async () => {
      const result = await analyzeProduct("Snail Mucin", true);

      expect(result.name).toBe("Snail Mucin Serum");
      expect(result.demandScore).toBe(98);
      expect(result.revenue).toBe("$120,000/mo");
      expect(result.trend).toBe("up");
      expect(result.opportunityLevel).toBe("High");
    });

    it("should use fuzzy matching for partial product names", async () => {
      const result = await analyzeProduct("clay", true);

      expect(result.name).toBe("Clay Mask");
      expect(result.demandScore).toBe(85);
    });

    it("should return default response for unknown products", async () => {
      const result = await analyzeProduct("Unknown Product XYZ", true);

      expect(result.name).toBe("Unknown Product XYZ");
      expect(result.demandScore).toBe(50);
      expect(result.revenue).toBe("Unknown");
      expect(result.trend).toBe("stable");
      expect(result.opportunityLevel).toBe("Medium");
      expect(result.recommendation).toContain("limited for this keyword");
    });
  });

  describe("analyzeProduct() in real mode", () => {
    it("should call Composio and parse agent response", async () => {
      // Setup mock response
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: `# Product Analysis Report

## Demand Validation
The product shows strong demand with estimated revenue of $50,000/month. The market is growing and trending upward.

## Competitor Analysis
We found the following DTC competitors:
- competitor1.com
- competitor2.com

## Recommendation
High demand validated. This is a strong opportunity for market entry.`,
        steps: [
          {
            toolCalls: [],
            toolResults: [],
            finishReason: "stop",
          },
        ],
      } as any);

      const result = await analyzeProduct("Test Product", false);

      // Verify Composio was called
      expect(mockGenerateTextFn).toHaveBeenCalled();
      
      // Verify result structure
      expect(result.name).toBe("Test Product");
      expect(result).toHaveProperty("demandScore");
      expect(result).toHaveProperty("revenue");
      expect(result).toHaveProperty("trend");
      expect(result).toHaveProperty("opportunityLevel");
    });

    it("should handle CAPTCHA responses gracefully", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockImplementation(async (options: any) => {
        // Call onStepFinish with CAPTCHA in toolResults
        if (options.onStepFinish) {
          options.onStepFinish({
            toolResults: [
              {
                toolCallId: "1",
                toolName: "TEST",
                result: { url: "https://geo.captcha-delivery.com/captcha" },
              },
            ],
            finishReason: "stop",
          });
        }
        
        return {
          text: JSON.stringify({
            error: "CAPTCHA required",
            url: "https://geo.captcha-delivery.com/captcha",
          }),
          steps: [
            {
              toolResults: [
                {
                  toolCallId: "1",
                  toolName: "TEST",
                  result: { url: "https://geo.captcha-delivery.com/captcha" },
                },
              ],
              finishReason: "stop",
            },
          ],
        } as any;
      });

      const result = await analyzeProduct("Test Product", false);

      expect(result.name).toBe("Test Product");
      expect(result.revenue).toContain("API Blocked");
      expect(result.opportunityLevel).toBe("Low");
      expect(result.recommendation).toContain("CAPTCHA");
    });
  });

  describe("parseAgentResponse() - revenue extraction", () => {
    it("should extract revenue with /mo format", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "The product has revenue of $50,000/mo and is performing well.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.revenue).toMatch(/\$50,000/);
    });

    it("should extract revenue with k notation", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "Revenue is approximately $50k per month.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.revenue).toMatch(/\$50k/);
    });

    it("should handle missing revenue data", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "No revenue data available for this product.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.revenue).toBe("See analysis");
    });
  });

  describe("parseAgentResponse() - trend determination", () => {
    it("should detect upward trend from keywords", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "The market is growing and trending upward with increasing demand.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.trend).toBe("up");
    });

    it("should detect downward trend from keywords", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "The market is declining and falling with decreasing interest.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.trend).toBe("down");
    });

    it("should default to stable trend", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "The market shows consistent performance.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.trend).toBe("stable");
    });
  });

  describe("parseAgentResponse() - opportunity level", () => {
    it("should detect high opportunity from demand keywords", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "High demand validated with strong market potential.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.opportunityLevel).toBe("High");
      expect(result.demandScore).toBeGreaterThanOrEqual(80);
    });

    it("should detect low opportunity from demand keywords", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "Low demand detected with insufficient market size.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.opportunityLevel).toBe("Low");
      expect(result.demandScore).toBeLessThanOrEqual(30);
    });

    it("should default to medium opportunity", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "The market shows moderate potential.",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.opportunityLevel).toBe("Medium");
    });
  });

  describe("extractCompetitors()", () => {
    it("should find domain patterns in response", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "Top competitors include glamglow.com, kiehls.com, and innisfree.com",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.competitors.length).toBeGreaterThan(0);
      expect(result.competitors[0]).toHaveProperty("domain");
    });

    it("should filter out marketplace domains", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "Found on amazon.com, walmart.com, ebay.com, and competitor1.com",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      
      const domains = result.competitors.map(c => c.domain.toLowerCase());
      expect(domains).not.toContain("amazon.com");
      expect(domains).not.toContain("walmart.com");
      expect(domains).not.toContain("ebay.com");
    });

    it("should limit competitors to 3", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "Competitors: comp1.com, comp2.com, comp3.com, comp4.com, comp5.com",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.competitors.length).toBeLessThanOrEqual(3);
    });
  });

  describe("generateChartData()", () => {
    it("should generate revenue history data", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      
      // Mock both generateText calls (main analysis + chart data)
      let callCount = 0;
      mockGenerateTextFn.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            text: "Revenue is $50,000/month",
            steps: [],
          } as any;
        }
        return {
          text: JSON.stringify({
            revenueHistory: [
              { month: "Jan", value: 40000 },
              { month: "Feb", value: 45000 },
              { month: "Mar", value: 50000 },
            ],
            trafficDistribution: [
              { name: "Organic SEO", value: 50 },
              { name: "Paid Ads", value: 30 },
            ],
          }),
          steps: [],
        } as any;
      });

      const result = await analyzeProduct("Test", false);
      expect(result.revenueHistory).toBeDefined();
      expect(Array.isArray(result.revenueHistory)).toBe(true);
    });

    it("should handle chart data generation errors", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      
      let callCount = 0;
      mockGenerateTextFn.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            text: "Revenue data",
            steps: [],
          } as any;
        }
        // Second call returns invalid JSON
        return {
          text: "Invalid JSON response",
          steps: [],
        } as any;
      });

      const result = await analyzeProduct("Test", false);
      // Should fallback to empty arrays
      expect(result.revenueHistory).toEqual([]);
      expect(result.trafficDistribution).toEqual([]);
    });
  });

  describe("isCaptchaResponse()", () => {
    it("should detect captcha-delivery.com indicator", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockImplementation(async (options: any) => {
        if (options.onStepFinish) {
          options.onStepFinish({
            toolResults: [{
              toolCallId: "1",
              toolName: "TEST",
              result: { url: "https://geo.captcha-delivery.com/captcha" }
            }],
            finishReason: "stop"
          });
        }
        return {
          text: JSON.stringify({ url: "https://geo.captcha-delivery.com/captcha" }),
          steps: [{
            toolResults: [{
              toolCallId: "1",
              toolName: "TEST",
              result: { url: "https://geo.captcha-delivery.com/captcha" }
            }],
            finishReason: "stop"
          }],
        } as any;
      });

      const result = await analyzeProduct("Test", false);
      expect(result.recommendation).toContain("CAPTCHA");
    });

    it("should detect 'Please enable JS' indicator", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockImplementation(async (options: any) => {
        if (options.onStepFinish) {
          options.onStepFinish({
            toolResults: [{
              toolCallId: "1",
              toolName: "TEST",
              result: { message: "Please enable JS" }
            }],
            finishReason: "stop"
          });
        }
        return {
          text: "Please enable JS and cookies to continue",
          steps: [{
            toolResults: [{
              toolCallId: "1",
              toolName: "TEST",
              result: { message: "Please enable JS" }
            }],
            finishReason: "stop"
          }],
        } as any;
      });

      const result = await analyzeProduct("Test", false);
      expect(result.recommendation).toContain("CAPTCHA");
    });

    it("should detect datadome indicator", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockImplementation(async (options: any) => {
        if (options.onStepFinish) {
          options.onStepFinish({
            toolResults: [{
              toolCallId: "1",
              toolName: "TEST",
              result: { provider: "datadome" }
            }],
            finishReason: "stop"
          });
        }
        return {
          text: "Blocked by datadome protection",
          steps: [{
            toolResults: [{
              toolCallId: "1",
              toolName: "TEST",
              result: { provider: "datadome" }
            }],
            finishReason: "stop"
          }],
        } as any;
      });

      const result = await analyzeProduct("Test", false);
      expect(result.recommendation).toContain("CAPTCHA");
    });

    it("should return false for normal responses", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "Normal analysis response with valid data",
        steps: [],
      } as any);

      const result = await analyzeProduct("Test", false);
      expect(result.recommendation).not.toContain("CAPTCHA");
      expect(result.revenue).not.toContain("API Blocked");
    });
  });
});
