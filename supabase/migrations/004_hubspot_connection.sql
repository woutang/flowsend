-- HubSpot connection table for OAuth tokens
CREATE TABLE hubspot_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for user lookup
CREATE INDEX idx_hubspot_connections_user_id ON hubspot_connections(user_id);

-- RLS (Row Level Security)
ALTER TABLE hubspot_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own hubspot connection"
  ON hubspot_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated at trigger (reuse existing function from outreach table)
CREATE TRIGGER set_hubspot_connections_updated_at
  BEFORE UPDATE ON hubspot_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
