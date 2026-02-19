import { afterEach, vi } from "vitest";

// Keep tests deterministic and avoid accidental reliance on the real environment.
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("COMPOSIO_API_KEY", process.env.COMPOSIO_API_KEY ?? "test-composio-key");
vi.stubEnv("OPENAI_API_KEY", process.env.OPENAI_API_KEY ?? "test-openai-key");

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
