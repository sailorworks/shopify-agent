import { Composio } from "@composio/core";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { z } from "zod";
import { getUserId } from "@/lib/composio";
import { getSystemPrompt } from "@/lib/agent";

export const maxDuration = 120;

const rateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(userId: string) {
  const now = Date.now();
  const record = rateLimit.get(userId);

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimit.set(userId, { count: 1, lastReset: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

const chatRequestSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).min(1).max(100),
});

export async function POST(req: Request) {
  const userId = getUserId();

  if (!checkRateLimit(userId)) {
    return new Response("Too Many Requests", { status: 429 });
  }

  let client: Awaited<ReturnType<typeof experimental_createMCPClient>> | null =
    null;

  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response("Invalid request body", { status: 400 });
    }

    const { messages } = body;

    // Create per-user Composio session with MCP
    const composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
    });

    const toolSession = await composio.create(userId, {
      toolkits: ["junglescout", "semrush", "shopify"],
      manageConnections: false,
    });

    // Connect to the MCP server
    client = await experimental_createMCPClient({
      transport: {
        type: "http",
        url: toolSession.mcp.url,
        headers: toolSession.mcp.headers,
      },
    });

    const mcpTools = await client.tools();
    const coreMessages = await convertToModelMessages(messages, { tools: mcpTools as any });

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: coreMessages,
      system: getSystemPrompt(),
      tools: mcpTools as any,
      stopWhen: stepCountIs(15),
      onStepFinish: (step) => {
        if (step.toolCalls && step.toolCalls.length > 0) {
          step.toolCalls.forEach((tc: any) => {
            console.log(`[Tool call: ${tc.toolName}]`);
          });
        }
      },
      onFinish: async () => {
        await client?.close().catch(() => {});
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    await client?.close().catch(() => {});
    console.error("Chat API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
