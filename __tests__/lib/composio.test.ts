import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Composio SDK
vi.mock("@composio/core", () => ({
  Composio: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
  })),
}));

vi.mock("@composio/vercel", () => ({
  VercelProvider: vi.fn().mockImplementation(() => ({})),
}));

// Now import after mocks are set up
import { createUserSession, getUserId, composio } from "@/lib/composio";

describe("composio.test.ts - Library Function Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUserSession()", () => {
    it("should create session with all toolkits", async () => {
      const mockSession = {
        tools: vi.fn(),
        toolkits: vi.fn(),
        authorize: vi.fn(),
      };

      vi.mocked(composio.create).mockResolvedValue(mockSession as any);

      const result = await createUserSession("test-user-123");

      expect(composio.create).toHaveBeenCalledWith("test-user-123", {
        toolkits: ["junglescout", "semrush", "shopify"],
        manageConnections: false,
      });
      expect(result).toBe(mockSession);
    });

    it("should create session with valid userId", async () => {
      const mockSession = {
        tools: vi.fn(),
        toolkits: vi.fn(),
        authorize: vi.fn(),
      };

      vi.mocked(composio.create).mockResolvedValue(mockSession as any);

      const userId = "custom-user-id";
      const result = await createUserSession(userId);

      expect(composio.create).toHaveBeenCalledWith(userId, expect.any(Object));
      expect(result).toBe(mockSession);
    });

    it("should pass manageConnections as false", async () => {
      const mockSession = {
        tools: vi.fn(),
        toolkits: vi.fn(),
        authorize: vi.fn(),
      };

      vi.mocked(composio.create).mockResolvedValue(mockSession as any);

      await createUserSession("test-user");

      expect(composio.create).toHaveBeenCalledWith("test-user", {
        toolkits: expect.any(Array),
        manageConnections: false,
      });
    });
  });

  describe("getUserId()", () => {
    it("should return DEFAULT_USER_ID from env", () => {
      // The env var is set in setup.ts
      const result = getUserId();

      expect(result).toBe("test-user-id");
    });

    it("should return default when env var missing", () => {
      // Temporarily remove the env var
      const originalValue = process.env.DEFAULT_USER_ID;
      delete process.env.DEFAULT_USER_ID;

      const result = getUserId();

      expect(result).toBe("shopify_demo_user");

      // Restore the env var
      process.env.DEFAULT_USER_ID = originalValue;
    });
  });
});
