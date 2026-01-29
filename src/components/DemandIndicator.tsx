"use client";

import { motion } from "framer-motion";

interface DemandIndicatorProps {
  score: number; // 0-100
  revenue: string;
  trend: 'up' | 'down' | 'stable';
}

export function DemandIndicator({ score, revenue, trend }: DemandIndicatorProps) {
  const getColor = () => {
    if (score >= 70) return "from-green-500 to-emerald-500";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getLabel = () => {
    if (score >= 70) return "High Demand";
    if (score >= 40) return "Moderate Demand";
    return "Low Demand";
  };

  const getTrendIcon = () => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Demand Score</span>
        <span className={`text-sm font-semibold ${score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
          {getLabel()} {getTrendIcon()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getColor()} rounded-full`}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Est. Monthly Revenue</span>
        <span className="font-bold text-2xl bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {revenue}
        </span>
      </div>
    </div>
  );
}
