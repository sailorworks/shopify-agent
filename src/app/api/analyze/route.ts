import { NextRequest, NextResponse } from "next/server";
import { analyzeProduct } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, useMockData = true } = body;

    if (!product) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Log mode for debugging
    console.log(
      `Analyzing "${product}" in ${useMockData ? "MOCK" : "REAL"} mode`
    );

    // Call the agent
    const result = await analyzeProduct(product, useMockData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
