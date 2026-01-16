import type { Channel } from "@/types/database";

const HUBSPOT_NOTES_URL = "https://api.hubapi.com/crm/v3/objects/notes";

// Association type ID for note -> contact
// See: https://developers.hubspot.com/docs/api/crm/associations
const NOTE_TO_CONTACT_ASSOCIATION_TYPE_ID = 202;

export type CreateNoteParams = {
  accessToken: string;
  contactId: string;
  message: string;
  channel: Channel;
};

export type CreateNoteResult = {
  noteId: string;
};

/**
 * Creates a note in HubSpot associated with a contact.
 * Used when marking an outreach as "sent" to log the activity.
 */
export async function createHubSpotNote({
  accessToken,
  contactId,
  message,
  channel,
}: CreateNoteParams): Promise<CreateNoteResult> {
  const channelLabel = channel === "linkedin" ? "LinkedIn" : "Email";
  const noteBody = `${channelLabel} outreach via FlowSend:\n\n${message}`;

  const response = await fetch(HUBSPOT_NOTES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        hs_timestamp: Date.now().toString(),
        hs_note_body: noteBody,
      },
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: NOTE_TO_CONTACT_ASSOCIATION_TYPE_ID,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HubSpot API error: ${response.status}`);
  }

  const data = await response.json();
  return { noteId: data.id };
}
