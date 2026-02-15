export interface ProductData {
  name: string;
  demandScore: number; // 0-100
  revenue: string;
  trend: 'up' | 'down' | 'stable';
  competitors: Competitor[];
  recommendation: string;
  opportunityLevel: 'Low' | 'Medium' | 'High';
  // Chart data fields
  revenueHistory: { month: string; value: number }[];
  trafficDistribution: { name: string; value: number }[];
}

export interface Competitor {
  domain: string;
  traffic: string;
  trafficSource: 'Organic (SEO)' | 'Paid (Ads)';
  topKeywords: string[];
}
