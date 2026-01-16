import type {
  HubSpotContact,
  HubSpotContactsResponse,
  NormalizedHubSpotContact,
} from "@/types/hubspot";

const HUBSPOT_CONTACTS_URL = "https://api.hubapi.com/crm/v3/objects/contacts";
const PAGE_SIZE = 100; // HubSpot max is 100
const MAX_CONTACTS = 1000; // Safety limit

// Properties to fetch from HubSpot
const CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "company",
  "hs_linkedin_url",
  "linkedin_url", // Some portals use this alias
];

export async function fetchAllHubSpotContacts(
  accessToken: string
): Promise<NormalizedHubSpotContact[]> {
  const allContacts: HubSpotContact[] = [];
  let after: string | undefined = undefined;

  // Paginate through all contacts
  while (allContacts.length < MAX_CONTACTS) {
    const url = new URL(HUBSPOT_CONTACTS_URL);
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("properties", CONTACT_PROPERTIES.join(","));

    if (after) {
      url.searchParams.set("after", after);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HubSpot API error: ${response.status}`);
    }

    const data: HubSpotContactsResponse = await response.json();
    allContacts.push(...data.results);

    // Check for more pages
    if (data.paging?.next?.after) {
      after = data.paging.next.after;
    } else {
      break; // No more pages
    }
  }

  // Normalize contacts
  return allContacts.map(normalizeContact);
}

function normalizeContact(contact: HubSpotContact): NormalizedHubSpotContact {
  const { properties } = contact;

  // Build full name
  const firstName = properties.firstname?.trim() || "";
  const lastName = properties.lastname?.trim() || "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";

  // LinkedIn URL (try both property names)
  const linkedinUrl =
    properties.hs_linkedin_url || properties.linkedin_url || null;

  return {
    hubspotId: contact.id,
    name,
    email: properties.email?.trim() || null,
    company: properties.company?.trim() || null,
    linkedinUrl,
  };
}
