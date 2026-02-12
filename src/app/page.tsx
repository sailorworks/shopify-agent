"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { Onboarding } from "@/components/Onboarding";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { useConnections } from "@/hooks/useConnections";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ArrowLeft, LayoutDashboard, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/Hero";
import { ProductData } from "@/lib/mock-data";

type AppView = "hero" | "onboarding" | "chat" | "dashboard";

// Helper to extract text from UIMessage parts (newer @ai-sdk/react uses parts instead of content)
function getMessageText(message: any): string {
  if (message.content) return message.content;
  if (message.parts) {
    return message.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }
  return "";
}

export default function Home() {
  const { connections, isLoading: connectionsLoading, refresh } = useConnections();
  const [view, setView] = useState<AppView>("hero");
  const [input, setInput] = useState("");
  const [dashboardData, setDashboardData] = useState<ProductData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat hook — uses default /api/chat endpoint
  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat();

  const chatLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync URL with view state
  useEffect(() => {
    const pathMap: Record<AppView, string> = {
      hero: "/",
      onboarding: "/onboarding",
      chat: "/chat",
      dashboard: "/dashboard",
    };
    window.history.pushState({}, "", pathMap[view]);
  }, [view]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/" || path === "") setView("hero");
      else if (path === "/onboarding") setView("onboarding");
      else if (path === "/chat") setView("chat");
      else if (path === "/dashboard") setView("dashboard");
    };
    window.addEventListener("popstate", handlePopState);
    handlePopState();
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleHeroStart = () => setView("onboarding");
  const handleOnboardingComplete = () => setView("chat");
  const handleBackToOnboarding = () => {
    refresh();
    setView("onboarding");
  };
  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    const text = input.trim();
    setInput("");
    sendMessage({ text });
  };

  // Check if last assistant message has analysis content (for dashboard button)
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantText = lastAssistantMessage ? getMessageText(lastAssistantMessage) : "";
  const hasAnalysisContent =
    lastAssistantText &&
    (lastAssistantText.includes("demand") ||
      lastAssistantText.includes("competitor") ||
      lastAssistantText.includes("traffic") ||
      lastAssistantText.includes("keyword"));

  // Parse assistant response into dashboard data when opening dashboard
  const openDashboard = useCallback(async () => {
    if (!lastAssistantText) return;
    setView("dashboard");
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/parse-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastAssistantText, productName: "Analysis" }),
      });
      const json = await res.json();
      if (json.data) {
        setDashboardData(json.data);
      } else {
        setDashboardData(null);
      }
    } catch (err) {
      console.error("Failed to parse dashboard data:", err);
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [lastAssistantText]);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      {/* Grid Pattern Background */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header — visible in chat, onboarding, dashboard */}
        {(view === "chat" || view === "onboarding" || view === "dashboard") && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm tracking-widest uppercase">Shopify Agent v0.2</span>
            </div>
            <div className="flex items-center gap-3">
              {view === "dashboard" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("chat")}
                  className="text-xs uppercase tracking-wide"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Back to Chat
                </Button>
              )}
              {view === "chat" && hasAnalysisContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openDashboard}
                  className="text-xs uppercase tracking-wide"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              )}
              {view === "chat" && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="text-xs uppercase tracking-wide"
                >
                  New Chat
                </Button>
              )}
              {(view === "chat" || view === "onboarding") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToOnboarding}
                  className="text-xs uppercase tracking-wide"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Connections
                </Button>
              )}
              <div className="text-xs text-muted-foreground">
                STATUS:{" "}
                {connectionsLoading ? (
                  <span className="text-yellow-500">LOADING</span>
                ) : connections?.canAnalyze ? (
                  <span className="text-primary">READY</span>
                ) : (
                  <span className="text-red-500">SETUP REQUIRED</span>
                )}
              </div>
            </div>
          </motion.header>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === "hero" && (
              <motion.div
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                <Hero onStart={handleHeroStart} />
              </motion.div>
            )}

            {view === "onboarding" && (
              <motion.div
                key="onboarding"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full px-4 py-8"
              >
                <Onboarding onComplete={handleOnboardingComplete} />
              </motion.div>
            )}

            {view === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4 max-w-md">
                        <div className="w-16 h-16 mx-auto bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
                          <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold tracking-tight">
                          What would you like to analyze?
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Ask me about any product niche — I&apos;ll use Jungle Scout and Semrush
                          to find demand data, competitors, and traffic insights.
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message as any} />
                  ))}

                  {/* Streaming indicator */}
                  {chatLoading && messages.length > 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </div>
                      <div className="px-4 py-3 bg-card border border-border rounded-2xl">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4">
                  <div className="max-w-3xl mx-auto">
                    <ChatInput
                      input={input}
                      setInput={setInput}
                      isLoading={chatLoading}
                      onSubmit={handleSubmit}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {view === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto px-6 py-8"
              >
                <div className="container mx-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView("chat")}
                    className="mb-4 text-xs uppercase tracking-wide"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Chat
                  </Button>

                  {/* Dashboard with parsed analysis data */}
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <span className="ml-3 text-sm text-muted-foreground">Parsing analysis data…</span>
                    </div>
                  ) : dashboardData ? (
                    <ResultsDashboard
                      data={dashboardData}
                      onReset={() => setView("chat")}
                    />
                  ) : (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                      <LayoutDashboard className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Analysis Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Run an analysis in chat first, then open the dashboard to visualize results.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer — compact */}
        {view !== "hero" && (
          <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-2">
            <div className="container mx-auto flex justify-between items-center text-[10px] uppercase text-muted-foreground tracking-widest">
              <div>
                Powered by <span className="text-white">Composio</span> • Jungle Scout • Semrush
              </div>
              <div>
                Mode:{" "}
                {connections?.shopifyConnected ? (
                  <span className="text-primary">Full</span>
                ) : connections?.canAnalyze ? (
                  <span className="text-yellow-500">Lite</span>
                ) : (
                  <span className="text-red-500">Setup</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
