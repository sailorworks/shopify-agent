"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Loader2, Terminal, ArrowRight, Sparkles, ShoppingBag, Check, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ANALYSIS_STEPS = [
  { id: 1, text: "Connecting to Jungle Scout", delay: 0 },
  { id: 2, text: "Fetching product sales estimates", delay: 2000 },
  { id: 3, text: "Analyzing competitor keywords", delay: 4500 },
  { id: 4, text: "Connecting to Semrush", delay: 7000 },
  { id: 5, text: "Pulling SEO & traffic data", delay: 9500 },
  { id: 6, text: "Generating insights", delay: 12000 },
];

interface AnalysisFormProps {
  onSubmit: (product: string, useMockData: boolean) => void;
  isLoading: boolean;
  shopifyConnected: boolean;
}

const SAMPLE_PRODUCTS = ["Clay Mask", "Snail Mucin", "Beetroot Scrub"];

export function AnalysisForm({ onSubmit, isLoading, shopifyConnected }: AnalysisFormProps) {
  const [product, setProduct] = useState("");
  const [useRealData, setUseRealData] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Simulate step progression when loading
  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    // Start with step 1
    setCurrentStep(1);

    // Set up timers for each step
    const timers = ANALYSIS_STEPS.slice(1).map((step) =>
      setTimeout(() => setCurrentStep(step.id), step.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product.trim()) {
      onSubmit(product.trim(), !useRealData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto"
    >
      <Card className="border-border bg-card rounded-sm shadow-none">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center rounded-sm mb-4 border border-primary/20">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl uppercase tracking-tight text-white mb-2">
            Store Insights
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs uppercase tracking-wider">
            {shopifyConnected ? (
              <>
                <ShoppingBag className="inline h-3 w-3 mr-1" />
                Shopify Connected • Full Analysis Mode
              </>
            ) : (
              <>
                <Sparkles className="inline h-3 w-3 mr-1" />
                Lite Mode • Enter Product Keyword Below
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Terminal-style loading header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-sm">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs uppercase tracking-widest text-primary">
                      Analyzing: {product}
                    </span>
                  </div>
                </div>

                {/* Step-by-step progress */}
                <div className="bg-background/50 border border-border rounded-sm p-4 font-mono text-sm">
                  <div className="space-y-3">
                    {ANALYSIS_STEPS.map((step) => {
                      const isCompleted = currentStep > step.id;
                      const isCurrent = currentStep === step.id;
                      const isPending = currentStep < step.id;

                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: step.delay / 1000, duration: 0.3 }}
                          className={`flex items-center gap-3 ${
                            isPending ? "opacity-40" : ""
                          }`}
                        >
                          {/* Status indicator */}
                          <div className="w-5 h-5 flex items-center justify-center">
                            {isCompleted && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-primary"
                              >
                                <Check className="h-4 w-4" />
                              </motion.div>
                            )}
                            {isCurrent && (
                              <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            )}
                            {isPending && (
                              <Circle className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>

                          {/* Step text */}
                          <span
                            className={`text-xs uppercase tracking-wide ${
                              isCompleted
                                ? "text-primary"
                                : isCurrent
                                ? "text-white"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.text}
                            {isCurrent && (
                              <span className="animate-pulse">...</span>
                            )}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-emerald-400"
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${(currentStep / ANALYSIS_STEPS.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
                  This may take up to 180 seconds
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="text"
                      placeholder={
                        shopifyConnected
                          ? "ENTER PRODUCT NAME OR SELECT FROM STORE..."
                          : "ENTER PRODUCT KEYWORD TO ANALYZE..."
                      }
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      className="pl-10 h-14 bg-background border-input rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm uppercase placeholder:text-muted-foreground/50 transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Analysis Mode Toggle */}
                  <div className="flex items-center justify-center gap-4 py-2">
                    <button
                      type="button"
                      onClick={() => setUseRealData(true)}
                      className={`text-xs uppercase tracking-wide px-4 py-2 rounded-lg transition-all ${
                        useRealData
                          ? "bg-primary text-black font-semibold"
                          : "bg-white/5 text-muted-foreground hover:text-white"
                      }`}
                    >
                      🔴 Live Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseRealData(false)}
                      className={`text-xs uppercase tracking-wide px-4 py-2 rounded-lg transition-all ${
                        !useRealData
                          ? "bg-primary text-black font-semibold"
                          : "bg-white/5 text-muted-foreground hover:text-white"
                      }`}
                    >
                      🟡 Demo Data
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !product.trim()}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg uppercase tracking-wide transition-all duration-300"
                  >
                    Initialize Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase mb-3 text-center tracking-widest">
                    Quick Load Scenarios
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SAMPLE_PRODUCTS.map((sample) => (
                      <Button
                        key={sample}
                        variant="outline"
                        size="sm"
                        onClick={() => setProduct(sample)}
                        className="rounded-lg border-border bg-transparent hover:bg-white/5 hover:text-white text-xs uppercase hover:border-white/20 transition-colors"
                        disabled={isLoading}
                      >
                        {sample}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
