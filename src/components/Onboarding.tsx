"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  Loader2, 
  ShoppingBag, 
  TrendingUp, 
  Search,
  ArrowRight,
  Zap
} from "lucide-react";
import { useConnections, ConnectionStatus } from "@/hooks/useConnections";

interface OnboardingProps {
  onComplete: () => void;
}

const TOOLKIT_INFO: Record<string, { name: string; description: string; icon: React.ElementType; color: string }> = {
  shopify: {
    name: "Shopify",
    description: "Connect your store to analyze your products",
    icon: ShoppingBag,
    color: "text-green-500",
  },
  junglescout: {
    name: "Jungle Scout",
    description: "Validate product demand with Amazon sales data",
    icon: TrendingUp,
    color: "text-orange-500",
  },
  semrush: {
    name: "Semrush",
    description: "Find competitor traffic sources & keywords",
    icon: Search,
    color: "text-blue-500",
  },
};

function ConnectionCard({
  status,
  onConnect,
  isConnecting,
}: {
  status: ConnectionStatus;
  onConnect: () => void;
  isConnecting: boolean;
}) {
  const info = TOOLKIT_INFO[status.toolkit];
  const Icon = info?.icon || Circle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`p-4 border rounded-lg transition-all ${
        status.connected
          ? "border-primary/50 bg-primary/5"
          : "border-border hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/5 ${info?.color || "text-white"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm uppercase tracking-wide">
                {info?.name || status.toolkit}
              </span>
              {!status.required && (
                <span className="text-[10px] text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded">
                  Optional
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {info?.description || "Connect this service"}
            </p>
          </div>
        </div>

        {status.connected ? (
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wide">Connected</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onConnect}
            disabled={isConnecting}
            className="border-white/20 hover:bg-white/5 hover:border-white/40"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Connect
                <ExternalLink className="ml-2 h-3 w-3" />
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { connections, isLoading, error, refresh, getAuthUrl } = useConnections();
  const [connectingToolkit, setConnectingToolkit] = useState<string | null>(null);

  const handleConnect = async (toolkit: string) => {
    setConnectingToolkit(toolkit);
    const authUrl = await getAuthUrl(toolkit);
    if (authUrl) {
      // Open in new window
      const popup = window.open(authUrl, "_blank", "width=600,height=700");
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        await refresh();
        // Check if popup closed
        if (popup?.closed) {
          clearInterval(pollInterval);
          setConnectingToolkit(null);
        }
      }, 2000);

      // Safety timeout
      setTimeout(() => {
        clearInterval(pollInterval);
        setConnectingToolkit(null);
        refresh();
      }, 120000); // 2 minutes
    } else {
      setConnectingToolkit(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <p>Failed to load connection status</p>
        <Button variant="outline" onClick={refresh} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const requiredConnections = connections?.status.filter((s) => s.required) || [];
  const optionalConnections = connections?.status.filter((s) => !s.required) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto"
    >
      <Card className="border-border bg-card rounded-sm shadow-none">
        <CardHeader className="text-center pb-6 pt-10">
          <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center rounded-sm mb-4 border border-primary/20">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl uppercase tracking-tight text-white mb-2">
            Connect Your Tools
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs uppercase tracking-wider">
            Link your accounts to enable real-time competitive analysis
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-10 px-6 space-y-6">
          {/* Required Connections */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-3 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Required Connections ({connections?.requiredConnected}/{connections?.requiredTotal})
            </p>
            <div className="space-y-3">
              {requiredConnections.map((status) => (
                <ConnectionCard
                  key={status.toolkit}
                  status={status}
                  onConnect={() => handleConnect(status.toolkit)}
                  isConnecting={connectingToolkit === status.toolkit}
                />
              ))}
            </div>
          </div>

          {/* Optional Connections */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-3 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Optional Connections ({connections?.optionalConnected}/{connections?.optionalTotal})
            </p>
            <div className="space-y-3">
              {optionalConnections.map((status) => (
                <ConnectionCard
                  key={status.toolkit}
                  status={status}
                  onConnect={() => handleConnect(status.toolkit)}
                  isConnecting={connectingToolkit === status.toolkit}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Without Shopify, you&apos;ll enter product keywords manually
            </p>
          </div>

          {/* Continue Button */}
          <div className="pt-4 border-t border-border">
            <Button
              onClick={onComplete}
              disabled={!connections?.canAnalyze}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg uppercase tracking-wide transition-all duration-300"
            >
              {connections?.canAnalyze ? (
                <>
                  Continue to Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Connect Required Tools to Continue
                </>
              )}
            </Button>
            
            {connections?.canAnalyze && !connections?.shopifyConnected && (
              <p className="text-[10px] text-yellow-500 text-center mt-3">
                ⚡ Lite Mode: You&apos;ll enter product keywords manually
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
