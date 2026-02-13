import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/chat/route";
import { Composio } from "@composio/core";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { streamText, convertToModelMessages } from "ai";

// 1. Mock Composio
vi.mock("@composio/core", () => ({
  Composio: vi.fn(),
}));

// 2. Mock AI SDK
vi.mock("@ai-sdk/mcp", () => ({
  experimental_createMCPClient: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "openai-model"),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    streamText: vi.fn(),
    convertToModelMessages: vi.fn(),
  };
});

// 3. Mock internal modules
vi.mock("@/lib/composio", () => ({
  getUserId: vi.fn(() => "test-user-id"),
}));

vi.mock("@/lib/agent", () => ({
  getSystemPrompt: vi.fn(() => "You are a test agent."),
}));

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default happy-path mocks
    (Composio as any).mockImplementation(() => ({
      create: vi.fn().mockResolvedValue({
        mcp: {
          url: "http://mock-mcp-url",
          headers: { Authorization: "Bearer test" },
        },
      }),
    }));

    (experimental_createMCPClient as any).mockResolvedValue({
      tools: vi.fn().mockResolvedValue([{ name: "test-tool" }]),
      close: vi.fn().mockResolvedValue(undefined),
    });

    (streamText as any).mockReturnValue({
      toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response("Mock Stream")),
    });

    (convertToModelMessages as any).mockReturnValue([]);
  });

  it("should return 200 and a stream for a valid request", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Analyze clay mask" }],
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it("should return 400 for invalid request body (bad schema)", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [], // min(1) fails
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("should return 500 when request body is malformed JSON", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: "{ invalid-json: ",
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Internal Server Error");
  });

  it("should return 500 when Composio crashes", async () => {
    (Composio as any).mockImplementation(() => {
      throw new Error("Composio API Down");
    });

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Internal Server Error");
  });

  it("should return 500 when MCP client fails to connect", async () => {
    (experimental_createMCPClient as any).mockRejectedValue(
      new Error("MCP connection refused")
    );

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Internal Server Error");
  });

  it("should clean up MCP client on error", async () => {
    const mockClose = vi.fn().mockResolvedValue(undefined);

    (experimental_createMCPClient as any).mockResolvedValue({
      tools: vi.fn().mockRejectedValue(new Error("Tools fetch failed")),
      close: mockClose,
    });

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(mockClose).toHaveBeenCalled();
  });

  it("should return 429 Too Many Requests if rate limit exceeded", async () => {
    const reqBody = JSON.stringify({
      messages: [{ role: "user", content: "Hello" }],
    });

    // Call until we hit the rate limit (previous tests may have used some quota)
    let hitRateLimit = false;
    for (let i = 0; i < 20; i++) {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        body: reqBody,
      });
      const res = await POST(req);
      if (res.status === 429) {
        hitRateLimit = true;
        break;
      }
    }

    expect(hitRateLimit).toBe(true);
  });
});
