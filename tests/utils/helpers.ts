import type { ProductData } from "@/lib/mock-data";
import type { ConnectionSummary } from "@/lib/auth";
import { vi, expect } from "vitest";

/**
 * Assert that a response is an error with expected status and message
 */
export function assertErrorResponse(
  response: unknown,
  expectedStatus: number,
  expectedMessage?: string
): void {
  expect(response).toBeDefined();
  expect(typeof response).toBe("object");
  expect(response).not.toBeNull();

  const resp = response as { status: number; data: { error: string } };

  expect(resp.status).toBe(expectedStatus);
  expect(resp.data).toHaveProperty("error");

  if (expectedMessage) {
    expect(resp.data.error).toContain(expectedMessage);
  }
}

/**
 * Assert that data is valid ProductData
 */
export function assertValidProductData(data: unknown): asserts data is ProductData {
  expect(data).toBeDefined();
  expect(typeof data).toBe("object");
  expect(data).not.toBeNull();

  const product = data as ProductData;

  // Required string fields
  expect(typeof product.name).toBe("string");
  expect(product.name.length).toBeGreaterThan(0);
  expect(typeof product.revenue).toBe("string");
  expect(typeof product.recommendation).toBe("string");

  // Required number field
  expect(typeof product.demandScore).toBe("number");
  expect(product.demandScore).toBeGreaterThanOrEqual(0);
  expect(product.demandScore).toBeLessThanOrEqual(100);

  // Required enum fields
  expect(["up", "down", "stable"]).toContain(product.trend);
  expect(["Low", "Medium", "High"]).toContain(product.opportunityLevel);

  // Required array fields
  expect(Array.isArray(product.competitors)).toBe(true);
  expect(Array.isArray(product.revenueHistory)).toBe(true);
  expect(Array.isArray(product.trafficDistribution)).toBe(true);

  // Validate competitor structure if present
  if (product.competitors.length > 0) {
    const competitor = product.competitors[0];
    expect(typeof competitor.domain).toBe("string");
    expect(typeof competitor.traffic).toBe("string");
    expect(["Organic (SEO)", "Paid (Ads)"]).toContain(competitor.trafficSource);
    expect(Array.isArray(competitor.topKeywords)).toBe(true);
  }

  // Validate revenue history structure if present
  if (product.revenueHistory.length > 0) {
    const historyItem = product.revenueHistory[0];
    expect(typeof historyItem.month).toBe("string");
    expect(typeof historyItem.value).toBe("number");
  }

  // Validate traffic distribution structure if present
  if (product.trafficDistribution.length > 0) {
    const trafficItem = product.trafficDistribution[0];
    expect(typeof trafficItem.name).toBe("string");
    expect(typeof trafficItem.value).toBe("number");
  }
}

/**
 * Assert that data is valid ConnectionSummary
 */
export function assertValidConnectionSummary(
  data: unknown
): asserts data is ConnectionSummary {
  expect(data).toBeDefined();
  expect(typeof data).toBe("object");
  expect(data).not.toBeNull();

  const summary = data as ConnectionSummary;

  // Required array field
  expect(Array.isArray(summary.status)).toBe(true);
  expect(summary.status.length).toBeGreaterThan(0);

  // Validate status structure
  const status = summary.status[0];
  expect(typeof status.toolkit).toBe("string");
  expect(typeof status.connected).toBe("boolean");
  expect(typeof status.required).toBe("boolean");

  // Required number fields
  expect(typeof summary.requiredConnected).toBe("number");
  expect(typeof summary.requiredTotal).toBe("number");
  expect(typeof summary.optionalConnected).toBe("number");
  expect(typeof summary.optionalTotal).toBe("number");

  // Required boolean fields
  expect(typeof summary.canAnalyze).toBe("boolean");
  expect(typeof summary.shopifyConnected).toBe("boolean");

  // Logical validations
  expect(summary.requiredConnected).toBeLessThanOrEqual(summary.requiredTotal);
  expect(summary.optionalConnected).toBeLessThanOrEqual(summary.optionalTotal);
}

/**
 * Mock the global fetch API
 */
export function mockFetch(responses: Record<string, unknown>) {
  const mockFetchFn = vi.fn((url: string) => {
    const response = responses[url];
    if (!response) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => response,
    });
  });

  global.fetch = mockFetchFn as unknown as typeof fetch;

  return mockFetchFn;
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitFor(
  callback: () => void | Promise<void>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await callback();
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  // Final attempt
  await callback();
}

/**
 * Create a mock console to suppress logs during tests
 */
export function mockConsole() {
  const originalConsole = { ...console };

  const mockLog = vi.fn();
  const mockError = vi.fn();
  const mockWarn = vi.fn();
  const mockInfo = vi.fn();

  console.log = mockLog;
  console.error = mockError;
  console.warn = mockWarn;
  console.info = mockInfo;

  return {
    log: mockLog,
    error: mockError,
    warn: mockWarn,
    info: mockInfo,
    restore: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    },
  };
}

/**
 * Helper to create a delay for testing async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
  if (message) {
    expect(value, message).toBeTruthy();
  }
}

/**
 * Helper to extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}
