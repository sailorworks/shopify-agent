import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auth/[toolkit]/route'
import * as auth from '@/lib/auth'
import * as composio from '@/lib/composio'

// Mock the modules
vi.mock('@/lib/auth', () => ({
  getAuthUrl: vi.fn(),
}))

vi.mock('@/lib/composio', () => ({
  getUserId: vi.fn(),
  ALL_TOOLKITS: ['junglescout', 'semrush', 'shopify'],
}))

describe('GET /api/auth/[toolkit]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(composio.getUserId).mockReturnValue('test-user-id')
  })

  it('should return auth URL for junglescout toolkit', async () => {
    const mockAuthUrl = 'https://composio.dev/auth/junglescout?token=abc123'
    vi.mocked(auth.getAuthUrl).mockResolvedValue(mockAuthUrl)

    const params = Promise.resolve({ toolkit: 'junglescout' })
    const request = {} as Request

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(auth.getAuthUrl).toHaveBeenCalledWith('test-user-id', 'junglescout')
    expect(data.toolkit).toBe('junglescout')
    expect(data.authUrl).toBe(mockAuthUrl)
    expect(data.instructions).toContain('junglescout')
  })

  it('should return auth URL for semrush toolkit', async () => {
    const mockAuthUrl = 'https://composio.dev/auth/semrush?token=xyz789'
    vi.mocked(auth.getAuthUrl).mockResolvedValue(mockAuthUrl)

    const params = Promise.resolve({ toolkit: 'semrush' })
    const request = {} as Request

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(auth.getAuthUrl).toHaveBeenCalledWith('test-user-id', 'semrush')
    expect(data.toolkit).toBe('semrush')
    expect(data.authUrl).toBe(mockAuthUrl)
    expect(data.instructions).toContain('semrush')
  })

  it('should return auth URL for shopify toolkit', async () => {
    const mockAuthUrl = 'https://composio.dev/auth/shopify?token=def456'
    vi.mocked(auth.getAuthUrl).mockResolvedValue(mockAuthUrl)

    const params = Promise.resolve({ toolkit: 'shopify' })
    const request = {} as Request

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(auth.getAuthUrl).toHaveBeenCalledWith('test-user-id', 'shopify')
    expect(data.toolkit).toBe('shopify')
    expect(data.authUrl).toBe(mockAuthUrl)
    expect(data.instructions).toContain('shopify')
  })

  it('should return 400 error for invalid toolkit name', async () => {
    const params = Promise.resolve({ toolkit: 'invalid-toolkit' })
    const request = {} as Request

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid toolkit')
    expect(data.error).toContain('invalid-toolkit')
    expect(data.validToolkits).toEqual(['junglescout', 'semrush', 'shopify'])
    expect(auth.getAuthUrl).not.toHaveBeenCalled()
  })

  it('should return auth URL and instructions in response', async () => {
    const mockAuthUrl = 'https://composio.dev/auth/junglescout?token=test'
    vi.mocked(auth.getAuthUrl).mockResolvedValue(mockAuthUrl)

    const params = Promise.resolve({ toolkit: 'junglescout' })
    const request = {} as Request

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('authUrl')
    expect(data).toHaveProperty('instructions')
    expect(typeof data.authUrl).toBe('string')
    expect(typeof data.instructions).toBe('string')
    expect(data.authUrl).toBe(mockAuthUrl)
    expect(data.instructions.length).toBeGreaterThan(0)
  })

  it('should handle errors when getAuthUrl throws', async () => {
    const errorMessage = 'Failed to generate auth URL'
    vi.mocked(auth.getAuthUrl).mockRejectedValue(new Error(errorMessage))

    const params = Promise.resolve({ toolkit: 'junglescout' })
    const request = {} as Request

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate auth URL')
    expect(data.details).toBe(errorMessage)
  })

  it('should validate toolkit parameter before calling getAuthUrl', async () => {
    const params = Promise.resolve({ toolkit: 'unknown' })
    const request = {} as Request

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(auth.getAuthUrl).not.toHaveBeenCalled()
    expect(data.error).toBeDefined()
    expect(data.validToolkits).toBeDefined()
  })

  it('should use correct userId from getUserId', async () => {
    const mockAuthUrl = 'https://composio.dev/auth/shopify?token=test'
    vi.mocked(auth.getAuthUrl).mockResolvedValue(mockAuthUrl)
    vi.mocked(composio.getUserId).mockReturnValue('custom-user-456')

    const params = Promise.resolve({ toolkit: 'shopify' })
    const request = {} as Request

    await GET(request, { params })

    expect(composio.getUserId).toHaveBeenCalled()
    expect(auth.getAuthUrl).toHaveBeenCalledWith('custom-user-456', 'shopify')
  })
})
