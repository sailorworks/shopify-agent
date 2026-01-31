"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Loader2, Terminal, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface AnalysisFormProps {
  onSubmit: (product: string) => void;
  isLoading: boolean;
}

const SAMPLE_PRODUCTS = ["Clay Mask", "Snail Mucin", "Beetroot Scrub"];

export function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const [product, setProduct] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product.trim()) {
      onSubmit(product.trim());
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
             Validate Demand • Analyze Rivals • Execute Strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="ENTER PRODUCT NAME OR SKU..."
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="pl-10 h-14 bg-background border-input rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm uppercase placeholder:text-muted-foreground/50 transition-all"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !product.trim()}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg uppercase tracking-wide transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Data...
                </>
              ) : (
                <>
                  Initialize Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
