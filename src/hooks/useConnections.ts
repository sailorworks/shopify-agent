"use client";

import { useState, useEffect, useCallback } from "react";

export interface ConnectionStatus {
  toolkit: string;
  connected: boolean;
  required: boolean;
}

export interface ConnectionSummary {
  status: ConnectionStatus[];
  requiredConnected: number;
  requiredTotal: number;
  optionalConnected: number;
  optionalTotal: number;
  canAnalyze: boolean;
  shopifyConnected: boolean;
}

interface UseConnectionsResult {
  connections: ConnectionSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getAuthUrl: (toolkit: string) => Promise<string | null>;
}

export function useConnections(): UseConnectionsResult {
  const [connections, setConnections] = useState<ConnectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/connection-status");
      if (!response.ok) {
        throw new Error("Failed to fetch connection status");
      }
      const data = await response.json();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const getAuthUrl = useCallback(async (toolkit: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/auth/${toolkit}`);
      if (!response.ok) {
        throw new Error("Failed to get auth URL");
      }
      const data = await response.json();
      return data.authUrl;
    } catch (err) {
      console.error("Failed to get auth URL:", err);
      return null;
    }
  }, []);

  return {
    connections,
    isLoading,
    error,
    refresh: fetchConnections,
    getAuthUrl,
  };
}
