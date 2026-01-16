import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, REQUIRED_SCOPES } from "@/lib/hubspot/client";
import { encrypt } from "@/lib/encryption";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth error from HubSpot
  if (error) {
    const errorDescription = searchParams.get("error_description") || error;
    return NextResponse.redirect(
      `${origin}/settings?hubspot_error=${encodeURIComponent(errorDescription)}`
    );
  }

  // Verify required params
  if (!code || !state) {
    return NextResponse.redirect(
      `${origin}/settings?hubspot_error=${encodeURIComponent("Missing OAuth parameters")}`
    );
  }

  // Verify state (CSRF protection)
  const cookieStore = await cookies();
  const storedState = cookieStore.get("hubspot_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${origin}/settings?hubspot_error=${encodeURIComponent("Invalid state parameter")}`
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login`);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Portal ID will be fetched on first API call or can be extracted from token info
    // For now, store a placeholder that will be updated
    const portalId = "pending";

    // Upsert connection (replace if exists)
    const { error: dbError } = await supabase.from("hubspot_connections").upsert(
      {
        user_id: user.id,
        portal_id: portalId,
        access_token_encrypted: encrypt(tokens.accessToken),
        refresh_token_encrypted: encrypt(tokens.refreshToken),
        token_expires_at: tokens.expiresAt.toISOString(),
        scopes: REQUIRED_SCOPES,
      },
      {
        onConflict: "user_id",
      }
    );

    if (dbError) {
      throw dbError;
    }

    // Clear state cookie and redirect to settings with success
    const response = NextResponse.redirect(
      `${origin}/settings?hubspot_success=true`
    );
    response.cookies.delete("hubspot_oauth_state");

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "OAuth callback failed";
    return NextResponse.redirect(
      `${origin}/settings?hubspot_error=${encodeURIComponent(message)}`
    );
  }
}
