import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.COMPOSIO_API_KEY = 'test-api-key'
process.env.DEFAULT_USER_ID = 'test-user-id'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks()
})
