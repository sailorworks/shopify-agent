import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createUserSession, getUserId } from "./composio";
import { MOCK_ANALYSIS_RESULTS, ProductData } from "./mock-data";

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Get system prompt with current date injected
function getSystemPrompt(): string {
  const today = new Date();
  
  // Jungle Scout API requires end_date to be at least 1 day ago (not today)
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Start date is 31 days ago (so we get 30 days of data ending yesterday)
  const thirtyOneDaysAgo = new Date(today);
  thirtyOneDaysAgo.setDate(today.getDate() - 31);
  
  const todayStr = formatDate(today);
  const endDateStr = formatDate(yesterday);       // Yesterday
  const startDateStr = formatDate(thirtyOneDaysAgo); // 31 days ago

  return `You are an E-commerce Competitive Intelligence Agent.
Your goal is to help the user identify high-potential products and discover their real competitors.

**CRITICAL: Today's date is ${todayStr}. Use this for all date calculations.**

Follow this strict workflow:

**Step 1: Extract "Seed" Keywords**
- Use the provided product name as the core keyword.
- Determine the appropriate product category based on the product name.
- Output: A core keyword (e.g., "Clay Mask") and its category.

**Step 2: Validate Demand (Jungle Scout)**
IMPORTANT: When calling Jungle Scout tools, you MUST include these required parameters:

For JUNGLESCOUT_QUERY_THE_PRODUCT_DATABASE:
- marketplace: "us" (required)
- categories: MUST be an array with EXACT names from this list (case-sensitive, use & not "and"):
  * "Beauty & Personal Care" - for skincare, cosmetics, clay masks
  * "Health & Household" - for supplements, wellness products
  * "Sports & Outdoors" - for fitness, outdoor gear
  * "Electronics" - for tech accessories, gadgets
  * "Home & Kitchen" - for home decor, kitchenware
  * "Clothing, Shoes & Jewelry" - for apparel, accessories
  * "Toys & Games" - for children's products, games
  * "Pet Supplies" - for pet products
  * "Baby" - for baby products
  * "Grocery & Gourmet Food" - for food items
- include_keywords: MUST be an array of keywords (e.g., ["Clay Mask"]) - NOT a string!
- page_size: 15 (REQUIRED - limits results to reduce token usage)
- min_revenue: 1000 (optional, filters low performers)

For JUNGLESCOUT_RETRIEVE_SALES_ESTIMATES_DATA:
- marketplace: "us" (required)
- asin: Extract the ASIN from the product database "id" field. 
  * The "id" field looks like "us/B09YRJ4GPB" 
  * You must use ONLY the part AFTER the slash: "B09YRJ4GPB"
  * DO NOT include "us/" prefix - just the ASIN like "B09YRJ4GPB"
- start_date: "${startDateStr}" (31 days ago - MUST use this exact date)
- end_date: "${endDateStr}" (yesterday - MUST use this exact date, NOT today)
- IMPORTANT: Only fetch sales estimates for the TOP 2 products by revenue (to minimize API calls)

Check: Does the top 2 average monthly revenue exceed $10,000?
Decision: If YES → Proceed to Step 3. If NO → Stop and report low demand.

**Step 3: Find "Real" Competitors (Semrush)**
If demand is validated, find real stores ranking for this keyword.

For SEMRUSH_GET_ORGANIC_RESULTS:
- phrase: The core keyword (e.g., "clay mask")
- database: "us" (for US market)

Filter out marketplaces: Amazon, Walmart, eBay, Target.
Focus on finding Direct-To-Consumer (DTC) store domains.

For SEMRUSH_GET_DOMAIN_ORGANIC_SEARCH_KEYWORDS:
- domain: The competitor domain (e.g., "glamglow.com")
- database: "us"

Determine: Where do they get traffic - Organic (SEO) or Paid (Ads)?

**Step 4: The Report**
Output a clear, actionable summary including:
- Demand validation result (revenue estimate from Jungle Scout)
- Top 3 DTC competitors found (excluding marketplaces)
- Their primary traffic source (Organic vs Paid)
- Strategic recommendation for the user

Be concise but thorough. Include specific numbers and actionable insights.

CRITICAL REMINDERS:
- Always specify "marketplace": "us" for Jungle Scout calls
- Always include "categories" for product database queries
- Never use placeholder values like "example_asin" - use real data from previous API responses
- For dates, ALWAYS use start_date="${startDateStr}" and end_date="${endDateStr}" (end_date must be yesterday, NOT today)
- If an API call fails, explain the issue and try an alternative approach`;
}

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
 * Check if a response contains a CAPTCHA challenge
 */
function isCaptchaResponse(data: unknown): boolean {
  if (!data) return false;
  const str = JSON.stringify(data);
  return (
    str.includes("captcha-delivery.com") ||
    str.includes("Please enable JS") ||
    str.includes("geo.captcha-delivery") ||
    str.includes("datadome")
  );
}

/**
 * Real analysis using Composio Tool Router
 */
async function runRealAnalysis(productName: string): Promise<ProductData> {
  const userId = getUserId();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Starting REAL analysis for: "${productName}"`);
  console.log(`📍 User ID: ${userId}`);
  console.log(`${"=".repeat(60)}\n`);

  // Create session and fetch tools
  console.log("📦 Creating Composio session...");
  const session = await createUserSession(userId);
  
  console.log("🔧 Fetching tools from session...");
  const tools = await session.tools();
  console.log(`✅ Loaded ${Object.keys(tools).length} tools`);
  console.log(`   Tools: ${Object.keys(tools).slice(0, 5).join(", ")}${Object.keys(tools).length > 5 ? "..." : ""}\n`);

  // Track CAPTCHA occurrences
  let captchaDetected = false;
  let captchaCount = 0;

  console.log("🤖 Starting AI agent with gpt-4o-mini...\n");

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: getSystemPrompt(),
    prompt: `Analyze the competitive landscape for: "${productName}"
    
Please follow the workflow strictly:
1. Validate demand using Jungle Scout
2. If demand is sufficient (>$10k/mo), find DTC competitors using Semrush
3. Provide a strategic recommendation`,
    tools,
    stopWhen: stepCountIs(15),
    onStepFinish: (step) => {
      console.log(`\n📍 Step completed:`);
      console.log(`   - Finish reason: ${step.finishReason}`);
      
      // Log tool calls
      if (step.toolCalls && step.toolCalls.length > 0) {
        console.log(`   - Tool calls: ${step.toolCalls.length}`);
        step.toolCalls.forEach((tc: { toolName: string; toolCallId: string }, idx: number) => {
          console.log(`     [${idx + 1}] ${tc.toolName} (id: ${tc.toolCallId})`);
        });
      } else {
        console.log(`   - Tool calls: NONE`);
      }

      // Log tool results and check for CAPTCHA
      if (step.toolResults && step.toolResults.length > 0) {
        console.log(`   - Tool results: ${step.toolResults.length}`);
        step.toolResults.forEach((tr: { toolName: string; toolCallId: string }, idx: number) => {
          console.log(`     [${idx + 1}] ${tr.toolName} (id: ${tr.toolCallId})`);
          
          // Check for CAPTCHA - convert entire result to string for checking
          if (isCaptchaResponse(tr)) {
            captchaDetected = true;
            captchaCount++;
            console.log(`\n⚠️  CAPTCHA DETECTED in response from ${tr.toolName}!`);
            console.log(`   This means the API request was blocked by bot protection.`);
          }
        });
      }

      // Log text response if any
      if (step.text) {
        console.log(`   - Text response: ${step.text.slice(0, 150)}...`);
      }
    },
  });

  // Final summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Agent completed with ${result.steps.length} steps`);
  console.log(`   - Total tool calls: ${result.steps.reduce((acc, s) => acc + (s.toolCalls?.length || 0), 0)}`);
  console.log(`   - Total tool results: ${result.steps.reduce((acc, s) => acc + (s.toolResults?.length || 0), 0)}`);
  console.log(`   - CAPTCHA detected: ${captchaDetected ? `YES (${captchaCount} times)` : "No"}`);
  console.log(`   - Final text length: ${result.text?.length || 0} chars`);
  console.log(`${"=".repeat(60)}\n`);

  // If CAPTCHA was detected, warn and provide degraded response
  if (captchaDetected) {
    console.log(`\n⚠️  WARNING: CAPTCHA was detected during analysis.`);
    console.log(`   The Jungle Scout API blocked requests due to bot protection.`);
    console.log(`   Returning partial/degraded results.\n`);
    
    return {
      name: productName,
      demandScore: 0,
      revenue: "N/A - API Blocked",
      trend: "stable",
      opportunityLevel: "Low",
      recommendation: `⚠️ **Analysis Incomplete - CAPTCHA Detected**\n\nThe Jungle Scout API returned a CAPTCHA challenge instead of data. This typically means:\n\n1. **Rate limiting**: Too many requests in a short time\n2. **Bot detection**: The API thinks this is automated traffic\n3. **Connection issues**: The API credentials may need to be re-authenticated\n\n**What the agent attempted:**\n${result.text || "No additional context available."}\n\n**Recommended actions:**\n- Wait a few minutes and try again\n- Check your Jungle Scout API credentials in Composio\n- Try with mock data mode to verify the rest of the system works`,
      revenueHistory: [],
      trafficDistribution: [],
      competitors: [],
    };
  }

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
