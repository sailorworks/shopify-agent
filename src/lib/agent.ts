import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createUserSession, getUserId } from "./composio";
import { MOCK_ANALYSIS_RESULTS, ProductData } from "./mock-data";

// System prompt defining the agent's workflow
const SYSTEM_PROMPT = `You are an E-commerce Competitive Intelligence Agent.
Your goal is to help the user identify high-potential products and discover their real competitors.

Follow this strict workflow:

**Step 1: Extract "Seed" Keywords (Shopify)**
- Read product information from the user's Shopify store if available.
- Extract product tags and vendor to define the niche.
- If no Shopify data, use the provided product name as the core keyword.
- Output: A core keyword (e.g., "Clay Mask").

**Step 2: Validate Demand (Jungle Scout)**
- Search for the core keyword on Jungle Scout.
- Use JUNGLESCOUT_QUERY_THE_PRODUCT_DATABASE to find matching products.
- Use JUNGLESCOUT_RETRIEVE_SALES_ESTIMATES_DATA to get revenue numbers.
- Check: Does the top 10 average monthly revenue exceed $10,000?
- Decision: If YES → Proceed to Step 3. If NO → Stop and report low demand.

**Step 3: Find "Real" Competitors (Semrush)**
- If demand is validated, find real stores ranking for this keyword.
- Use SEMRUSH_GET_ORGANIC_RESULTS for the core keyword.
- Filter out marketplaces: Amazon, Walmart, eBay, Target.
- Focus on finding Direct-To-Consumer (DTC) store domains.
- Use SEMRUSH_GET_DOMAIN_ORGANIC_SEARCH_KEYWORDS on top competitors.
- Use SEMRUSH_GET_DOMAIN_PAID_SEARCH_KEYWORDS for their PPC strategy.
- Determine: Where do they get traffic - Organic (SEO) or Paid (Ads)?

**Step 4: The Report**
Output a clear, actionable summary including:
- Demand validation result (revenue estimate from Jungle Scout)
- Top 3 DTC competitors found (excluding marketplaces)
- Their primary traffic source (Organic vs Paid)
- Strategic recommendation for the user

Be concise but thorough. Include specific numbers and actionable insights.`;

/**
 * Analyze a product using either mock data or real Composio tools
 */
export async function analyzeProduct(
  productName: string,
  useMockData: boolean = true
): Promise<ProductData> {
  // MOCK MODE (Phase 1)
  if (useMockData) {
    return runMockAnalysis(productName);
  }

  // REAL AGENT MODE (Phase 2)
  return runRealAnalysis(productName);
}

/**
 * Mock analysis using predefined data
 */
async function runMockAnalysis(productName: string): Promise<ProductData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Fuzzy match against mock data
  const key = Object.keys(MOCK_ANALYSIS_RESULTS).find(
    (k) =>
      productName.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(productName.toLowerCase())
  );

  if (key) {
    return MOCK_ANALYSIS_RESULTS[key];
  }

  return getDefaultResponse(productName);
}

/**
 * Real analysis using Composio Tool Router
 */
async function runRealAnalysis(productName: string): Promise<ProductData> {
  const userId = getUserId();
  const session = await createUserSession(userId);
  const tools = await session.tools();

  const result = await generateText({
    model: openai("gpt-4-turbo"),
    system: SYSTEM_PROMPT,
    prompt: `Analyze the competitive landscape for: "${productName}"
    
Please follow the workflow strictly:
1. Validate demand using Jungle Scout
2. If demand is sufficient (>$10k/mo), find DTC competitors using Semrush
3. Provide a strategic recommendation`,
    tools,
    stopWhen: stepCountIs(15),
  });

  return parseAgentResponse(result.text, productName, result.steps);
}

/**
 * Parse the agent's text response into structured ProductData
 */
function parseAgentResponse(
  text: string,
  productName: string,
  steps: Array<{ toolCalls?: unknown[] }>
): ProductData {
  // Extract key metrics from the response using pattern matching
  const revenueMatch = text.match(/\$[\d,]+(?:k|K)?(?:\/mo|\/month)?/);
  const revenue = revenueMatch ? revenueMatch[0] : "See analysis";

  // Determine trend based on keywords in response
  let trend: "up" | "down" | "stable" = "stable";
  if (/growing|increasing|upward|trending up/i.test(text)) {
    trend = "up";
  } else if (/declining|decreasing|downward|falling/i.test(text)) {
    trend = "down";
  }

  // Determine opportunity level based on demand validation
  let opportunityLevel: "Low" | "Medium" | "High" = "Medium";
  let demandScore = 50;

  if (/high demand|strong demand|pass|validated/i.test(text)) {
    opportunityLevel = "High";
    demandScore = 80;
  } else if (/low demand|weak demand|fail|insufficient/i.test(text)) {
    opportunityLevel = "Low";
    demandScore = 25;
  }

  // Extract competitors mentioned in the response
  const competitors = extractCompetitors(text);

  // Log steps for debugging
  console.log(`Agent completed with ${steps.length} steps`);

  return {
    name: productName,
    demandScore,
    revenue,
    trend,
    opportunityLevel,
    recommendation: text,
    revenueHistory: [], // Real data would come from Jungle Scout historical API
    trafficDistribution: [], // Would need additional Semrush calls
    competitors,
  };
}

/**
 * Extract competitor information from agent response
 */
function extractCompetitors(text: string): ProductData["competitors"] {
  // Simple extraction - look for domain patterns
  const domainPattern = /([a-zA-Z0-9-]+\.com)/g;
  const domains = text.match(domainPattern) || [];

  // Filter out common non-competitor domains
  const excludedDomains = [
    "amazon.com",
    "walmart.com",
    "ebay.com",
    "target.com",
    "google.com",
  ];
  
  const uniqueDomains = Array.from(new Set(domains));
  const competitorDomains = uniqueDomains
    .filter((d) => !excludedDomains.includes(d.toLowerCase()))
    .slice(0, 3);

  return competitorDomains.map((domain) => ({
    domain,
    traffic: "See analysis",
    trafficSource: text.toLowerCase().includes(`${domain}.*paid|ads`)
      ? ("Paid (Ads)" as const)
      : ("Organic (SEO)" as const),
    topKeywords: [],
  }));
}

/**
 * Default response for unknown products
 */
function getDefaultResponse(productName: string): ProductData {
  return {
    name: productName,
    demandScore: 50,
    revenue: "Unknown",
    trend: "stable",
    opportunityLevel: "Medium",
    recommendation:
      "Analysis complete. Data limited for this keyword in demo mode. Try 'Clay Mask' or 'Snail Mucin'.",
    revenueHistory: [],
    trafficDistribution: [],
    competitors: [],
  };
}
