import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/hubspot/client";
import { createHubSpotNote } from "@/lib/hubspot/notes";
import type { Channel } from "@/types/database";

type LogOutreachRequest = {
  outreachId: string;
  message: string;
  channel: Channel;
};

type LogOutreachResponse = {
  success: boolean;
  noteId?: string;
  skipped?: boolean;
  error?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: LogOutreachRequest = await request.json();
    const { outreachId, message, channel } = body;

    if (!outreachId || !message || !channel) {
      return NextResponse.json(
        { error: "Missing required fields: outreachId, message, channel" },
        { status: 400 }
      );
    }

    // Get the outreach record
    const { data: outreach, error: fetchError } = await supabase
      .from("outreach")
      .select("hubspot_contact_id")
      .eq("id", outreachId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !outreach) {
      return NextResponse.json(
        { error: "Outreach record not found" },
        { status: 404 }
      );
    }

    // Skip if no HubSpot contact ID (e.g., Quick Add contacts)
    if (!outreach.hubspot_contact_id) {
      // Update sync status to "skipped"
      await supabase
        .from("outreach")
        .update({ hubspot_sync_status: "skipped" })
        .eq("id", outreachId);

      const response: LogOutreachResponse = {
        success: true,
        skipped: true,
      };
      return NextResponse.json(response);
    }

    // Get valid access token (handles refresh)
    const accessToken = await getValidAccessToken(user.id);

    if (!accessToken) {
      // Update sync status to "failed"
      await supabase
        .from("outreach")
        .update({ hubspot_sync_status: "failed" })
        .eq("id", outreachId);

      const response: LogOutreachResponse = {
        success: false,
        error: "HubSpot not connected or token expired",
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Create note in HubSpot
    const { noteId } = await createHubSpotNote({
      accessToken,
      contactId: outreach.hubspot_contact_id,
      message,
      channel,
    });

    // Update outreach record with note ID and sync status
    await supabase
      .from("outreach")
      .update({
        hubspot_note_id: noteId,
        hubspot_sync_status: "synced",
      })
      .eq("id", outreachId);

    const response: LogOutreachResponse = {
      success: true,
      noteId,
    };
    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to log outreach to HubSpot";

    // Try to update sync status to "failed" if we have the outreach ID
    try {
      const body = await request.clone().json();
      if (body.outreachId) {
        const supabase = await createClient();
        await supabase
          .from("outreach")
          .update({ hubspot_sync_status: "failed" })
          .eq("id", body.outreachId);
      }
    } catch {
      // Ignore errors when trying to update sync status
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
