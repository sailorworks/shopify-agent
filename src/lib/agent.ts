import { MOCK_ANALYSIS_RESULTS, ProductData } from "./mock-data";

// Lazy-initialized OpenAI client (only created when needed)
let openaiClient: any = null;

function getOpenAIClient() {
  if (!openaiClient) {
    // Dynamic import to avoid build-time errors
    const OpenAI = require("openai").default;
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export async function analyzeProduct(
  productName: string, 
  useMockData: boolean = true
): Promise<ProductData> {
  
  // 1. MOCK MODE (Phase 1)
  if (useMockData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simple fuzzy match or default
    const key = Object.keys(MOCK_ANALYSIS_RESULTS).find(k => 
      productName.toLowerCase().includes(k.toLowerCase()) || 
      k.toLowerCase().includes(productName.toLowerCase())
    );
    
    if (key) {
      return MOCK_ANALYSIS_RESULTS[key];
    }
    
    // Default fallback if no match found
    return {
      name: productName,
      demandScore: 50,
      revenue: "Unknown",
      trend: "stable",
      opportunityLevel: "Medium",
      recommendation: "Analysis complete. Data limited for this specific keyword in demo mode. Try 'Clay Mask' or 'Snail Mucin'.",
      revenueHistory: [],
      trafficDistribution: [],
      competitors: []
    };
  }

  // 2. REAL AGENT MODE (Phase 2 - Placeholder)
  // This is where we would use OpenAI + Composio Toolset
  // const openai = getOpenAIClient();
  // const tools = await composio.getTools({ apps: ["shopify", "junglescout", "semrush"] });
  // const response = await openai.chat.completions.create({ ... })
  
  throw new Error("Real agent mode not implemented yet");
}

