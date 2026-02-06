import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useConnections, ConnectionSummary } from '@/hooks/useConnections'

describe('useConnections', () => {
  const mockConnectionSummary: ConnectionSummary = {
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
  }

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Data Fetching', () => {
    it('should fetch connection status on mount', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockConnectionSummary,
      } as Response)

      const { result } = renderHook(() => useConnections())

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.connections).toBe(null)
      expect(result.current.error).toBe(null)

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Check that fetch was called
      expect(global.fetch).toHaveBeenCalledWith('/api/connection-status')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Check that data was set
      expect(result.current.connections).toEqual(mockConnectionSummary)
      expect(result.current.error).toBe(null)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      global.fetch = vi.fn().mockReturnValueOnce(fetchPromise)

      const { result } = renderHook(() => useConnections())

      // Should be loading initially
      expect(result.current.isLoading).toBe(true)
      expect(result.current.connections).toBe(null)

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockConnectionSummary,
      })

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.connections).toEqual(mockConnectionSummary)
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      const { result } = renderHook(() => useConnections())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch connection status')
      expect(result.current.connections).toBe(null)
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useConnections())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.connections).toBe(null)
    })

    it('should handle non-Error exceptions', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce('String error')

      const { result } = renderHook(() => useConnections())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Unknown error')
      expect(result.current.connections).toBe(null)
    })
  })

  describe('Refresh Functionality', () => {
    it('should refetch data when refresh is called', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConnectionSummary,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockConnectionSummary,
            requiredConnected: 1,
          }),
        } as Response)

      const { result } = renderHook(() => useConnections())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.connections?.requiredConnected).toBe(2)
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Call refresh
      await result.current.refresh()

      // Wait for refresh to complete
      await waitFor(() => {
        expect(result.current.connections?.requiredConnected).toBe(1)
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should set loading state during refresh', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConnectionSummary,
        } as Response)

      const { result } = renderHook(() => useConnections())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Setup second fetch with delay
      let resolveRefresh: (value: any) => void
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve
      })
      global.fetch = vi.fn().mockReturnValueOnce(refreshPromise)

      // Call refresh
      const refreshCall = result.current.refresh()

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve refresh
      resolveRefresh!({
        ok: true,
        json: async () => mockConnectionSummary,
      })

      await refreshCall

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should clear error on successful refresh', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConnectionSummary,
        } as Response)

      const { result } = renderHook(() => useConnections())

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      // Refresh should clear error
      await result.current.refresh()

      await waitFor(() => {
        expect(result.current.error).toBe(null)
        expect(result.current.connections).toEqual(mockConnectionSummary)
      })
    })
  })

  describe('getAuthUrl Functionality', () => {
    it('should call API and return auth URL', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConnectionSummary,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ authUrl: 'https://auth.example.com/junglescout' }),
        } as Response)

      const { result } = renderHook(() => useConnections())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Call getAuthUrl
      const authUrl = await result.current.getAuthUrl('junglescout')

      expect(authUrl).toBe('https://auth.example.com/junglescout')
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/junglescout')
    })

    it('should handle getAuthUrl errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConnectionSummary,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
        } as Response)

      const { result } = renderHook(() => useConnections())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Call getAuthUrl with error
      const authUrl = await result.current.getAuthUrl('invalid-toolkit')

      expect(authUrl).toBe(null)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle network errors in getAuthUrl', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConnectionSummary,
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useConnections())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Call getAuthUrl with network error
      const authUrl = await result.current.getAuthUrl('junglescout')

      expect(authUrl).toBe(null)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get auth URL:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should call getAuthUrl for different toolkits', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConnectionSummary,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ authUrl: 'https://auth.example.com/junglescout' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ authUrl: 'https://auth.example.com/semrush' }),
        } as Response)

      const { result } = renderHook(() => useConnections())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Call getAuthUrl for different toolkits
      const junglescoutUrl = await result.current.getAuthUrl('junglescout')
      const semrushUrl = await result.current.getAuthUrl('semrush')

      expect(junglescoutUrl).toBe('https://auth.example.com/junglescout')
      expect(semrushUrl).toBe('https://auth.example.com/semrush')
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/junglescout')
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/semrush')
    })
  })

  describe('Hook Stability', () => {
    it('should maintain stable function references', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConnectionSummary,
      } as Response)

      const { result, rerender } = renderHook(() => useConnections())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstRefresh = result.current.refresh
      const firstGetAuthUrl = result.current.getAuthUrl

      // Rerender the hook
      rerender()

      // Functions should be stable (same reference)
      expect(result.current.refresh).toBe(firstRefresh)
      expect(result.current.getAuthUrl).toBe(firstGetAuthUrl)
    })
  })
})
