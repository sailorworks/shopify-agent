import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from '@/app/api/disconnect/[toolkit]/route'
import * as composio from '@/lib/composio'

// Mock the composio module
vi.mock('@/lib/composio', () => ({
  composio: {
    connectedAccounts: {
      list: vi.fn(),
      delete: vi.fn(),
    },
  },
  getUserId: vi.fn(),
  ALL_TOOLKITS: ['junglescout', 'semrush', 'shopify'],
}))

describe('DELETE /api/disconnect/[toolkit]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(composio.getUserId).mockReturnValue('test-user-id')
  })

  it('should successfully disconnect a connected account', async () => {
    const mockAccount = {
      id: 'account-123',
      userId: 'test-user-id',
      toolkit: 'junglescout',
    }
    
    vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
      items: [mockAccount],
    })
    vi.mocked(composio.composio.connectedAccounts.delete).mockResolvedValue(undefined)

    const params = Promise.resolve({ toolkit: 'junglescout' })
    const request = {} as Request

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(composio.composio.connectedAccounts.list).toHaveBeenCalledWith({
      userIds: ['test-user-id'],
      toolkitSlugs: ['junglescout'],
    })
    expect(composio.composio.connectedAccounts.delete).toHaveBeenCalledWith('account-123')
    expect(data.success).toBe(true)
    expect(data.message).toContain('junglescout')
    expect(data.deletedAccountId).toBe('account-123')
  })

  it('should return 404 error when no connection found', async () => {
    vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
      items: [],
    })

    const params = Promise.resolve({ toolkit: 'semrush' })
    const request = {} as Request

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('No connection found')
    expect(data.error).toContain('semrush')
    expect(composio.composio.connectedAccounts.delete).not.toHaveBeenCalled()
  })

  it('should return 400 error for invalid toolkit name', async () => {
    const params = Promise.resolve({ toolkit: 'invalid-toolkit' })
    const request = {} as Request

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid toolkit')
    expect(data.error).toContain('invalid-toolkit')
    expect(composio.composio.connectedAccounts.list).not.toHaveBeenCalled()
    expect(composio.composio.connectedAccounts.delete).not.toHaveBeenCalled()
  })

  it('should handle errors when composio.connectedAccounts.delete throws', async () => {
    const mockAccount = {
      id: 'account-456',
      userId: 'test-user-id',
      toolkit: 'shopify',
    }
    
    vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
      items: [mockAccount],
    })
    
    const errorMessage = 'Failed to delete connection'
    vi.mocked(composio.composio.connectedAccounts.delete).mockRejectedValue(
      new Error(errorMessage)
    )

    const params = Promise.resolve({ toolkit: 'shopify' })
    const request = {} as Request

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to disconnect')
    expect(data.details).toBe(errorMessage)
  })

  it('should validate toolkit before attempting disconnect', async () => {
    const params = Promise.resolve({ toolkit: 'not-a-toolkit' })
    const request = {} as Request

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(composio.composio.connectedAccounts.list).not.toHaveBeenCalled()
  })

  it('should use correct userId from getUserId', async () => {
    const mockAccount = {
      id: 'account-789',
      userId: 'custom-user-789',
      toolkit: 'junglescout',
    }
    
    vi.mocked(composio.getUserId).mockReturnValue('custom-user-789')
    vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
      items: [mockAccount],
    })
    vi.mocked(composio.composio.connectedAccounts.delete).mockResolvedValue(undefined)

    const params = Promise.resolve({ toolkit: 'junglescout' })
    const request = {} as Request

    await DELETE(request, { params })

    expect(composio.getUserId).toHaveBeenCalled()
    expect(composio.composio.connectedAccounts.list).toHaveBeenCalledWith({
      userIds: ['custom-user-789'],
      toolkitSlugs: ['junglescout'],
    })
  })

  it('should handle errors when composio.connectedAccounts.list throws', async () => {
    const errorMessage = 'Failed to list connected accounts'
    vi.mocked(composio.composio.connectedAccounts.list).mockRejectedValue(
      new Error(errorMessage)
    )

    const params = Promise.resolve({ toolkit: 'junglescout' })
    const request = {} as Request

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to disconnect')
    expect(data.details).toBe(errorMessage)
  })

  it('should successfully disconnect different toolkits', async () => {
    const toolkits = ['junglescout', 'semrush', 'shopify']
    
    for (const toolkit of toolkits) {
      vi.clearAllMocks()
      
      const mockAccount = {
        id: `account-${toolkit}`,
        userId: 'test-user-id',
        toolkit,
      }
      
      vi.mocked(composio.composio.connectedAccounts.list).mockResolvedValue({
        items: [mockAccount],
      })
      vi.mocked(composio.composio.connectedAccounts.delete).mockResolvedValue(undefined)

      const params = Promise.resolve({ toolkit })
      const request = {} as Request

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain(toolkit)
    }
  })
})
