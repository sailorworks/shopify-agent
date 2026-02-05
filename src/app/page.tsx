"use client";

import { useState, useEffect } from "react";
import { AnalysisForm } from "@/components/AnalysisForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { Onboarding } from "@/components/Onboarding";
import { useConnections } from "@/hooks/useConnections";
import { ProductData } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Hero } from "@/components/Hero";

type AppView = "hero" | "onboarding" | "analysis" | "results";

export default function Home() {
  const { connections, isLoading: connectionsLoading, refresh } = useConnections();
  const [view, setView] = useState<AppView>("hero");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync URL with view state
  useEffect(() => {
    const path = view === "hero" ? "/" : `/${view === "results" ? "dashboard" : view}`;
    window.history.pushState({}, "", path);
  }, [view]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/" || path === "") setView("hero");
      else if (path === "/onboarding") setView("onboarding");
      else if (path === "/analysis") setView("analysis");
      else if (path === "/dashboard") setView("results");
    };
    window.addEventListener("popstate", handlePopState);
    
    // Set initial view based on URL
    handlePopState();
    
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Skip onboarding if already connected
  useEffect(() => {
    if (connections?.canAnalyze && view === "onboarding") {
      // Don't auto-skip - let user see their connections
    }
  }, [connections, view]);

  const handleOnboardingComplete = () => {
    setView("analysis");
  };

  const handleHeroStart = () => {
    setView("onboarding");
  };

  const handleAnalyze = async (product: string, useMockData: boolean) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, useMockData }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      setView("results");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setView("analysis");
  };

  const handleBackToOnboarding = () => {
    refresh();
    setView("onboarding");
  };

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

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between mb-12 ${
            view === "results" || view === "hero" ? "hidden" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm tracking-widest uppercase">Shopify Agent v0.2</span>
          </div>
          <div className="flex items-center gap-4">
            {view === "analysis" && (
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

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {view === "hero" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-20 bg-background"
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
              className="flex items-center justify-center min-h-[60vh]"
            >
              <Onboarding onComplete={handleOnboardingComplete} />
            </motion.div>
          )}

          {view === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="w-full">
                <AnalysisForm
                  onSubmit={handleAnalyze}
                  isLoading={isAnalyzing}
                  shopifyConnected={connections?.shopifyConnected ?? false}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-center mt-6 text-sm border border-red-900/50 bg-red-900/10 py-2 max-w-xl mx-auto"
                  >
                    [ERROR]: {error}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {view === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="mb-4 text-xs uppercase tracking-wide"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
              <ResultsDashboard data={result} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-0 left-0 w-full p-4 border-t border-border bg-background/80 backdrop-blur-sm z-50"
        >
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
        </motion.footer>
      </div>
    </main>
  );
}
