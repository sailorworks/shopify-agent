"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Globe, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Competitor } from "@/lib/mock-data";

interface CompetitorCardProps {
  competitor: Competitor;
  index: number;
}

export function CompetitorCard({ competitor, index }: CompetitorCardProps) {
  const isPaid = competitor.trafficSource === "Paid (Ads)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl hover:border-violet-500/50 transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">{competitor.domain}</CardTitle>
            </div>
            <Badge
              variant={isPaid ? "default" : "secondary"}
              className={isPaid 
                ? "bg-gradient-to-r from-orange-500 to-red-500 border-0" 
                : "bg-gradient-to-r from-green-500 to-emerald-500 border-0"
              }
            >
              <Zap className="h-3 w-3 mr-1" />
              {competitor.trafficSource}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Traffic</span>
            <span className="font-semibold text-white">{competitor.traffic}</span>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top Keywords</p>
            <div className="flex flex-wrap gap-1">
              {competitor.topKeywords.map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-xs border-white/10">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
