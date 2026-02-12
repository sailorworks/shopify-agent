"use client";

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Bot, User, Wrench } from "lucide-react";

interface UIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts?: Array<{
    type: string;
    text?: string;
    toolName?: string;
    state?: string;
    result?: unknown;
  }>;
}

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const parts = message.parts ?? [];

  // Extract tool calls from parts
  const toolCalls = parts.filter(
    (p) => p.type === "tool-invocation" || p.type === "tool-result"
  );

  // Get text content from parts or fallback to content
  const textContent =
    parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("") || message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : ""}`}>
        {/* Tool call indicators */}
        {toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {toolCalls.map((tc, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-md text-[10px] uppercase tracking-wider text-primary"
              >
                <Wrench className="w-3 h-3" />
                <span>
                  {tc.toolName?.replace("COMPOSIO_", "").replace(/_/g, " ") ??
                    "Tool"}
                </span>
                {tc.state === "call" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        {textContent && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-primary text-black"
                : "bg-card border border-border"
            }`}
          >
            {isUser ? (
              <p className="text-sm font-medium">{textContent}</p>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:text-sm [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:text-primary [&_a]:text-primary [&_code]:text-primary/80 [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:rounded [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_th]:border-border [&_td]:border-border">
                <ReactMarkdown>{textContent}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}
