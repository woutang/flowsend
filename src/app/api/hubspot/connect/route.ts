import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/hubspot/client";
import { randomBytes } from "crypto";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate CSRF state token
    const state = randomBytes(32).toString("hex");

    // Build authorization URL
    const authUrl = getAuthorizationUrl(state);

    // Store state in cookie for verification (httpOnly, secure in production)
    const response = NextResponse.json({ url: authUrl });
    response.cookies.set("hubspot_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to initiate OAuth";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
