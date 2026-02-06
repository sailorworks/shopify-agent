import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as analyzePost } from '@/app/api/analyze/route'
import { GET as connectionStatusGet } from '@/app/api/connection-status/route'
import { GET as authGet } from '@/app/api/auth/[toolkit]/route'
import { DELETE as disconnectDelete } from '@/app/api/disconnect/[toolkit]/route'
import * as agent from '@/lib/agent'
import * as auth from '@/lib/auth'
import * as composio from '@/lib/composio'
import { createMockProductData, createMockConnectionSummary, createMockComposioSession } from '../utils/factories'
import { assertValidProductData, assertValidConnectionSummary } from '../utils/helpers'

// Mock all external dependencies
vi.mock('@/lib/agent')
vi.mock('@/lib/auth')
vi.mock('@/lib/composio', async () => {
  const actual = await vi.importActual('@/lib/composio')
  return {
    ...actual,
    composio: {
      connectedAccounts: {
        list: vi.fn(),
        delete: vi.fn(),
      },
    },
    createUserSession: vi.fn(),
    getUserId: vi.fn(() => 'test-user-id'),
  }
})

describe('Integration Tests - Complete Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Workflow 1: Complete Product Analysis (form → API → display)', () => {
    it('should complete full product analysis workflow in mock mode', async () => {
      // Setup: Mock the analysis function
      const mockProductData = createMockProductData({
        name: 'Clay Mask',
        demandScore: 85,
        revenue: '$75,000/mo',
        trend: 'up',
        opportunityLevel: 'High',
        recommendation: 'Strong market opportunity detected',
      })
      vi.mocked(agent.analyzeProduct).mockResolvedValue(mockProductData)

      // Step 1: User submits form (simulated by API request)
      const request = {
        json: async () => ({ product: 'Clay Mask', useMockData: true }),
      } as Request

      // Step 2: API processes the request
      const response = await analyzePost(request)
      const data = await response.json()

      // Step 3: Verify response is valid for display
      expect(response.status).toBe(200)
      expect(agent.analyzeProduct).toHaveBeenCalledWith('Clay Mask', true)
      
      // Validate data structure for frontend display
      assertValidProductData(data)
      expect(data.name).toBe('Clay Mask')
      expect(data.demandScore).toBe(85)
      expect(data.revenue).toBe('$75,000/mo')
      expect(data.trend).toBe('up')
      expect(data.opportunityLevel).toBe('High')
      
      // Verify data can be displayed (has all required fields)
      expect(data.revenueHistory).toBeDefined()
      expect(data.trafficDistribution).toBeDefined()
      expect(data.competitors).toBeDefined()
    })

    it('should complete full product analysis workflow in real mode', async () => {
      // Setup: Mock the analysis function for real mode
      const mockProductData = createMockProductData({
        name: 'Snail Mucin',
        demandScore: 70,
        revenue: '$45,000/mo',
        trend: 'stable',
        opportunityLevel: 'Medium',
      })
      vi.mocked(agent.analyzeProduct).mockResolvedValue(mockProductData)

      // Step 1: User submits form with real mode
      const request = {
        json: async () => ({ product: 'Snail Mucin', useMockData: false }),
      } as Request

      // Step 2: API processes the request
      const response = await analyzePost(request)
      const data = await response.json()

      // Step 3: Verify response
      expect(response.status).toBe(200)
      expect(agent.analyzeProduct).toHaveBeenCalledWith('Snail Mucin', false)
      assertValidProductData(data)
      expect(data.name).toBe('Snail Mucin')
    })

    it('should handle analysis errors and propagate to frontend', async () => {
      // Setup: Mock an error in the analysis
      const errorMessage = 'API rate limit exceeded'
      vi.mocked(agent.analyzeProduct).mockRejectedValue(new Error(errorMessage))

      // Step 1: User submits form
      const request = {
        json: async () => ({ product: 'Test Product', useMockData: true }),
      } as Request

      // Step 2: API handles the error
      const response = await analyzePost(request)
      const data = await response.json()

      // Step 3: Verify error is properly formatted for frontend
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.details).toBe(errorMessage)
    })
  })

  describe('Workflow 2: Connection Status Check', () => {
    it('should check connection status and return summary', async () => {
      // Setup: Mock connection status
      const mockSummary = createMockConnectionSummary({
        requiredConnected: 2,
        requiredTotal: 2,
        canAnalyze: true,
        shopifyConnected: false,
      })
      vi.mocked(auth.getConnectionStatus).mockResolvedValue(mockSummary)
      vi.mocked(composio.getUserId).mockReturnValue('test-user-123')

      // Step 1: Frontend requests connection status
      const response = await connectionStatusGet()
      const data = await response.json()

      // Step 2: Verify response structure
      expect(response.status).toBe(200)
      expect(auth.getConnectionStatus).toHaveBeenCalledWith('test-user-123')
      
      // Step 3: Validate data for frontend display
      assertValidConnectionSummary(data)
      expect(data.userId).toBe('test-user-123')
      expect(data.canAnalyze).toBe(true)
      expect(data.requiredConnected).toBe(2)
      expect(data.requiredTotal).toBe(2)
      expect(data.shopifyConnected).toBe(false)
    })

    it('should handle connection status check errors', async () => {
      // Setup: Mock an error
      const errorMessage = 'Failed to fetch toolkits'
      vi.mocked(auth.getConnectionStatus).mockRejectedValue(new Error(errorMessage))

      // Step 1: Frontend requests connection status
      const response = await connectionStatusGet()
      const data = await response.json()

      // Step 2: Verify error response
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check connection status')
      expect(data.details).toBe(errorMessage)
    })

    it('should reflect when required toolkits are missing', async () => {
      // Setup: Mock partial connection status
      const mockSummary = createMockConnectionSummary({
        requiredConnected: 1,
        requiredTotal: 2,
        canAnalyze: false,
      })
      vi.mocked(auth.getConnectionStatus).mockResolvedValue(mockSummary)

      // Step 1: Check status
      const response = await connectionStatusGet()
      const data = await response.json()

      // Step 2: Verify canAnalyze is false
      expect(response.status).toBe(200)
      expect(data.canAnalyze).toBe(false)
      expect(data.requiredConnected).toBeLessThan(data.requiredTotal)
    })
  })

  describe('Workflow 3: Toolkit Authentication', () => {
    it('should complete toolkit authentication workflow for junglescout', async () => {
      // Setup: Mock auth URL generation
      const mockAuthUrl = 'https://composio.dev/auth/junglescout?user=test-user'
      vi.mocked(auth.getAuthUrl).mockResolvedValue(mockAuthUrl)
      vi.mocked(composio.getUserId).mockReturnValue('test-user-123')

      // Step 1: User clicks "Connect" button for junglescout
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'junglescout' })
      
      // Step 2: API generates auth URL
      const response = await authGet(request, { params })
      const data = await response.json()

      // Step 3: Verify auth URL is returned for redirect
      expect(response.status).toBe(200)
      expect(auth.getAuthUrl).toHaveBeenCalledWith('test-user-123', 'junglescout')
      expect(data.toolkit).toBe('junglescout')
      expect(data.authUrl).toBe(mockAuthUrl)
      expect(data.instructions).toContain('junglescout')
    })

    it('should complete toolkit authentication workflow for semrush', async () => {
      // Setup: Mock auth URL generation
      const mockAuthUrl = 'https://composio.dev/auth/semrush?user=test-user'
      vi.mocked(auth.getAuthUrl).mockResolvedValue(mockAuthUrl)

      // Step 1: User clicks "Connect" button for semrush
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'semrush' })
      
      // Step 2: API generates auth URL
      const response = await authGet(request, { params })
      const data = await response.json()

      // Step 3: Verify response
      expect(response.status).toBe(200)
      expect(data.toolkit).toBe('semrush')
      expect(data.authUrl).toBe(mockAuthUrl)
    })

    it('should complete toolkit authentication workflow for shopify', async () => {
      // Setup: Mock auth URL generation
      const mockAuthUrl = 'https://composio.dev/auth/shopify?user=test-user'
      vi.mocked(auth.getAuthUrl).mockResolvedValue(mockAuthUrl)

      // Step 1: User clicks "Connect" button for shopify
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'shopify' })
      
      // Step 2: API generates auth URL
      const response = await authGet(request, { params })
      const data = await response.json()

      // Step 3: Verify response
      expect(response.status).toBe(200)
      expect(data.toolkit).toBe('shopify')
      expect(data.authUrl).toBe(mockAuthUrl)
    })

    it('should reject invalid toolkit names', async () => {
      // Step 1: User attempts to connect invalid toolkit
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'invalid-toolkit' })
      
      // Step 2: API validates and rejects
      const response = await authGet(request, { params })
      const data = await response.json()

      // Step 3: Verify error response
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid toolkit')
      expect(data.validToolkits).toBeDefined()
      expect(auth.getAuthUrl).not.toHaveBeenCalled()
    })

    it('should handle auth URL generation errors', async () => {
      // Setup: Mock an error
      const errorMessage = 'Failed to create auth session'
      vi.mocked(auth.getAuthUrl).mockRejectedValue(new Error(errorMessage))

      // Step 1: User attempts to connect
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'junglescout' })
      
      // Step 2: API handles error
      const response = await authGet(request, { params })
      const data = await response.json()

      // Step 3: Verify error response
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate auth URL')
      expect(data.details).toBe(errorMessage)
    })
  })

  describe('Workflow 4: Toolkit Disconnection', () => {
    it('should complete toolkit disconnection workflow', async () => {
      // Setup: Mock connected account
      const mockAccount = {
        id: 'account-123',
        userId: 'test-user-123',
        toolkit: 'junglescout',
      }
      vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
        items: [mockAccount],
      } as any)
      vi.mocked(composio.composio.connectedAccounts.delete).mockResolvedValue(undefined as any)
      vi.mocked(composio.getUserId).mockReturnValue('test-user-123')

      // Step 1: User clicks "Disconnect" button
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'junglescout' })
      
      // Step 2: API processes disconnection
      const response = await disconnectDelete(request, { params })
      const data = await response.json()

      // Step 3: Verify disconnection succeeded
      expect(response.status).toBe(200)
      expect(composio.composio.connectedAccounts.list).toHaveBeenCalledWith({
        userIds: ['test-user-123'],
        toolkitSlugs: ['junglescout'],
      })
      expect(composio.composio.connectedAccounts.delete).toHaveBeenCalledWith('account-123')
      expect(data.success).toBe(true)
      expect(data.message).toContain('junglescout')
      expect(data.deletedAccountId).toBe('account-123')
    })

    it('should handle disconnection when no connection exists', async () => {
      // Setup: Mock no connected accounts
      vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
        items: [],
      } as any)

      // Step 1: User attempts to disconnect
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'semrush' })
      
      // Step 2: API checks and finds no connection
      const response = await disconnectDelete(request, { params })
      const data = await response.json()

      // Step 3: Verify 404 response
      expect(response.status).toBe(404)
      expect(data.error).toContain('No connection found')
      expect(composio.composio.connectedAccounts.delete).not.toHaveBeenCalled()
    })

    it('should reject invalid toolkit names for disconnection', async () => {
      // Step 1: User attempts to disconnect invalid toolkit
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'invalid-toolkit' })
      
      // Step 2: API validates and rejects
      const response = await disconnectDelete(request, { params })
      const data = await response.json()

      // Step 3: Verify error response
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid toolkit')
      expect(composio.composio.connectedAccounts.list).not.toHaveBeenCalled()
    })

    it('should handle disconnection errors', async () => {
      // Setup: Mock account exists but deletion fails
      const mockAccount = {
        id: 'account-456',
        userId: 'test-user-123',
        toolkit: 'shopify',
      }
      vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
        items: [mockAccount],
      } as any)
      const errorMessage = 'Failed to delete connection'
      vi.mocked(composio.composio.connectedAccounts.delete).mockRejectedValue(new Error(errorMessage))

      // Step 1: User attempts to disconnect
      const request = {} as Request
      const params = Promise.resolve({ toolkit: 'shopify' })
      
      // Step 2: API handles error
      const response = await disconnectDelete(request, { params })
      const data = await response.json()

      // Step 3: Verify error response
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to disconnect')
      expect(data.details).toBe(errorMessage)
    })
  })

  describe('Workflow 5: Error Propagation Through Stack', () => {
    it('should propagate validation errors from API to frontend', async () => {
      // Step 1: Invalid input at API layer
      const request = {
        json: async () => ({ product: '', useMockData: true }),
      } as Request

      // Step 2: API validates and rejects
      const response = await analyzePost(request)
      const data = await response.json()

      // Step 3: Error propagates to frontend
      expect(response.status).toBe(400)
      expect(data.error).toBe('Product name is required')
      expect(agent.analyzeProduct).not.toHaveBeenCalled()
    })

    it('should propagate library errors through API to frontend', async () => {
      // Setup: Error at library layer
      const libraryError = new Error('Composio session creation failed')
      vi.mocked(agent.analyzeProduct).mockRejectedValue(libraryError)

      // Step 1: Valid request
      const request = {
        json: async () => ({ product: 'Test Product', useMockData: false }),
      } as Request

      // Step 2: Library throws error
      const response = await analyzePost(request)
      const data = await response.json()

      // Step 3: Error propagates with details
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.details).toBe('Composio session creation failed')
    })

    it('should propagate auth errors through connection status check', async () => {
      // Setup: Error at auth layer
      const authError = new Error('Invalid API key')
      vi.mocked(auth.getConnectionStatus).mockRejectedValue(authError)

      // Step 1: Request connection status
      const response = await connectionStatusGet()
      const data = await response.json()

      // Step 2: Error propagates
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check connection status')
      expect(data.details).toBe('Invalid API key')
    })
  })

  describe('Workflow 6: Data Transformation Through Multiple Layers', () => {
    it('should transform data correctly from library to API to frontend', async () => {
      // Step 1: Library returns raw analysis data
      const libraryData = createMockProductData({
        name: 'Test Product',
        demandScore: 90,
        revenue: '$100,000/mo',
        trend: 'up',
        opportunityLevel: 'High',
        competitors: [
          {
            domain: 'competitor1.com',
            traffic: '500k/mo',
            trafficSource: 'Organic (SEO)',
            topKeywords: ['keyword1', 'keyword2'],
          },
        ],
        revenueHistory: [
          { month: 'Jan', value: 80000 },
          { month: 'Feb', value: 90000 },
          { month: 'Mar', value: 100000 },
        ],
        trafficDistribution: [
          { name: 'Organic SEO', value: 60 },
          { name: 'Paid Ads', value: 40 },
        ],
      })
      vi.mocked(agent.analyzeProduct).mockResolvedValue(libraryData)

      // Step 2: API receives and passes through
      const request = {
        json: async () => ({ product: 'Test Product', useMockData: true }),
      } as Request
      const response = await analyzePost(request)
      const apiData = await response.json()

      // Step 3: Verify data structure is preserved for frontend
      expect(apiData.name).toBe('Test Product')
      expect(apiData.demandScore).toBe(90)
      expect(apiData.revenue).toBe('$100,000/mo')
      expect(apiData.trend).toBe('up')
      expect(apiData.opportunityLevel).toBe('High')
      
      // Verify nested structures are intact
      expect(apiData.competitors).toHaveLength(1)
      expect(apiData.competitors[0].domain).toBe('competitor1.com')
      expect(apiData.competitors[0].topKeywords).toEqual(['keyword1', 'keyword2'])
      
      expect(apiData.revenueHistory).toHaveLength(3)
      expect(apiData.revenueHistory[2].value).toBe(100000)
      
      expect(apiData.trafficDistribution).toHaveLength(2)
      expect(apiData.trafficDistribution[0].value).toBe(60)
      
      // Validate complete structure
      assertValidProductData(apiData)
    })

    it('should transform connection data correctly through layers', async () => {
      // Step 1: Library returns connection summary
      const librarySummary = createMockConnectionSummary({
        status: [
          { toolkit: 'junglescout', connected: true, required: true },
          { toolkit: 'semrush', connected: true, required: true },
          { toolkit: 'shopify', connected: false, required: false },
        ],
        requiredConnected: 2,
        requiredTotal: 2,
        optionalConnected: 0,
        optionalTotal: 1,
        canAnalyze: true,
        shopifyConnected: false,
      })
      vi.mocked(auth.getConnectionStatus).mockResolvedValue(librarySummary)
      vi.mocked(composio.getUserId).mockReturnValue('user-456')

      // Step 2: API adds userId and passes through
      const response = await connectionStatusGet()
      const apiData = await response.json()

      // Step 3: Verify data transformation
      expect(apiData.userId).toBe('user-456')
      expect(apiData.status).toHaveLength(3)
      expect(apiData.requiredConnected).toBe(2)
      expect(apiData.canAnalyze).toBe(true)
      
      // Verify nested status array
      const jsStatus = apiData.status.find((s: any) => s.toolkit === 'junglescout')
      expect(jsStatus.connected).toBe(true)
      expect(jsStatus.required).toBe(true)
      
      // Validate complete structure
      assertValidConnectionSummary(apiData)
    })

    it('should preserve error details through transformation layers', async () => {
      // Step 1: Deep error with context
      const deepError = new Error('Network timeout after 30s')
      deepError.cause = new Error('Connection refused')
      vi.mocked(agent.analyzeProduct).mockRejectedValue(deepError)

      // Step 2: API transforms error
      const request = {
        json: async () => ({ product: 'Test', useMockData: false }),
      } as Request
      const response = await analyzePost(request)
      const data = await response.json()

      // Step 3: Verify error details are preserved
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.details).toBe('Network timeout after 30s')
    })
  })

  describe('Workflow 7: Multi-Step Integration Scenarios', () => {
    it('should handle complete user journey: check status → connect → analyze', async () => {
      // Step 1: User checks connection status (not connected)
      const initialSummary = createMockConnectionSummary({
        canAnalyze: false,
        requiredConnected: 0,
        requiredTotal: 2,
      })
      vi.mocked(auth.getConnectionStatus).mockResolvedValue(initialSummary)
      
      const statusResponse1 = await connectionStatusGet()
      const statusData1 = await statusResponse1.json()
      expect(statusData1.canAnalyze).toBe(false)

      // Step 2: User connects required toolkits
      const authUrl = 'https://composio.dev/auth/junglescout'
      vi.mocked(auth.getAuthUrl).mockResolvedValue(authUrl)
      
      const authRequest = {} as Request
      const authParams = Promise.resolve({ toolkit: 'junglescout' })
      const authResponse = await authGet(authRequest, { params: authParams })
      const authData = await authResponse.json()
      expect(authData.authUrl).toBe(authUrl)

      // Step 3: User checks status again (now connected)
      const updatedSummary = createMockConnectionSummary({
        canAnalyze: true,
        requiredConnected: 2,
        requiredTotal: 2,
      })
      vi.mocked(auth.getConnectionStatus).mockResolvedValue(updatedSummary)
      
      const statusResponse2 = await connectionStatusGet()
      const statusData2 = await statusResponse2.json()
      expect(statusData2.canAnalyze).toBe(true)

      // Step 4: User runs analysis
      const productData = createMockProductData({ name: 'Final Product' })
      vi.mocked(agent.analyzeProduct).mockResolvedValue(productData)
      
      const analyzeRequest = {
        json: async () => ({ product: 'Final Product', useMockData: false }),
      } as Request
      const analyzeResponse = await analyzePost(analyzeRequest)
      const analyzeData = await analyzeResponse.json()
      
      expect(analyzeResponse.status).toBe(200)
      expect(analyzeData.name).toBe('Final Product')
      assertValidProductData(analyzeData)
    })

    it('should handle disconnect and reconnect workflow', async () => {
      // Step 1: Disconnect toolkit
      const mockAccount = {
        id: 'account-789',
        userId: 'test-user',
        toolkit: 'junglescout',
      }
      vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
        items: [mockAccount],
      } as any)
      vi.mocked(composio.composio.connectedAccounts.delete).mockResolvedValue(undefined as any)
      
      const disconnectRequest = {} as Request
      const disconnectParams = Promise.resolve({ toolkit: 'junglescout' })
      const disconnectResponse = await disconnectDelete(disconnectRequest, { params: disconnectParams })
      const disconnectData = await disconnectResponse.json()
      
      expect(disconnectData.success).toBe(true)

      // Step 2: Verify status shows disconnected
      const disconnectedSummary = createMockConnectionSummary({
        canAnalyze: false,
        requiredConnected: 1,
        requiredTotal: 2,
      })
      vi.mocked(auth.getConnectionStatus).mockResolvedValue(disconnectedSummary)
      
      const statusResponse = await connectionStatusGet()
      const statusData = await statusResponse.json()
      expect(statusData.canAnalyze).toBe(false)

      // Step 3: Reconnect toolkit
      const authUrl = 'https://composio.dev/auth/junglescout'
      vi.mocked(auth.getAuthUrl).mockResolvedValue(authUrl)
      
      const authRequest = {} as Request
      const authParams = Promise.resolve({ toolkit: 'junglescout' })
      const authResponse = await authGet(authRequest, { params: authParams })
      const authData = await authResponse.json()
      
      expect(authResponse.status).toBe(200)
      expect(authData.authUrl).toBe(authUrl)
    })
  })
})
