import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the composio module
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
import { getConnectionStatus, getAuthUrl, canRunAnalysis } from "@/lib/auth";
import { createUserSession } from "@/lib/composio";

describe("auth.test.ts - Library Function Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getConnectionStatus()", () => {
    it("should return status with all toolkits connected", async () => {
      const mockSession = {
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
            {
              slug: "shopify",
              connection: { connectedAccount: "account-3" },
            },
          ],
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await getConnectionStatus("test-user");

      expect(result.status).toHaveLength(3);
      expect(result.requiredConnected).toBe(2);
      expect(result.requiredTotal).toBe(2);
      expect(result.optionalConnected).toBe(1);
      expect(result.optionalTotal).toBe(1);
      expect(result.canAnalyze).toBe(true);
      expect(result.shopifyConnected).toBe(true);
    });

    it("should return status with some toolkits disconnected", async () => {
      const mockSession = {
        toolkits: vi.fn().mockResolvedValue({
          items: [
            {
              slug: "junglescout",
              connection: { connectedAccount: "account-1" },
            },
            {
              slug: "semrush",
              connection: undefined, // Not connected
            },
            {
              slug: "shopify",
              connection: undefined, // Not connected
            },
          ],
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await getConnectionStatus("test-user");

      expect(result.requiredConnected).toBe(1);
      expect(result.requiredTotal).toBe(2);
      expect(result.optionalConnected).toBe(0);
      expect(result.optionalTotal).toBe(1);
      expect(result.canAnalyze).toBe(false);
      expect(result.shopifyConnected).toBe(false);
    });

    it("should return status with no toolkits connected", async () => {
      const mockSession = {
        toolkits: vi.fn().mockResolvedValue({
          items: [
            {
              slug: "junglescout",
              connection: undefined,
            },
            {
              slug: "semrush",
              connection: undefined,
            },
            {
              slug: "shopify",
              connection: undefined,
            },
          ],
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await getConnectionStatus("test-user");

      expect(result.requiredConnected).toBe(0);
      expect(result.requiredTotal).toBe(2);
      expect(result.optionalConnected).toBe(0);
      expect(result.optionalTotal).toBe(1);
      expect(result.canAnalyze).toBe(false);
      expect(result.shopifyConnected).toBe(false);
    });

    it("should calculate canAnalyze correctly when all required are connected", async () => {
      const mockSession = {
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
            {
              slug: "shopify",
              connection: undefined, // Optional not connected
            },
          ],
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await getConnectionStatus("test-user");

      expect(result.canAnalyze).toBe(true);
      expect(result.requiredConnected).toBe(2);
    });

    it("should identify shopifyConnected correctly", async () => {
      const mockSession = {
        toolkits: vi.fn().mockResolvedValue({
          items: [
            {
              slug: "junglescout",
              connection: undefined,
            },
            {
              slug: "semrush",
              connection: undefined,
            },
            {
              slug: "shopify",
              connection: { connectedAccount: "account-3" },
            },
          ],
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await getConnectionStatus("test-user");

      expect(result.shopifyConnected).toBe(true);
      expect(result.canAnalyze).toBe(false); // Required toolkits not connected
    });
  });

  describe("getAuthUrl()", () => {
    it("should return auth URL for junglescout", async () => {
      const mockSession = {
        authorize: vi.fn().mockResolvedValue({
          redirectUrl: "https://composio.dev/auth/junglescout?user=test-user",
          instructions: "Connect your Jungle Scout account",
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await getAuthUrl("test-user", "junglescout");

      expect(result).toBe("https://composio.dev/auth/junglescout?user=test-user");
      expect(mockSession.authorize).toHaveBeenCalledWith("junglescout");
    });

    it("should return auth URL for semrush", async () => {
      const mockSession = {
        authorize: vi.fn().mockResolvedValue({
          redirectUrl: "https://composio.dev/auth/semrush?user=test-user",
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await getAuthUrl("test-user", "semrush");

      expect(result).toBe("https://composio.dev/auth/semrush?user=test-user");
      expect(mockSession.authorize).toHaveBeenCalledWith("semrush");
    });

    it("should return auth URL for shopify", async () => {
      const mockSession = {
        authorize: vi.fn().mockResolvedValue({
          redirectUrl: "https://composio.dev/auth/shopify?user=test-user",
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await getAuthUrl("test-user", "shopify");

      expect(result).toBe("https://composio.dev/auth/shopify?user=test-user");
      expect(mockSession.authorize).toHaveBeenCalledWith("shopify");
    });

    it("should throw when redirectUrl is missing", async () => {
      const mockSession = {
        authorize: vi.fn().mockResolvedValue({
          redirectUrl: undefined,
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      await expect(getAuthUrl("test-user", "junglescout")).rejects.toThrow(
        "Failed to get auth URL for junglescout"
      );
    });
  });

  describe("canRunAnalysis()", () => {
    it("should return true when all required toolkits are connected", async () => {
      const mockSession = {
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
            {
              slug: "shopify",
              connection: undefined,
            },
          ],
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await canRunAnalysis("test-user");

      expect(result).toBe(true);
    });

    it("should return false when required toolkits are missing", async () => {
      const mockSession = {
        toolkits: vi.fn().mockResolvedValue({
          items: [
            {
              slug: "junglescout",
              connection: { connectedAccount: "account-1" },
            },
            {
              slug: "semrush",
              connection: undefined, // Missing required toolkit
            },
            {
              slug: "shopify",
              connection: { connectedAccount: "account-3" },
            },
          ],
        }),
      };

      vi.mocked(createUserSession).mockResolvedValue(mockSession as any);

      const result = await canRunAnalysis("test-user");

      expect(result).toBe(false);
    });
  });
});
