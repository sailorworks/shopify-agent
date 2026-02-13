import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI modules first
vi.mock("ai");
vi.mock("@ai-sdk/openai");

// Now import after mocks are set up
import { getSystemPrompt, parseAgentResponse } from "@/lib/agent";
import { generateText } from "ai";

describe("agent.ts - Library Function Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSystemPrompt()", () => {
    it("should contain today's date", () => {
      const prompt = getSystemPrompt();
      const today = new Date().toISOString().split("T")[0];
      expect(prompt).toContain(today);
    });

    it("should contain correct end_date (yesterday)", () => {
      const prompt = getSystemPrompt();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const endDateStr = yesterday.toISOString().split("T")[0];
      expect(prompt).toContain(endDateStr);
    });

    it("should contain correct start_date (31 days ago)", () => {
      const prompt = getSystemPrompt();
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      const startDateStr = thirtyOneDaysAgo.toISOString().split("T")[0];
      expect(prompt).toContain(startDateStr);
    });

    it("should contain critical workflow instructions", () => {
      const prompt = getSystemPrompt();
      expect(prompt).toContain("MANDATORY EXECUTION ORDER");
      expect(prompt).toContain("Jungle Scout");
      expect(prompt).toContain("Semrush");
      expect(prompt).toContain("COMPOSIO_SEARCH_TOOLS");
    });

    it("should forbid remote bash and workbench tools", () => {
      const prompt = getSystemPrompt();
      expect(prompt).toContain("NEVER use COMPOSIO_REMOTE_BASH_TOOL");
      expect(prompt).toContain("NEVER use COMPOSIO_REMOTE_WORKBENCH");
    });
  });

  describe("parseAgentResponse() - revenue extraction", () => {
    it("should extract revenue with /mo format", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [{ month: "Jan", value: 40000 }],
          trafficDistribution: [{ name: "Organic SEO", value: 50 }],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "The product has revenue of $50,000/mo and is performing well.",
        "Test Product",
        []
      );
      expect(result.revenue).toMatch(/\$50,000/);
    });

    it("should extract revenue with k notation", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "Revenue is approximately $50k per month.",
        "Test Product",
        []
      );
      expect(result.revenue).toMatch(/\$50k/);
    });

    it("should handle missing revenue data", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "No revenue data available for this product.",
        "Test Product",
        []
      );
      expect(result.revenue).toBe("See analysis");
    });
  });

  describe("parseAgentResponse() - trend determination", () => {
    it("should detect upward trend from keywords", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "The market is growing and trending upward with increasing demand.",
        "Test Product",
        []
      );
      expect(result.trend).toBe("up");
    });

    it("should detect downward trend from keywords", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "The market is declining and falling with decreasing interest.",
        "Test Product",
        []
      );
      expect(result.trend).toBe("down");
    });

    it("should default to stable trend", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "The market shows consistent performance.",
        "Test Product",
        []
      );
      expect(result.trend).toBe("stable");
    });
  });

  describe("parseAgentResponse() - opportunity level", () => {
    it("should detect high opportunity from demand keywords", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "High demand validated with strong market potential.",
        "Test Product",
        []
      );
      expect(result.opportunityLevel).toBe("High");
      expect(result.demandScore).toBeGreaterThanOrEqual(80);
    });

    it("should detect low opportunity from demand keywords", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "Low demand detected with insufficient market size.",
        "Test Product",
        []
      );
      expect(result.opportunityLevel).toBe("Low");
      expect(result.demandScore).toBeLessThanOrEqual(30);
    });

    it("should default to medium opportunity", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "The market shows moderate potential.",
        "Test Product",
        []
      );
      expect(result.opportunityLevel).toBe("Medium");
    });
  });

  describe("parseAgentResponse() - competitor extraction", () => {
    it("should find domain patterns in response", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "Top competitors include glamglow.com, kiehls.com, and innisfree.com",
        "Test Product",
        []
      );
      expect(result.competitors.length).toBeGreaterThan(0);
      expect(result.competitors[0]).toHaveProperty("domain");
    });

    it("should filter out marketplace domains", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "Found on amazon.com, walmart.com, ebay.com, and competitor1.com",
        "Test Product",
        []
      );

      const domains = result.competitors.map((c) => c.domain.toLowerCase());
      expect(domains).not.toContain("amazon.com");
      expect(domains).not.toContain("walmart.com");
      expect(domains).not.toContain("ebay.com");
    });

    it("should limit competitors to 3", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: JSON.stringify({
          revenueHistory: [],
          trafficDistribution: [],
        }),
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "Competitors: comp1.com, comp2.com, comp3.com, comp4.com, comp5.com",
        "Test Product",
        []
      );
      expect(result.competitors.length).toBeLessThanOrEqual(3);
    });
  });

  describe("parseAgentResponse() - chart data (generateChartData)", () => {
    it("should include revenueHistory and trafficDistribution from GPT", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
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
      } as any);

      const result = await parseAgentResponse(
        "Revenue is $50,000/month",
        "Test Product",
        []
      );

      expect(result.revenueHistory).toBeDefined();
      expect(Array.isArray(result.revenueHistory)).toBe(true);
      expect(result.revenueHistory.length).toBe(3);
      expect(result.trafficDistribution.length).toBe(2);
    });

    it("should fallback to empty arrays when GPT returns invalid JSON", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockResolvedValue({
        text: "Invalid JSON response - not parseable",
        steps: [],
      } as any);

      const result = await parseAgentResponse(
        "Revenue data here",
        "Test Product",
        []
      );

      expect(result.revenueHistory).toEqual([]);
      expect(result.trafficDistribution).toEqual([]);
    });

    it("should fallback to empty arrays when GPT call throws", async () => {
      const mockGenerateTextFn = vi.mocked(generateText);
      mockGenerateTextFn.mockRejectedValue(new Error("API Error"));

      const result = await parseAgentResponse(
        "Revenue data here",
        "Test Product",
        []
      );

      expect(result.revenueHistory).toEqual([]);
      expect(result.trafficDistribution).toEqual([]);
    });
  });
});
