import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/connection-status/route'
import * as auth from '@/lib/auth'
import * as composio from '@/lib/composio'
import { createMockConnectionSummary } from '../utils/factories'
import { assertValidConnectionSummary } from '../utils/helpers'

// Mock the modules
vi.mock('@/lib/auth', () => ({
  getConnectionStatus: vi.fn(),
}))

vi.mock('@/lib/composio', () => ({
  getUserId: vi.fn(),
}))

describe('GET /api/connection-status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(composio.getUserId).mockReturnValue('test-user-id')
  })

  it('should return valid ConnectionSummary', async () => {
    const mockSummary = createMockConnectionSummary({
      canAnalyze: true,
      requiredConnected: 2,
      requiredTotal: 2,
    })
    vi.mocked(auth.getConnectionStatus).mockResolvedValue(mockSummary)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(auth.getConnectionStatus).toHaveBeenCalledWith('test-user-id')
    assertValidConnectionSummary(data)
  })

  it('should include userId in response', async () => {
    const mockSummary = createMockConnectionSummary()
    vi.mocked(auth.getConnectionStatus).mockResolvedValue(mockSummary)
    vi.mocked(composio.getUserId).mockReturnValue('custom-user-123')

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.userId).toBe('custom-user-123')
    expect(auth.getConnectionStatus).toHaveBeenCalledWith('custom-user-123')
  })

  it('should handle errors when getConnectionStatus throws', async () => {
    const errorMessage = 'Failed to fetch connection status'
    vi.mocked(auth.getConnectionStatus).mockRejectedValue(new Error(errorMessage))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to check connection status')
    expect(data.details).toBe(errorMessage)
  })

  it('should validate response format matches ConnectionSummary structure', async () => {
    const mockSummary = createMockConnectionSummary({
      canAnalyze: false,
      requiredConnected: 1,
      requiredTotal: 2,
      optionalConnected: 0,
      optionalTotal: 1,
      shopifyConnected: false,
    })
    vi.mocked(auth.getConnectionStatus).mockResolvedValue(mockSummary)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    
    // Validate all required fields are present
    expect(data).toHaveProperty('userId')
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('requiredConnected')
    expect(data).toHaveProperty('requiredTotal')
    expect(data).toHaveProperty('optionalConnected')
    expect(data).toHaveProperty('optionalTotal')
    expect(data).toHaveProperty('canAnalyze')
    expect(data).toHaveProperty('shopifyConnected')
    
    // Validate types
    expect(typeof data.userId).toBe('string')
    expect(Array.isArray(data.status)).toBe(true)
    expect(typeof data.requiredConnected).toBe('number')
    expect(typeof data.requiredTotal).toBe('number')
    expect(typeof data.optionalConnected).toBe('number')
    expect(typeof data.optionalTotal).toBe('number')
    expect(typeof data.canAnalyze).toBe('boolean')
    expect(typeof data.shopifyConnected).toBe('boolean')
    
    // Validate status array structure
    if (data.status.length > 0) {
      const statusItem = data.status[0]
      expect(statusItem).toHaveProperty('toolkit')
      expect(statusItem).toHaveProperty('connected')
      expect(statusItem).toHaveProperty('required')
      expect(typeof statusItem.toolkit).toBe('string')
      expect(typeof statusItem.connected).toBe('boolean')
      expect(typeof statusItem.required).toBe('boolean')
    }
    
    assertValidConnectionSummary(data)
  })

  it('should return correct connection summary when all toolkits connected', async () => {
    const mockSummary = createMockConnectionSummary({
      canAnalyze: true,
      requiredConnected: 2,
      requiredTotal: 2,
      optionalConnected: 1,
      optionalTotal: 1,
      shopifyConnected: true,
    })
    vi.mocked(auth.getConnectionStatus).mockResolvedValue(mockSummary)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.canAnalyze).toBe(true)
    expect(data.shopifyConnected).toBe(true)
    expect(data.requiredConnected).toBe(data.requiredTotal)
  })

  it('should return correct connection summary when no toolkits connected', async () => {
    const mockSummary = createMockConnectionSummary({
      canAnalyze: false,
      requiredConnected: 0,
      requiredTotal: 2,
      optionalConnected: 0,
      optionalTotal: 1,
      shopifyConnected: false,
    })
    vi.mocked(auth.getConnectionStatus).mockResolvedValue(mockSummary)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.canAnalyze).toBe(false)
    expect(data.shopifyConnected).toBe(false)
    expect(data.requiredConnected).toBe(0)
    expect(data.optionalConnected).toBe(0)
  })
})
