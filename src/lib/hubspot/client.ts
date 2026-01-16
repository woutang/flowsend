import { encrypt, decrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";
import type { TokenData, HubSpotTokenResponse, HubSpotConnection } from "@/types/hubspot";

// Standard HubSpot OAuth endpoints
const HUBSPOT_AUTH_URL = "https://app.hubspot.com/oauth/authorize";
const HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";

// Scopes must match what's configured in HubSpot Developer Portal
// Go to: developers.hubspot.com → Apps → Your App → Auth → Scopes
export const REQUIRED_SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.companies.read",
  "crm.objects.deals.read",
];

function getHubSpotConfig() {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing HubSpot OAuth configuration");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getHubSpotConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: REQUIRED_SCOPES.join(" "),
    state,
  });

  return `${HUBSPOT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenData> {
  const { clientId, clientSecret, redirectUri } = getHubSpotConfig();

  const response = await fetch(HUBSPOT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error_description || error.error || "Failed to exchange code for tokens"
    );
  }

  const data: HubSpotTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenData> {
  const { clientId, clientSecret } = getHubSpotConfig();

  const response = await fetch(HUBSPOT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error_description || error.error || "Failed to refresh token"
    );
  }

  const data: HubSpotTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// Get valid access token, refreshing if needed
export async function getValidAccessToken(
  userId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: connection, error } = await supabase
    .from("hubspot_connections")
    .select("*")
    .eq("user_id", userId)
    .single<HubSpotConnection>();

  if (error || !connection) {
    return null;
  }

  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minute buffer

  // Token still valid
  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    return decrypt(connection.access_token_encrypted);
  }

  // Need to refresh
  try {
    const currentRefreshToken = decrypt(connection.refresh_token_encrypted);
    const newTokens = await refreshAccessToken(currentRefreshToken);

    // Update tokens in database
    await supabase
      .from("hubspot_connections")
      .update({
        access_token_encrypted: encrypt(newTokens.accessToken),
        refresh_token_encrypted: encrypt(newTokens.refreshToken),
        token_expires_at: newTokens.expiresAt.toISOString(),
      })
      .eq("user_id", userId);

    return newTokens.accessToken;
  } catch {
    // Refresh failed - connection is invalid
    return null;
  }
}
