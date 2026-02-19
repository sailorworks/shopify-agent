import { describe, it, expect, vi, beforeEach } from "vitest";

// Reset module state between tests
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("COMPOSIO_API_KEY", "test-composio-key");
});

describe("composio.ts - Library Function Tests", () => {
  describe("createUserSession()", () => {
    it("should create session with all toolkits", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        tools: vi.fn(),
        toolkits: vi.fn(),
        authorize: vi.fn(),
      });

      vi.doMock("@composio/core", () => ({
        Composio: vi.fn().mockImplementation(() => ({
          create: mockCreate,
        })),
      }));

      const { createUserSession } = await import("@/lib/composio");
      const result = await createUserSession("test-user-123");

      expect(result).toBeDefined();
      expect(mockCreate).toHaveBeenCalledWith("test-user-123", {
        toolkits: expect.arrayContaining(["junglescout", "semrush", "shopify"]),
        manageConnections: false,
      });
    });

    it("should create session with valid userId", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        tools: vi.fn(),
        toolkits: vi.fn(),
        authorize: vi.fn(),
      });

      vi.doMock("@composio/core", () => ({
        Composio: vi.fn().mockImplementation(() => ({
          create: mockCreate,
        })),
      }));

      const { createUserSession } = await import("@/lib/composio");
      await createUserSession("custom-user-id");

      expect(mockCreate).toHaveBeenCalledWith(
        "custom-user-id",
        expect.any(Object)
      );
    });
  });

  describe("getComposio()", () => {
    it("should throw if COMPOSIO_API_KEY is not set", async () => {
      vi.stubEnv("COMPOSIO_API_KEY", "");
      delete process.env.COMPOSIO_API_KEY;

      vi.doMock("@composio/core", () => ({
        Composio: vi.fn(),
      }));

      const { getComposio } = await import("@/lib/composio");
      expect(() => getComposio()).toThrow("COMPOSIO_API_KEY");
    });
  });
});
