export interface ProductData {
  name: string;
  demandScore: number; // 0-100
  revenue: string;
  trend: 'up' | 'down' | 'stable';
  competitors: Competitor[];
  recommendation: string;
  opportunityLevel: 'Low' | 'Medium' | 'High';
  // New fields for charts
  revenueHistory: { month: string; value: number }[];
  trafficDistribution: { name: string; value: number }[];
}

export interface Competitor {
  domain: string;
  traffic: string;
  trafficSource: 'Organic (SEO)' | 'Paid (Ads)';
  topKeywords: string[];
}

export const MOCK_ANALYSIS_RESULTS: Record<string, ProductData> = {
  "Clay Mask": {
    name: "Clay Mask",
    demandScore: 85,
    revenue: "$52,000/mo",
    trend: "up",
    opportunityLevel: "High",
    recommendation: "Strong Amazon demand. Top competitors rely heavily on Google Ads. Focus your budget on PPC to capture high-intent traffic.",
    revenueHistory: [
      { month: 'Jan', value: 30000 },
      { month: 'Feb', value: 35000 },
      { month: 'Mar', value: 32000 },
      { month: 'Apr', value: 40000 },
      { month: 'May', value: 48000 },
      { month: 'Jun', value: 52000 },
    ],
    trafficDistribution: [
      { name: 'Paid Ads', value: 65 },
      { name: 'Organic', value: 20 },
      { name: 'Social', value: 10 },
      { name: 'Other', value: 5 },
    ],
    competitors: [
      {
        domain: "glamglow.com",
        traffic: "125k/mo",
        trafficSource: "Paid (Ads)",
        topKeywords: ["best clay mask", "glamglow sale", "pore cleanser"]
      },
      {
        domain: "kiehls.com",
        traffic: "850k/mo",
        trafficSource: "Organic (SEO)",
        topKeywords: ["face mask for men", "rare earth deep pore", "kiehls"]
      },
      {
        domain: "innisfree.com",
        traffic: "45k/mo",
        trafficSource: "Paid (Ads)",
        topKeywords: ["volcanic clay mask", "innisfree coupon"]
      }
    ]
  },
  "Beetroot Scrub": {
    name: "Beetroot Scrub",
    demandScore: 20,
    revenue: "$3,200/mo",
    trend: "down",
    opportunityLevel: "Low",
    recommendation: "Low demand verified on Amazon (<$5k/mo). The market saturation is high with low search volume. Recommend pivoting to a different niche or bundling.",
    revenueHistory: [
      { month: 'Jan', value: 4500 },
      { month: 'Feb', value: 4200 },
      { month: 'Mar', value: 3800 },
      { month: 'Apr', value: 3500 },
      { month: 'May', value: 3300 },
      { month: 'Jun', value: 3200 },
    ],
    trafficDistribution: [
      { name: 'Organic', value: 70 },
      { name: 'Social', value: 20 },
      { name: 'Paid Ads', value: 5 },
      { name: 'Other', value: 5 },
    ],
    competitors: [
      {
        domain: "generic-beauty.com",
        traffic: "5k/mo",
        trafficSource: "Organic (SEO)",
        topKeywords: ["beetroot benefits", "natural scrub"]
      }
    ]
  },
  "Snail Mucin": {
    name: "Snail Mucin Serum",
    demandScore: 98,
    revenue: "$120,000/mo",
    trend: "up",
    opportunityLevel: "High",
    recommendation: "Explosive trend (+200% YoY). High search volume with relatively few established DTC specialists outside of Cosrx. huge opportunity for branding.",
    revenueHistory: [
      { month: 'Jan', value: 50000 },
      { month: 'Feb', value: 65000 },
      { month: 'Mar', value: 80000 },
      { month: 'Apr', value: 95000 },
      { month: 'May', value: 110000 },
      { month: 'Jun', value: 120000 },
    ],
    trafficDistribution: [
      { name: 'Social', value: 55 },
      { name: 'Organic', value: 30 },
      { name: 'Paid Ads', value: 10 },
      { name: 'Other', value: 5 },
    ],
    competitors: [
      {
        domain: "cosrx.com",
        traffic: "2.5M/mo",
        trafficSource: "Organic (SEO)",
        topKeywords: ["snail 96", "korean skincare", "cosrx"]
      },
      {
        domain: "peachandlily.com",
        traffic: "450k/mo",
        trafficSource: "Paid (Ads)",
        topKeywords: ["glass skin serum", "best k-beauty"]
      }
    ]
  }
};
