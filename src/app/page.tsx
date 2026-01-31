"use client";

import { useState } from "react";
import { AnalysisForm } from "@/components/AnalysisForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { ProductData } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (product: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      {/* Grid Pattern Background - Subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      ></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header - Only visible on front page or as a small nav on dashboard */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between mb-12 ${result ? 'hidden' : ''}`} // Hide main header when results are shown to save space
        >
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
             <span className="text-sm tracking-widest uppercase">Shopify Agent v0.1</span>
           </div>
           <div className="text-xs text-muted-foreground">
             SYSTEM STATUS: <span className="text-primary">ONLINE</span>
           </div>
        </motion.header>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <ResultsDashboard data={result} onReset={handleReset} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="w-full">
                <AnalysisForm onSubmit={handleAnalyze} isLoading={isLoading} />
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-center mt-6 text-sm border border-red-900/50 bg-red-900/10 py-2"
                  >
                    [ERROR]: {error}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-0 left-0 w-full p-4 border-t border-border bg-background/80 backdrop-blur-sm"
        >
          <div className="container mx-auto flex justify-between items-center text-[10px] uppercase text-muted-foreground tracking-widest">
            <div>
              Powered by <span className="text-white">Composio</span> • Jungle Scout • Semrush
            </div>
            <div>
              Env: <span className="text-yellow-500">Dev / Mock</span>
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}
