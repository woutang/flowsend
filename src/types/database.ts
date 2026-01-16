import type { HubSpotConnection } from "./hubspot";

export type Source = "cold" | "event" | "inbound" | "referral";
export type Channel = "linkedin" | "email";
export type Status = "pending" | "sent" | "skipped";
export type HubSpotSyncStatus = "pending" | "synced" | "failed" | "skipped";

// HubSpot connection types for database operations
export type HubSpotConnectionInsert = Omit<
  HubSpotConnection,
  "id" | "connected_at" | "updated_at"
>;
export type HubSpotConnectionUpdate = Partial<
  Omit<HubSpotConnection, "id" | "user_id">
>;

export type Outreach = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  linkedin_url: string | null;
  email: string | null;
  notes: string | null;
  source: Source | null;
  channel: Channel;
  message: string | null;
  status: Status;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  // HubSpot fields
  hubspot_contact_id: string | null;
  hubspot_note_id: string | null;
  hubspot_sync_status: HubSpotSyncStatus | null;
};

export type OutreachInsert = {
  name: string;
  company?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  notes?: string | null;
  source?: Source | null;
  channel?: Channel;
  message?: string | null;
  status?: Status;
  sent_at?: string | null;
  // HubSpot fields
  hubspot_contact_id?: string | null;
  hubspot_note_id?: string | null;
  hubspot_sync_status?: HubSpotSyncStatus | null;
};

export type OutreachUpdate = {
  name?: string;
  company?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  notes?: string | null;
  source?: Source | null;
  channel?: Channel;
  message?: string | null;
  status?: Status;
  sent_at?: string | null;
  // HubSpot fields
  hubspot_contact_id?: string | null;
  hubspot_note_id?: string | null;
  hubspot_sync_status?: HubSpotSyncStatus | null;
};

export type Database = {
  public: {
    Tables: {
      outreach: {
        Row: Outreach;
        Insert: OutreachInsert;
        Update: OutreachUpdate;
        Relationships: [];
      };
      hubspot_connections: {
        Row: HubSpotConnection;
        Insert: HubSpotConnectionInsert;
        Update: HubSpotConnectionUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
