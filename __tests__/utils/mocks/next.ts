/**
 * Mock Next.js request and response objects for testing API routes
 */

export interface MockNextRequestInit {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  method?: string;
  url?: string;
}

/**
 * Create a mock NextRequest object
 */
export function createMockNextRequest(init: MockNextRequestInit = {}) {
  const {
    body = {},
    headers = {},
    params = {},
    method = "GET",
    url = "http://localhost:3000/api/test",
  } = init;

  const headersMap = new Map(Object.entries(headers));

  return {
    json: async () => body,
    headers: headersMap,
    params,
    method,
    url,
    nextUrl: {
      pathname: new URL(url).pathname,
      searchParams: new URL(url).searchParams,
    },
  };
}

/**
 * Create a mock NextResponse object
 */
export function createMockNextResponse() {
  let responseData: unknown = null;
  let responseStatus = 200;
  let responseHeaders: Record<string, string> = {};

  const response = {
    json: (data: unknown, options?: { status?: number; headers?: Record<string, string> }) => {
      responseData = data;
      if (options?.status) {
        responseStatus = options.status;
      }
      if (options?.headers) {
        responseHeaders = { ...responseHeaders, ...options.headers };
      }
      return response;
    },
    status: (code: number) => {
      responseStatus = code;
      return response;
    },
    // Getters for assertions
    get data() {
      return responseData;
    },
    get statusCode() {
      return responseStatus;
    },
    get headers() {
      return responseHeaders;
    },
  };

  return response;
}

/**
 * Mock NextResponse.json static method
 */
export function mockNextResponseJson(
  data: unknown,
  options?: { status?: number; headers?: Record<string, string> }
) {
  return {
    data,
    status: options?.status || 200,
    headers: options?.headers || {},
    json: async () => data,
  };
}

/**
 * Setup Next.js mocks for tests
 */
export function setupNextMocks() {
  // Mock next/server module
  const NextResponse = {
    json: mockNextResponseJson,
  };

  return {
    NextRequest: createMockNextRequest,
    NextResponse,
  };
}

/**
 * Helper to extract response data from a NextResponse mock
 */
export function extractResponseData(response: ReturnType<typeof mockNextResponseJson>) {
  return {
    data: response.data,
    status: response.status,
    headers: response.headers,
  };
}

/**
 * Helper to create a mock request with JSON body
 */
export function createMockRequestWithBody(body: unknown, method: string = "POST") {
  return createMockNextRequest({
    body,
    method,
    headers: {
      "content-type": "application/json",
    },
  });
}

/**
 * Helper to create a mock request with URL params
 */
export function createMockRequestWithParams(
  params: Record<string, string>,
  method: string = "GET"
) {
  return createMockNextRequest({
    params,
    method,
  });
}
