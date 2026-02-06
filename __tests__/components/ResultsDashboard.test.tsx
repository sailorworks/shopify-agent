import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { ProductData } from '@/lib/mock-data'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}))

// Mock the chart components
vi.mock('@/components/DashboardCharts', () => ({
  RevenueTrendChart: ({ data }: any) => (
    <div data-testid="revenue-chart">Revenue Chart: {data.length} data points</div>
  ),
  TrafficSourceChart: ({ data }: any) => (
    <div data-testid="traffic-chart">Traffic Chart: {data.length} data points</div>
  ),
}))

describe('ResultsDashboard', () => {
  const mockOnReset = vi.fn()

  const mockProductData: ProductData = {
    name: 'Test Product',
    demandScore: 85,
    revenue: '$50,000/mo',
    trend: 'up',
    opportunityLevel: 'High',
    recommendation: 'This is a test recommendation with strategic insights.',
    revenueHistory: [
      { month: 'Jan', value: 30000 },
      { month: 'Feb', value: 35000 },
      { month: 'Mar', value: 40000 },
    ],
    trafficDistribution: [
      { name: 'Paid Ads', value: 65 },
      { name: 'Organic', value: 35 },
    ],
    competitors: [
      {
        domain: 'competitor1.com',
        traffic: '100k/mo',
        trafficSource: 'Paid (Ads)',
        topKeywords: ['keyword1', 'keyword2', 'keyword3'],
      },
      {
        domain: 'competitor2.com',
        traffic: '200k/mo',
        trafficSource: 'Organic (SEO)',
        topKeywords: ['keyword4', 'keyword5'],
      },
    ],
  }

  describe('Component Rendering', () => {
    it('should render with valid ProductData', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Check for product name
      expect(screen.getByText(/Test Product/i)).toBeInTheDocument()

      // Check for back button
      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument()
    })

    it('should render all metric cards', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Check for metric labels
      expect(screen.getByText(/Demand Score/i)).toBeInTheDocument()
      expect(screen.getByText(/Est\. Revenue/i)).toBeInTheDocument()
      expect(screen.getByText(/Market Trend/i)).toBeInTheDocument()
      expect(screen.getByText(/Competitors/i)).toBeInTheDocument()
    })
  })

  describe('Demand Score and Opportunity Level', () => {
    it('should display demand score correctly', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Check for demand score value
      expect(screen.getByText('85/100')).toBeInTheDocument()
    })

    it('should display opportunity level with correct styling', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Check for opportunity level badge
      const badge = screen.getByText(/High Risk/i)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('border-green-600')
    })

    it('should display Medium opportunity level correctly', () => {
      const mediumData = { ...mockProductData, opportunityLevel: 'Medium' as const }
      render(<ResultsDashboard data={mediumData} onReset={mockOnReset} />)

      const badge = screen.getByText(/Medium Risk/i)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('border-yellow-600')
    })

    it('should display Low opportunity level correctly', () => {
      const lowData = { ...mockProductData, opportunityLevel: 'Low' as const }
      render(<ResultsDashboard data={lowData} onReset={mockOnReset} />)

      const badge = screen.getByText(/Low Risk/i)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('border-red-600')
    })

    it('should display revenue correctly', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      expect(screen.getByText('$50,000/mo')).toBeInTheDocument()
    })

    it('should display trend correctly', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Trend is displayed as uppercase in the component
      expect(screen.getByText(/up/i)).toBeInTheDocument()
    })
  })

  describe('Competitors List', () => {
    it('should display competitors list', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Check for competitor domains
      expect(screen.getByText('competitor1.com')).toBeInTheDocument()
      expect(screen.getByText('competitor2.com')).toBeInTheDocument()
    })

    it('should display competitor traffic', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      expect(screen.getByText('100k/mo')).toBeInTheDocument()
      expect(screen.getByText('200k/mo')).toBeInTheDocument()
    })

    it('should display competitor traffic sources', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      expect(screen.getByText('Paid (Ads)')).toBeInTheDocument()
      expect(screen.getByText('Organic (SEO)')).toBeInTheDocument()
    })

    it('should display competitor count', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Check for competitor count in the metric card
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should handle empty competitors list', () => {
      const noCompetitorsData = { ...mockProductData, competitors: [] }
      render(<ResultsDashboard data={noCompetitorsData} onReset={mockOnReset} />)

      // Should show 0 competitors
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Charts Display', () => {
    it('should display charts when data is available', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Check for chart components
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument()
      expect(screen.getByTestId('traffic-chart')).toBeInTheDocument()
    })

    it('should pass revenue history data to chart', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      const revenueChart = screen.getByTestId('revenue-chart')
      expect(revenueChart).toHaveTextContent('3 data points')
    })

    it('should pass traffic distribution data to chart', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      const trafficChart = screen.getByTestId('traffic-chart')
      expect(trafficChart).toHaveTextContent('2 data points')
    })

    it('should handle empty chart data', () => {
      const emptyChartData = {
        ...mockProductData,
        revenueHistory: [],
        trafficDistribution: [],
      }
      render(<ResultsDashboard data={emptyChartData} onReset={mockOnReset} />)

      const revenueChart = screen.getByTestId('revenue-chart')
      const trafficChart = screen.getByTestId('traffic-chart')

      expect(revenueChart).toHaveTextContent('0 data points')
      expect(trafficChart).toHaveTextContent('0 data points')
    })
  })

  describe('Strategic Insight', () => {
    it('should display recommendation text', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      expect(screen.getByText(/This is a test recommendation/i)).toBeInTheDocument()
    })

    it('should have expand/collapse functionality', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      // Initially should show "Expand"
      const expandButton = screen.getByRole('button', { name: /Expand/i })
      expect(expandButton).toBeInTheDocument()

      // Click to expand
      fireEvent.click(expandButton)

      // Should now show "Collapse"
      expect(screen.getByRole('button', { name: /Collapse/i })).toBeInTheDocument()
    })

    it('should handle empty recommendation', () => {
      const noRecommendationData = { ...mockProductData, recommendation: '' }
      render(<ResultsDashboard data={noRecommendationData} onReset={mockOnReset} />)

      // Should show fallback message
      expect(screen.getByText(/No strategic insights available/i)).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onReset when back button is clicked', () => {
      render(<ResultsDashboard data={mockProductData} onReset={mockOnReset} />)

      const backButton = screen.getByRole('button', { name: /Back/i })
      fireEvent.click(backButton)

      expect(mockOnReset).toHaveBeenCalledTimes(1)
    })
  })
})
