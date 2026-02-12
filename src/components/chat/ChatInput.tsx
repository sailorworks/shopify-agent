"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: FormEvent) => void;
}

const QUICK_ACTIONS = [
  "Analyze Clay Mask niche",
  "Analyze Snail Mucin",
  "Find competitors for Beetroot Scrub",
];

export function ChatInput({ input, setInput, isLoading, onSubmit }: ChatInputProps) {
  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Ask about a product niche or competitor..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-12 bg-card border-border rounded-xl px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-12 px-4 bg-primary hover:bg-primary/90 text-black rounded-xl transition-all"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-2 flex-wrap"
      >
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => setInput(action)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs uppercase tracking-wide bg-white/5 border border-border rounded-lg text-muted-foreground hover:text-white hover:border-white/20 hover:bg-white/10 transition-all disabled:opacity-40"
          >
            {action}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
