import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/hubspot/client";
import { fetchAllHubSpotContacts } from "@/lib/hubspot/contacts";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get valid access token (handles refresh)
    const accessToken = await getValidAccessToken(user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: "HubSpot not connected or token expired" },
        { status: 401 }
      );
    }

    // Fetch all contacts from HubSpot
    const contacts = await fetchAllHubSpotContacts(accessToken);

    return NextResponse.json({ contacts, total: contacts.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch HubSpot contacts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
