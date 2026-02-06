import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/analyze/route'
import * as agent from '@/lib/agent'
import { createMockProductData } from '../utils/factories'
import { assertValidProductData } from '../utils/helpers'

// Mock the agent module
vi.mock('@/lib/agent', () => ({
  analyzeProduct: vi.fn(),
}))

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should analyze product with valid product name in mock mode', async () => {
    const mockData = createMockProductData({ name: 'Clay Mask' })
    vi.mocked(agent.analyzeProduct).mockResolvedValue(mockData)

    const request = {
      json: async () => ({ product: 'Clay Mask', useMockData: true }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(agent.analyzeProduct).toHaveBeenCalledWith('Clay Mask', true)
    expect(response.status).toBe(200)
    expect(data.name).toBe('Clay Mask')
    assertValidProductData(data)
  })

  it('should analyze product with valid product name in real mode', async () => {
    const mockData = createMockProductData({ name: 'Snail Mucin' })
    vi.mocked(agent.analyzeProduct).mockResolvedValue(mockData)

    const request = {
      json: async () => ({ product: 'Snail Mucin', useMockData: false }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(agent.analyzeProduct).toHaveBeenCalledWith('Snail Mucin', false)
    expect(response.status).toBe(200)
    expect(data.name).toBe('Snail Mucin')
    assertValidProductData(data)
  })

  it('should return 400 error when product parameter is missing', async () => {
    const request = {
      json: async () => ({ useMockData: true }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Product name is required')
    expect(agent.analyzeProduct).not.toHaveBeenCalled()
  })

  it('should return 400 error when product is empty string', async () => {
    const request = {
      json: async () => ({ product: '', useMockData: true }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Product name is required')
    expect(agent.analyzeProduct).not.toHaveBeenCalled()
  })

  it('should handle errors when analyzeProduct throws', async () => {
    const errorMessage = 'Analysis failed due to network error'
    vi.mocked(agent.analyzeProduct).mockRejectedValue(new Error(errorMessage))

    const request = {
      json: async () => ({ product: 'Test Product', useMockData: true }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
    expect(data.details).toBe(errorMessage)
  })

  it('should validate response format matches ProductData structure', async () => {
    const mockData = createMockProductData({
      name: 'Test Product',
      demandScore: 75,
      revenue: '$50,000/month',
      trend: 'up',
      opportunityLevel: 'High',
    })
    vi.mocked(agent.analyzeProduct).mockResolvedValue(mockData)

    const request = {
      json: async () => ({ product: 'Test Product', useMockData: true }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    
    // Validate all required fields are present
    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('demandScore')
    expect(data).toHaveProperty('revenue')
    expect(data).toHaveProperty('trend')
    expect(data).toHaveProperty('opportunityLevel')
    expect(data).toHaveProperty('recommendation')
    expect(data).toHaveProperty('revenueHistory')
    expect(data).toHaveProperty('trafficDistribution')
    expect(data).toHaveProperty('competitors')
    
    // Validate types
    expect(typeof data.name).toBe('string')
    expect(typeof data.demandScore).toBe('number')
    expect(typeof data.revenue).toBe('string')
    expect(['up', 'down', 'stable']).toContain(data.trend)
    expect(['Low', 'Medium', 'High']).toContain(data.opportunityLevel)
    expect(Array.isArray(data.revenueHistory)).toBe(true)
    expect(Array.isArray(data.trafficDistribution)).toBe(true)
    expect(Array.isArray(data.competitors)).toBe(true)
    
    assertValidProductData(data)
  })

  it('should default to mock mode when useMockData is not provided', async () => {
    const mockData = createMockProductData({ name: 'Default Product' })
    vi.mocked(agent.analyzeProduct).mockResolvedValue(mockData)

    const request = {
      json: async () => ({ product: 'Default Product' }),
    } as Request

    const response = await POST(request)
    
    expect(agent.analyzeProduct).toHaveBeenCalledWith('Default Product', true)
    expect(response.status).toBe(200)
  })
})
