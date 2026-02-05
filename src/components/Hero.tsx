import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/shpo.gif"
          alt="Holographic woman made of green binary code walking with shopping bags"
          fill
          className="object-cover opacity-40 mix-blend-screen"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-green-500/30 text-xs font-medium uppercase tracking-wider text-green-400 mb-4 backdrop-blur-md shadow-[0_0_10px_rgba(74,222,128,0.2)]"
        >
          <Sparkles className="w-3 h-3" />
          <span>Next-Gen E-commerce Intelligence</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 drop-shadow-2xl"
        >
          Analyze. <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">Optimize.</span> Dominate.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md"
        >
          Unleash the power of AI to audit your Shopify store, uncover competitor secrets, and skyrocket your sales with actionable data from Jungle Scout & Semrush.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button
            size="lg"
            onClick={onStart}
            className="h-14 px-8 text-base font-semibold bg-green-500 text-black hover:bg-green-400 hover:scale-105 transition-all duration-300 rounded-full group shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.6)]"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>

        {/* Features / Trust Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="pt-16 grid grid-cols-2 md:grid-cols-3 gap-8 text-center text-sm text-zinc-400"
        >
          <div className="flex flex-col items-center gap-2">
            <Zap className="w-5 h-5 mb-1 opacity-50" />
            <span>Instant Audit</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TrendingUp className="w-5 h-5 mb-1 opacity-50" />
            <span>Market Trends</span>
          </div>
          <div className="hidden md:flex flex-col items-center gap-2">
            <Sparkles className="w-5 h-5 mb-1 opacity-50" />
            <span>AI Powered</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
