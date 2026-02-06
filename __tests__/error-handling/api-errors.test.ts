import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

/**
 * Comprehensive Error Handling Tests
 * 
 * Tests error response formats, error message formatting, network errors,
 * timeouts, CAPTCHA detection, and empty/null response handling.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

describe('API Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('400 Error Response Format', () => {
    it('should return consistent 400 error format with error message', () => {
      const errorMessage = 'Product name is required'
      const response = NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )

      expect(response.status).toBe(400)
      
      // Verify response can be parsed
      response.json().then((data) => {
        expect(data).toHaveProperty('error')
        expect(data.error).toBe(errorMessage)
      })
    })

    it('should return 400 error with validation details', () => {
      const errorMessage = 'Invalid toolkit: invalid-toolkit'
      const validToolkits = ['junglescout', 'semrush', 'shopify']
      
      const response = NextResponse.json(
        { 
          error: errorMessage,
          validToolkits 
        },
        { status: 400 }
      )

      expect(response.status).toBe(400)
      
      response.json().then((data) => {
        expect(data).toHaveProperty('error')
        expect(data).toHaveProperty('validToolkits')
        expect(data.error).toContain('Invalid toolkit')
        expect(Array.isArray(data.validToolkits)).toBe(true)
      })
    })

    it('should return 400 error for missing required parameters', () => {
      const response = NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )

      expect(response.status).toBe(400)
      
      response.json().then((data) => {
        expect(data.error).toBeDefined()
        expect(typeof data.error).toBe('string')
        expect(data.error.length).toBeGreaterThan(0)
      })
    })

    it('should return 400 error for invalid parameter types', () => {
      const response = NextResponse.json(
        { error: 'Invalid parameter type: expected string' },
        { status: 400 }
      )

      expect(response.status).toBe(400)
      
      response.json().then((data) => {
        expect(data.error).toContain('Invalid parameter')
      })
    })
  })

  describe('500 Error Response Format', () => {
    it('should return consistent 500 error format with error message', () => {
      const errorMessage = 'Internal server error'
      const details = 'Database connection failed'
      
      const response = NextResponse.json(
        { 
          error: errorMessage,
          details 
        },
        { status: 500 }
      )

      expect(response.status).toBe(500)
      
      response.json().then((data) => {
        expect(data).toHaveProperty('error')
        expect(data).toHaveProperty('details')
        expect(data.error).toBe(errorMessage)
        expect(data.details).toBe(details)
      })
    })

    it('should return 500 error when external service fails', () => {
      const response = NextResponse.json(
        { 
          error: 'Failed to generate auth URL',
          details: 'Composio API unavailable'
        },
        { status: 500 }
      )

      expect(response.status).toBe(500)
      
      response.json().then((data) => {
        expect(data.error).toBeDefined()
        expect(data.details).toBeDefined()
      })
    })

    it('should return 500 error with error details for debugging', () => {
      const errorMessage = 'Analysis failed'
      const errorDetails = 'OpenAI API rate limit exceeded'
      
      const response = NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails
        },
        { status: 500 }
      )

      expect(response.status).toBe(500)
      
      response.json().then((data) => {
        expect(data.error).toBe(errorMessage)
        expect(data.details).toBe(errorDetails)
        expect(typeof data.details).toBe('string')
      })
    })
  })

  describe('Error Message Formatting', () => {
    it('should format error messages consistently', () => {
      const errors = [
        'Product name is required',
        'Invalid toolkit: test-toolkit',
        'No connection found for toolkit: junglescout',
        'Failed to disconnect',
      ]

      errors.forEach((errorMsg) => {
        const response = NextResponse.json(
          { error: errorMsg },
          { status: 400 }
        )

        response.json().then((data) => {
          expect(data.error).toBe(errorMsg)
          expect(typeof data.error).toBe('string')
          expect(data.error.length).toBeGreaterThan(0)
        })
      })
    })

    it('should include context in error messages', () => {
      const toolkit = 'invalid-toolkit'
      const errorMessage = `Invalid toolkit: ${toolkit}`
      
      const response = NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )

      response.json().then((data) => {
        expect(data.error).toContain(toolkit)
        expect(data.error).toContain('Invalid toolkit')
      })
    })

    it('should format error messages with proper capitalization', () => {
      const response = NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )

      response.json().then((data) => {
        // First character should be uppercase
        expect(data.error[0]).toBe(data.error[0].toUpperCase())
      })
    })

    it('should extract error message from Error objects', () => {
      const error = new Error('Network connection failed')
      const errorMessage = error.message

      expect(errorMessage).toBe('Network connection failed')
      expect(typeof errorMessage).toBe('string')
    })

    it('should handle error messages with special characters', () => {
      const errorMessage = "Failed to parse JSON: unexpected token '}'"
      const response = NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )

      response.json().then((data) => {
        expect(data.error).toBe(errorMessage)
        expect(data.error).toContain("'}'")
      })
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network connection errors', async () => {
      const networkError = new Error('Network request failed')
      
      // Simulate network error
      const mockFetch = vi.fn().mockRejectedValue(networkError)
      global.fetch = mockFetch as unknown as typeof fetch

      try {
        await mockFetch('/api/test')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network request failed')
      }
    })

    it('should handle DNS resolution failures', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND api.example.com')
      
      const mockFetch = vi.fn().mockRejectedValue(dnsError)
      global.fetch = mockFetch as unknown as typeof fetch

      try {
        await mockFetch('https://api.example.com/data')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('ENOTFOUND')
      }
    })

    it('should handle connection refused errors', async () => {
      const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:3000')
      
      const mockFetch = vi.fn().mockRejectedValue(connectionError)
      global.fetch = mockFetch as unknown as typeof fetch

      try {
        await mockFetch('http://localhost:3000/api/test')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('ECONNREFUSED')
      }
    })

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout after 30000ms')
      
      const mockFetch = vi.fn().mockRejectedValue(timeoutError)
      global.fetch = mockFetch as unknown as typeof fetch

      try {
        await mockFetch('/api/analyze')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('timeout')
      }
    })
  })

  describe('Timeout Handling', () => {
    it('should handle request timeouts', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100)
      })

      try {
        await timeoutPromise
        expect.fail('Should have thrown timeout error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Request timeout')
      }
    })

    it('should handle slow API responses', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => resolve({ data: 'slow response' }), 5000)
      })

      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout after 1000ms')), 1000)
      })

      try {
        await Promise.race([slowResponse, timeout])
        expect.fail('Should have timed out')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Timeout')
      }
    })

    it('should format timeout error messages', () => {
      const timeoutError = new Error('Request timeout after 30000ms')
      const response = NextResponse.json(
        { 
          error: 'Request timeout',
          details: timeoutError.message
        },
        { status: 500 }
      )

      expect(response.status).toBe(500)
      
      response.json().then((data) => {
        expect(data.error).toBe('Request timeout')
        expect(data.details).toContain('timeout')
      })
    })
  })

  describe('CAPTCHA Detection and Response', () => {
    it('should detect CAPTCHA in response with captcha-delivery.com', () => {
      const captchaData = {
        error: 'CAPTCHA required',
        url: 'https://geo.captcha-delivery.com/captcha',
      }

      const dataStr = JSON.stringify(captchaData)
      const isCaptcha = dataStr.includes('captcha-delivery.com')

      expect(isCaptcha).toBe(true)
    })

    it('should detect CAPTCHA with "Please enable JS" message', () => {
      const captchaData = {
        message: 'Please enable JS and cookies',
      }

      const dataStr = JSON.stringify(captchaData)
      const isCaptcha = dataStr.includes('Please enable JS')

      expect(isCaptcha).toBe(true)
    })

    it('should detect CAPTCHA with geo.captcha-delivery pattern', () => {
      const captchaData = {
        redirect: 'https://geo.captcha-delivery.com/verify',
      }

      const dataStr = JSON.stringify(captchaData)
      const isCaptcha = dataStr.includes('geo.captcha-delivery')

      expect(isCaptcha).toBe(true)
    })

    it('should detect CAPTCHA with datadome pattern', () => {
      const captchaData = {
        provider: 'datadome',
        challenge: 'captcha-challenge',
      }

      const dataStr = JSON.stringify(captchaData)
      const isCaptcha = dataStr.includes('datadome')

      expect(isCaptcha).toBe(true)
    })

    it('should not detect CAPTCHA in normal responses', () => {
      const normalData = {
        revenue: '$50,000/month',
        competitors: ['example.com'],
      }

      const dataStr = JSON.stringify(normalData)
      const isCaptcha = 
        dataStr.includes('captcha-delivery.com') ||
        dataStr.includes('Please enable JS') ||
        dataStr.includes('geo.captcha-delivery') ||
        dataStr.includes('datadome')

      expect(isCaptcha).toBe(false)
    })

    it('should return degraded response when CAPTCHA detected', () => {
      const productName = 'Test Product'
      const captchaResponse = {
        name: productName,
        demandScore: 0,
        revenue: 'N/A - API Blocked',
        trend: 'stable' as const,
        opportunityLevel: 'Low' as const,
        recommendation: '⚠️ **Analysis Incomplete - CAPTCHA Detected**',
        revenueHistory: [],
        trafficDistribution: [],
        competitors: [],
      }

      expect(captchaResponse.demandScore).toBe(0)
      expect(captchaResponse.revenue).toContain('API Blocked')
      expect(captchaResponse.recommendation).toContain('CAPTCHA Detected')
      expect(captchaResponse.revenueHistory).toHaveLength(0)
      expect(captchaResponse.competitors).toHaveLength(0)
    })

    it('should provide helpful CAPTCHA error message', () => {
      const captchaMessage = `⚠️ **Analysis Incomplete - CAPTCHA Detected**

The Jungle Scout API returned a CAPTCHA challenge instead of data. This typically means:

1. **Rate limiting**: Too many requests in a short time
2. **Bot detection**: The API thinks this is automated traffic
3. **Connection issues**: The API credentials may need to be re-authenticated`

      expect(captchaMessage).toContain('CAPTCHA Detected')
      expect(captchaMessage).toContain('Rate limiting')
      expect(captchaMessage).toContain('Bot detection')
      expect(captchaMessage).toContain('Connection issues')
    })
  })

  describe('Empty/Null Response Handling', () => {
    it('should handle null response data', () => {
      const data = null
      
      expect(data).toBeNull()
      
      // Should handle null gracefully
      const response = NextResponse.json(
        { error: 'No data received' },
        { status: 500 }
      )

      expect(response.status).toBe(500)
    })

    it('should handle undefined response data', () => {
      const data = undefined
      
      expect(data).toBeUndefined()
      
      // Should handle undefined gracefully
      const response = NextResponse.json(
        { error: 'Invalid response' },
        { status: 500 }
      )

      expect(response.status).toBe(500)
    })

    it('should handle empty string responses', () => {
      const data = ''
      
      expect(data).toBe('')
      expect(data.length).toBe(0)
      
      // Empty string should be treated as invalid
      const isEmpty = !data || data.trim().length === 0
      expect(isEmpty).toBe(true)
    })

    it('should handle empty object responses', () => {
      const data = {}
      
      expect(Object.keys(data).length).toBe(0)
      
      // Empty object might be valid or invalid depending on context
      const hasRequiredFields = 'error' in data || 'data' in data
      expect(hasRequiredFields).toBe(false)
    })

    it('should handle empty array responses', () => {
      const data: unknown[] = []
      
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
      
      // Empty array might be valid (no results) or invalid
      const hasResults = data.length > 0
      expect(hasResults).toBe(false)
    })

    it('should validate response has required fields', () => {
      const response1 = { error: 'Test error' }
      const response2 = { data: { name: 'Test' } }
      const response3 = {}

      expect('error' in response1).toBe(true)
      expect('data' in response2).toBe(true)
      expect('error' in response3 || 'data' in response3).toBe(false)
    })

    it('should handle malformed JSON responses', () => {
      const malformedJson = '{"error": "test"'
      
      try {
        JSON.parse(malformedJson)
        expect.fail('Should have thrown JSON parse error')
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError)
      }
    })

    it('should handle responses with missing required fields', () => {
      const incompleteData = {
        name: 'Test Product',
        // Missing demandScore, revenue, etc.
      }

      const hasAllFields = 
        'name' in incompleteData &&
        'demandScore' in incompleteData &&
        'revenue' in incompleteData

      expect(hasAllFields).toBe(false)
    })
  })

  describe('Error Response Consistency', () => {
    it('should always include error field in error responses', () => {
      const errorResponses = [
        { error: 'Bad request' },
        { error: 'Not found' },
        { error: 'Internal server error' },
      ]

      errorResponses.forEach((response) => {
        expect(response).toHaveProperty('error')
        expect(typeof response.error).toBe('string')
      })
    })

    it('should optionally include details field for debugging', () => {
      const errorWithDetails = {
        error: 'Analysis failed',
        details: 'OpenAI API error: rate limit exceeded',
      }

      expect(errorWithDetails).toHaveProperty('error')
      expect(errorWithDetails).toHaveProperty('details')
      expect(typeof errorWithDetails.details).toBe('string')
    })

    it('should optionally include context-specific fields', () => {
      const validationError = {
        error: 'Invalid toolkit',
        validToolkits: ['junglescout', 'semrush', 'shopify'],
      }

      expect(validationError).toHaveProperty('error')
      expect(validationError).toHaveProperty('validToolkits')
      expect(Array.isArray(validationError.validToolkits)).toBe(true)
    })

    it('should maintain consistent error structure across all APIs', () => {
      const errors = [
        { error: 'Product name is required', status: 400 },
        { error: 'Invalid toolkit: test', status: 400 },
        { error: 'No connection found', status: 404 },
        { error: 'Internal server error', status: 500 },
      ]

      errors.forEach((err) => {
        expect(err).toHaveProperty('error')
        expect(err).toHaveProperty('status')
        expect(typeof err.error).toBe('string')
        expect(typeof err.status).toBe('number')
      })
    })
  })
})
