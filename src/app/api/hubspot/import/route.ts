import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { HubSpotImportRequest, HubSpotImportResponse } from "@/types/hubspot";
import type { OutreachInsert } from "@/types/database";

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
    const body: HubSpotImportRequest = await request.json();
    const { contacts } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided" },
        { status: 400 }
      );
    }

    // Limit import size
    if (contacts.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 contacts per import" },
        { status: 400 }
      );
    }

    // Get existing emails to check for duplicates
    const emailsToCheck = contacts
      .map((c) => c.email)
      .filter((email): email is string => email !== null);

    let existingEmails: Set<string> = new Set();

    if (emailsToCheck.length > 0) {
      const { data: existingContacts } = await supabase
        .from("outreach")
        .select("email")
        .eq("user_id", user.id)
        .in("email", emailsToCheck);

      existingEmails = new Set(
        (existingContacts ?? [])
          .map((c) => c.email)
          .filter((e): e is string => e !== null)
      );
    }

    // Filter out duplicates and prepare for insert
    const skippedEmails: string[] = [];
    const contactsToInsert: OutreachInsert[] = [];

    for (const contact of contacts) {
      // Skip if email already exists
      if (contact.email && existingEmails.has(contact.email)) {
        skippedEmails.push(contact.email);
        continue;
      }

      // Skip contacts without name (shouldn't happen but safety check)
      if (!contact.name || contact.name === "Unknown") {
        continue;
      }

      contactsToInsert.push({
        name: contact.name,
        email: contact.email,
        company: contact.company,
        linkedin_url: contact.linkedinUrl,
        notes: `Imported from HubSpot (ID: ${contact.hubspotId})`,
        channel: "linkedin",
        status: "pending",
        hubspot_contact_id: contact.hubspotId,
        hubspot_sync_status: "pending",
      });
    }

    // Insert contacts
    let imported = 0;
    if (contactsToInsert.length > 0) {
      const { data, error } = await supabase
        .from("outreach")
        .insert(contactsToInsert.map((c) => ({ ...c, user_id: user.id })))
        .select();

      if (error) throw error;
      imported = data?.length ?? 0;
    }

    const response: HubSpotImportResponse = {
      imported,
      skipped: skippedEmails.length,
      skippedEmails: skippedEmails.slice(0, 10), // Limit to first 10 for display
    };

    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to import contacts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
