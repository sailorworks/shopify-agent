import { vi } from "vitest";

/**
 * Mock Vercel AI SDK for testing
 * This mock prevents actual OpenAI API calls and provides configurable responses
 */

export interface MockToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface MockToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
}

export interface MockStep {
  toolCalls?: MockToolCall[];
  toolResults?: MockToolResult[];
  text?: string;
  finishReason?: string;
}

export interface MockGenerateTextResult {
  text: string;
  steps: MockStep[];
}

export interface MockGenerateTextOptions {
  model: unknown;
  system: string;
  prompt: string;
  tools?: Record<string, unknown>;
  stopWhen?: (step: number) => boolean;
  onStepFinish?: (step: MockStep) => void;
}

/**
 * Default mock response for generateText
 */
export function createDefaultMockResponse(
  customText?: string
): MockGenerateTextResult {
  return {
    text:
      customText ||
      `# Product Analysis Report

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
        toolCalls: [
          {
            toolCallId: "call-1",
            toolName: "COMPOSIO_SEARCH_TOOLS",
            args: { query: "junglescout product database" },
          },
        ],
        toolResults: [
          {
            toolCallId: "call-1",
            toolName: "COMPOSIO_SEARCH_TOOLS",
            result: { success: true, data: "mock data" },
          },
        ],
        finishReason: "tool-calls",
      },
      {
        text: "Analysis complete",
        finishReason: "stop",
      },
    ],
  };
}

/**
 * Create a mock response with CAPTCHA error
 */
export function createCaptchaMockResponse(): MockGenerateTextResult {
  return {
    text: JSON.stringify({
      error: "CAPTCHA required",
      url: "https://geo.captcha-delivery.com/captcha",
      message: "Please enable JS and cookies",
    }),
    steps: [
      {
        toolCalls: [
          {
            toolCallId: "call-1",
            toolName: "JUNGLESCOUT_QUERY_THE_PRODUCT_DATABASE",
            args: { marketplace: "us", categories: ["Beauty & Personal Care"] },
          },
        ],
        toolResults: [
          {
            toolCallId: "call-1",
            toolName: "JUNGLESCOUT_QUERY_THE_PRODUCT_DATABASE",
            result: {
              error: "CAPTCHA",
              url: "https://geo.captcha-delivery.com/captcha",
            },
          },
        ],
        finishReason: "stop",
      },
    ],
  };
}

/**
 * Create a multi-step mock response simulating agent execution
 */
export function createMultiStepMockResponse(
  steps: number = 3
): MockGenerateTextResult {
  const mockSteps: MockStep[] = [];

  for (let i = 0; i < steps - 1; i++) {
    mockSteps.push({
      toolCalls: [
        {
          toolCallId: `call-${i + 1}`,
          toolName: `MOCK_TOOL_${i + 1}`,
          args: { step: i + 1 },
        },
      ],
      toolResults: [
        {
          toolCallId: `call-${i + 1}`,
          toolName: `MOCK_TOOL_${i + 1}`,
          result: { success: true, step: i + 1 },
        },
      ],
      finishReason: "tool-calls",
    });
  }

  // Final step with text
  mockSteps.push({
    text: "Multi-step analysis complete",
    finishReason: "stop",
  });

  return {
    text: "Multi-step analysis complete",
    steps: mockSteps,
  };
}

/**
 * Mock generateText function
 */
export const mockGenerateText = vi.fn();

/**
 * Setup Vercel AI SDK mock for tests
 */
export function setupVercelAIMock(
  customResponse?: MockGenerateTextResult | ((options: MockGenerateTextOptions) => MockGenerateTextResult)
) {
  // Reset the mock
  mockGenerateText.mockReset();

  // Setup the mock implementation
  if (typeof customResponse === "function") {
    mockGenerateText.mockImplementation(async (options: MockGenerateTextOptions) => {
      const result = customResponse(options);
      // Call onStepFinish for each step if provided
      if (options.onStepFinish) {
        result.steps.forEach((step) => options.onStepFinish!(step));
      }
      return result;
    });
  } else {
    mockGenerateText.mockImplementation(async (options: MockGenerateTextOptions) => {
      const result = customResponse || createDefaultMockResponse();
      // Call onStepFinish for each step if provided
      if (options.onStepFinish) {
        result.steps.forEach((step) => options.onStepFinish!(step));
      }
      return result;
    });
  }

  // Mock the 'ai' module
  vi.mock("ai", () => ({
    generateText: mockGenerateText,
    stepCountIs: vi.fn((count: number) => () => false),
  }));

  // Mock the '@ai-sdk/openai' module
  vi.mock("@ai-sdk/openai", () => ({
    openai: vi.fn((model: string) => ({
      modelId: model,
      provider: "openai",
    })),
  }));

  return mockGenerateText;
}

/**
 * Reset all Vercel AI mocks
 */
export function resetVercelAIMocks() {
  mockGenerateText.mockReset();
  vi.clearAllMocks();
}

/**
 * Mock language model for testing
 */
export class MockLanguageModelV3 {
  modelId: string;
  provider: string;

  constructor(modelId: string = "gpt-4o-mini") {
    this.modelId = modelId;
    this.provider = "openai";
  }
}
