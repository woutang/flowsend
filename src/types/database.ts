export type Source = "cold" | "event" | "inbound" | "referral";
export type Channel = "linkedin" | "email";
export type Status = "pending" | "sent" | "skipped";

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
