"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useHubSpotConnection } from "@/hooks/use-hubspot-connection";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { HubSpotImport } from "@/components/hubspot-import";

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function HubSpotSettings() {
  const searchParams = useSearchParams();
  const { connection, isLoading, error, connect, disconnect, refetch } =
    useHubSpotConnection();

  // Handle OAuth callback results
  useEffect(() => {
    const success = searchParams.get("hubspot_success");
    const oauthError = searchParams.get("hubspot_error");

    if (success || oauthError) {
      // Refetch status after OAuth callback
      refetch();
      // Clear URL params for cleaner UX
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>HubSpot Integration</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = connection?.status === "connected";
  const isExpired = connection?.status === "expired";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>HubSpot Integration</CardTitle>
          {isConnected && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          )}
          {connection?.status === "disconnected" && (
            <Badge variant="secondary">
              <XCircle className="h-3 w-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your HubSpot account to import contacts and log outreach
          activities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {searchParams.get("hubspot_error") && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            OAuth Error: {searchParams.get("hubspot_error")}
          </div>
        )}

        {searchParams.get("hubspot_success") && (
          <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
            Successfully connected to HubSpot!
          </div>
        )}

        {isConnected && connection && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Portal ID:</span>
              <span className="font-medium">{connection.portalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connected on:</span>
              <span className="font-medium">
                {formatDate(connection.connectedAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Permissions:</span>
              <span className="font-medium">
                {connection.scopes.length} scopes granted
              </span>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Import Contacts</p>
                <p className="text-xs text-muted-foreground">
                  Add HubSpot contacts to your outreach queue
                </p>
              </div>
              <HubSpotImport onImportComplete={refetch} />
            </div>
          </div>
        )}

        {isExpired && (
          <div className="p-3 text-sm text-yellow-700 bg-yellow-50 rounded-md">
            Your HubSpot connection has expired. Please reconnect to continue
            syncing.
          </div>
        )}

        <div className="pt-4 border-t">
          {isConnected || isExpired ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={disconnect}>
                Disconnect
              </Button>
              {isExpired && <Button onClick={connect}>Reconnect</Button>}
            </div>
          ) : (
            <Button onClick={connect}>Connect HubSpot</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
