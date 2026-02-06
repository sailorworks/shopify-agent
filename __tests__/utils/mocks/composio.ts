import { vi } from "vitest";

/**
 * Mock Composio SDK for testing
 * This mock prevents actual API calls and provides configurable responses
 */

export interface MockToolkit {
  slug: string;
  connection?: {
    connectedAccount?: string;
  };
}

export interface MockConnectedAccount {
  id: string;
  userId: string;
  toolkit: string;
}

export interface MockComposioSession {
  tools: () => Promise<Record<string, unknown>>;
  toolkits: () => Promise<{ items: MockToolkit[] }>;
  authorize: (toolkit: string) => Promise<{ redirectUrl: string; instructions?: string }>;
}

/**
 * Create a mock Composio session with configurable toolkit states
 */
export function createMockSession(
  connectedToolkits: string[] = []
): MockComposioSession {
  return {
    tools: vi.fn().mockResolvedValue({
      COMPOSIO_SEARCH_TOOLS: { description: "Search tools" },
      COMPOSIO_MULTI_EXECUTE_TOOL: { description: "Multi-execute tool" },
      JUNGLESCOUT_QUERY_THE_PRODUCT_DATABASE: { description: "Query products" },
      JUNGLESCOUT_RETRIEVE_SALES_ESTIMATES_DATA: { description: "Get sales data" },
      SEMRUSH_ORGANIC_RESULTS: { description: "Get organic results" },
      SEMRUSH_DOMAIN_ORGANIC_SEARCH_KEYWORDS: { description: "Get domain keywords" },
    }),
    toolkits: vi.fn().mockResolvedValue({
      items: [
        {
          slug: "junglescout",
          connection: connectedToolkits.includes("junglescout")
            ? { connectedAccount: "js-account-123" }
            : undefined,
        },
        {
          slug: "semrush",
          connection: connectedToolkits.includes("semrush")
            ? { connectedAccount: "sr-account-456" }
            : undefined,
        },
        {
          slug: "shopify",
          connection: connectedToolkits.includes("shopify")
            ? { connectedAccount: "sh-account-789" }
            : undefined,
        },
      ],
    }),
    authorize: vi.fn().mockImplementation((toolkit: string) =>
      Promise.resolve({
        redirectUrl: `https://composio.dev/auth/${toolkit}?user=test-user`,
        instructions: `Please connect your ${toolkit} account to continue`,
      })
    ),
  };
}

/**
 * Mock connected accounts list
 */
export function createMockConnectedAccounts(
  accounts: MockConnectedAccount[] = []
) {
  return {
    list: vi.fn().mockResolvedValue({ items: accounts }),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockImplementation((id: string) => {
      const account = accounts.find((a) => a.id === id);
      return Promise.resolve(account || null);
    }),
  };
}

/**
 * Mock Composio class
 */
export class MockComposio {
  public connectedAccounts: ReturnType<typeof createMockConnectedAccounts>;
  private mockSession: MockComposioSession;

  constructor(
    config?: { apiKey?: string },
    connectedToolkits: string[] = [],
    connectedAccounts: MockConnectedAccount[] = []
  ) {
    this.mockSession = createMockSession(connectedToolkits);
    this.connectedAccounts = createMockConnectedAccounts(connectedAccounts);
  }

  create(userId: string, options?: { toolkits?: string[] }): Promise<MockComposioSession> {
    return Promise.resolve(this.mockSession);
  }
}

/**
 * Setup Composio mock for tests
 * Call this in your test setup or individual tests
 */
export function setupComposioMock(
  connectedToolkits: string[] = [],
  connectedAccounts: MockConnectedAccount[] = []
) {
  const mockComposio = new MockComposio({}, connectedToolkits, connectedAccounts);

  // Mock the @composio/core module
  vi.mock("@composio/core", () => ({
    Composio: vi.fn().mockImplementation(() => mockComposio),
  }));

  // Mock the @composio/vercel module
  vi.mock("@composio/vercel", () => ({
    VercelProvider: vi.fn().mockImplementation(() => ({})),
  }));

  return mockComposio;
}

/**
 * Reset all Composio mocks
 */
export function resetComposioMocks() {
  vi.clearAllMocks();
}
