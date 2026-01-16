import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type {
  HubSpotConnectionInfo,
  HubSpotConnectionStatus,
} from "@/types/hubspot";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: connection } = await supabase
      .from("hubspot_connections")
      .select("portal_id, connected_at, scopes, token_expires_at")
      .eq("user_id", user.id)
      .single();

    if (!connection) {
      const info: HubSpotConnectionInfo = {
        status: "disconnected",
        portalId: null,
        connectedAt: null,
        scopes: [],
      };
      return NextResponse.json(info);
    }

    // Check if token is expired
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    let status: HubSpotConnectionStatus = "connected";

    if (expiresAt <= now) {
      status = "expired";
    }

    const info: HubSpotConnectionInfo = {
      status,
      portalId: connection.portal_id,
      connectedAt: connection.connected_at,
      scopes: connection.scopes,
    };

    return NextResponse.json(info);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
