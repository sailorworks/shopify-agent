import { NextRequest, NextResponse } from "next/server";
import { analyzeProduct } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product } = body;

    if (!product) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // Call the agent (forcing mock mode for now)
    const result = await analyzeProduct(product, true);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
