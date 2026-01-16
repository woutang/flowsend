"use client";

import { useState, useCallback, useEffect } from "react";
import type { HubSpotConnectionInfo } from "@/types/hubspot";

export function useHubSpotConnection() {
  const [connection, setConnection] = useState<HubSpotConnectionInfo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/hubspot/status");
      if (!response.ok) {
        throw new Error("Failed to fetch HubSpot status");
      }
      const data = await response.json();
      setConnection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch("/api/hubspot/connect", { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initiate connection");
      }
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, []);

  const disconnect = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch("/api/hubspot/disconnect", {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect");
      }
      setConnection({
        status: "disconnected",
        portalId: null,
        connectedAt: null,
        scopes: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    connection,
    isLoading,
    error,
    connect,
    disconnect,
    refetch: fetchStatus,
  };
}
