-- Add HubSpot fields to outreach table for contact linking and sync tracking

-- Link outreach records to HubSpot contacts
ALTER TABLE outreach ADD COLUMN hubspot_contact_id TEXT;

-- Track HubSpot note created on mark sent
ALTER TABLE outreach ADD COLUMN hubspot_note_id TEXT;

-- Sync status for HubSpot logging
-- Values: 'pending', 'synced', 'failed', 'skipped' (no hubspot_contact_id)
ALTER TABLE outreach ADD COLUMN hubspot_sync_status TEXT DEFAULT 'pending';

-- Index for HubSpot contact lookup (for deduplication)
CREATE INDEX idx_outreach_hubspot_contact_id ON outreach(hubspot_contact_id);
