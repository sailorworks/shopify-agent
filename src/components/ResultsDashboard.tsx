"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductData } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Users, AlertCircle, DollarSign, Activity } from "lucide-react";
import { RevenueTrendChart, TrafficSourceChart } from "./DashboardCharts";

interface ResultsDashboardProps {
  data: ProductData;
  onReset: () => void;
}

export function ResultsDashboard({ data, onReset }: ResultsDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[1400px] mx-auto p-4 space-y-4"
    >
      {/* Top Navigation / Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onReset}
            className="text-muted-foreground hover:text-white px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl tracking-tight text-white uppercase">
            {data.name} <span className="text-muted-foreground">// Analysis</span>
          </h1>
        </div>
        <Badge 
          variant="outline" 
          className={`
            uppercase tracking-widest text-xs px-3 py-1 bg-transparent border
            ${data.opportunityLevel === 'High' ? 'border-green-600 text-green-500' : 
              data.opportunityLevel === 'Medium' ? 'border-yellow-600 text-yellow-500' : 
              'border-red-600 text-red-500'}
          `}
        >
          {data.opportunityLevel} Risk
        </Badge>
      </div>

      {/* Metric Grid - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Demand Score */}
        <Card className="bg-card border-border rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Demand Score
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">{data.demandScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">Market Velocity</p>
          </CardContent>
        </Card>

        {/* Est. Revenue */}
        <Card className="bg-card border-border rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Est. Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">{data.revenue}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly Avg.</p>
          </CardContent>
        </Card>

        {/* Trend Direction */}
        <Card className="bg-card border-border rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Market Trend
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${data.trend === 'up' ? 'text-primary' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white uppercase">{data.trend}</div>
            <p className="text-xs text-muted-foreground mt-1">Year-over-Year</p>
          </CardContent>
        </Card>

        {/* Competitor Count */}
        <Card className="bg-card border-border rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Competitors
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">{data.competitors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Direct DTC Rivals</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid - Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[300px]">
        {/* Main Chart: Revenue Trend (Spans 2 cols) */}
        <Card className="col-span-1 lg:col-span-2 bg-card border-border rounded-sm">
          <CardHeader className="py-3 px-4 border-b border-border/50">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Revenue Velocity (6 Mo)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pl-0">
             {/* Using new Recharts Component */}
             <RevenueTrendChart data={data.revenueHistory || []} />
          </CardContent>
        </Card>

        {/* Side Chart: Traffic Sources */}
        <Card className="col-span-1 bg-card border-border rounded-sm">
           <CardHeader className="py-3 px-4 border-b border-border/50">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <TrafficSourceChart data={data.trafficDistribution || []} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid - Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         {/* Competitor List Table (Dense) */}
        <Card className="col-span-1 lg:col-span-2 bg-card border-border rounded-sm h-full">
          <CardHeader className="py-3 px-4 border-b border-border/50">
             <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Competitor Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="grid grid-cols-4 gap-2 p-3 border-b border-border/20 text-xs text-muted-foreground uppercase">
                <div className="col-span-1">Domain</div>
                <div className="col-span-1">Traffic</div>
                <div className="col-span-1">Primary Source</div>
                <div className="col-span-1">Top Keywords</div>
             </div>
             {data.competitors.map((comp, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 p-3 text-sm text-white border-b border-border/10 hover:bg-white/5 transition-colors">
                  <div className="col-span-1 font-semibold truncate">{comp.domain}</div>
                  <div className="col-span-1 text-muted-foreground">{comp.traffic}</div>
                  <div className="col-span-1">
                    <Badge variant="secondary" className="rounded-lg text-[10px] font-normal">
                      {comp.trafficSource}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground truncate">
                    {comp.topKeywords.slice(0, 2).join(", ")}
                  </div>
                </div>
             ))}
          </CardContent>
        </Card>

        {/* AI Insight Card */}
        <Card className="col-span-1 bg-gradient-to-br from-card to-background border-border rounded-sm h-full">
          <CardHeader className="py-3 px-4 border-b border-border/50">
             <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-green-500" />
              Strategic Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <p className="text-sm leading-relaxed text-white/80 font-mono">
               {"> "} {data.recommendation}
             </p>
             <div className="mt-6 pt-4 border-t border-dashed border-border/50 flex justify-between text-xs text-muted-foreground">
               <span>Generated by: Shopify Agent</span>
               <span>Confidence: 98.4%</span>
             </div>
          </CardContent>
        </Card>
      </div>

    </motion.div>
  );
}
