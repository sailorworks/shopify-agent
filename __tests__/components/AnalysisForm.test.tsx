import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AnalysisForm } from '@/components/AnalysisForm'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('AnalysisForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  describe('Component Rendering', () => {
    it('should render form elements', () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      // Check for input field
      const input = screen.getByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i)
      expect(input).toBeInTheDocument()

      // Check for submit button
      const submitButton = screen.getByRole('button', { name: /Initialize Analysis/i })
      expect(submitButton).toBeInTheDocument()

      // Check for mode toggle buttons
      expect(screen.getByText(/Live Data/i)).toBeInTheDocument()
      expect(screen.getByText(/Demo Data/i)).toBeInTheDocument()
    })

    it('should render with Shopify connected state', () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={true}
        />
      )

      // Check for Shopify connected message
      expect(screen.getByText(/Shopify Connected/i)).toBeInTheDocument()
      expect(screen.getByText(/Full Analysis Mode/i)).toBeInTheDocument()
    })

    it('should render sample product buttons', () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      // Check for sample products
      expect(screen.getByRole('button', { name: /Clay Mask/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Snail Mucin/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Beetroot Scrub/i })).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid product name', async () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      const input = screen.getByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i)
      const submitButton = screen.getByRole('button', { name: /Initialize Analysis/i })

      // Enter product name
      fireEvent.change(input, { target: { value: 'Test Product' } })
      
      // Submit form
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        expect(mockOnSubmit).toHaveBeenCalledWith('Test Product', false) // false = useRealData by default
      })
    })

    it('should not submit form with empty product name', async () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Initialize Analysis/i })

      // Submit button should be disabled when input is empty
      expect(submitButton).toBeDisabled()

      // Try to submit anyway
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('should trim whitespace from product name', async () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      const input = screen.getByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i)
      const submitButton = screen.getByRole('button', { name: /Initialize Analysis/i })

      // Enter product name with whitespace
      fireEvent.change(input, { target: { value: '  Test Product  ' } })
      
      // Submit form
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test Product', false)
      })
    })

    it('should populate input when sample product button is clicked', () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      const input = screen.getByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i) as HTMLInputElement
      const sampleButton = screen.getByRole('button', { name: /Clay Mask/i })

      // Click sample product button
      fireEvent.click(sampleButton)

      // Input should be populated
      expect(input.value).toBe('Clay Mask')
    })
  })

  describe('Loading State', () => {
    it('should display loading state during analysis', () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={true}
          shopifyConnected={false}
        />
      )

      // Check for loading indicators
      expect(screen.getByText(/Analyzing:/i)).toBeInTheDocument()
      expect(screen.getByText(/Connecting to Jungle Scout/i)).toBeInTheDocument()
      
      // Form should not be visible
      expect(screen.queryByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i)).not.toBeInTheDocument()
    })

    it('should disable form elements during loading', () => {
      const { rerender } = render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      const input = screen.getByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i)
      const submitButton = screen.getByRole('button', { name: /Initialize Analysis/i })

      // Elements should be enabled initially
      expect(input).not.toBeDisabled()

      // Re-render with loading state
      rerender(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={true}
          shopifyConnected={false}
        />
      )

      // Form should be hidden during loading
      expect(screen.queryByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i)).not.toBeInTheDocument()
    })

    it('should show progress steps during loading', () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={true}
          shopifyConnected={false}
        />
      )

      // Check for analysis steps
      expect(screen.getByText(/Connecting to Jungle Scout/i)).toBeInTheDocument()
      expect(screen.getByText(/Fetching product sales estimates/i)).toBeInTheDocument()
      expect(screen.getByText(/Analyzing competitor keywords/i)).toBeInTheDocument()
      expect(screen.getByText(/Connecting to Semrush/i)).toBeInTheDocument()
      expect(screen.getByText(/Pulling SEO & traffic data/i)).toBeInTheDocument()
      expect(screen.getByText(/Generating insights/i)).toBeInTheDocument()
    })
  })

  describe('Mode Toggle', () => {
    it('should toggle between mock and real mode', async () => {
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      const liveDataButton = screen.getByText(/Live Data/i)
      const demoDataButton = screen.getByText(/Demo Data/i)
      const input = screen.getByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i)
      const submitButton = screen.getByRole('button', { name: /Initialize Analysis/i })

      // Enter product name
      fireEvent.change(input, { target: { value: 'Test Product' } })

      // Default should be real mode (Live Data)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test Product', false) // false = not mock mode
      })

      mockOnSubmit.mockClear()

      // Switch to demo mode
      fireEvent.click(demoDataButton)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test Product', true) // true = mock mode
      })

      mockOnSubmit.mockClear()

      // Switch back to live mode
      fireEvent.click(liveDataButton)
      fireEvent.click(submitButton)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test Product', false)
      })
    })
  })

  describe('Error Display', () => {
    it('should allow parent component to handle errors', async () => {
      // The component doesn't display errors itself - it delegates to parent
      // This test verifies the component can call onSubmit without crashing
      render(
        <AnalysisForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          shopifyConnected={false}
        />
      )

      const input = screen.getByPlaceholderText(/ENTER PRODUCT KEYWORD TO ANALYZE/i)
      const submitButton = screen.getByRole('button', { name: /Initialize Analysis/i })

      // Enter product name
      fireEvent.change(input, { target: { value: 'Test Product' } })
      
      // Submit form - component should call onSubmit
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })
})
