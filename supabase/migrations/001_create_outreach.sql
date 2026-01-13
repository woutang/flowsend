-- FlowSend Database Schema
-- One table: outreach

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main table
CREATE TABLE outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact info
  name TEXT NOT NULL,
  company TEXT,
  linkedin_url TEXT,
  email TEXT,
  notes TEXT,
  source TEXT CHECK (source IN ('cold', 'event', 'inbound', 'referral')),

  -- Message
  channel TEXT NOT NULL DEFAULT 'linkedin' CHECK (channel IN ('linkedin', 'email')),
  message TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_user_id ON outreach(user_id);
CREATE INDEX idx_outreach_status ON outreach(status);
CREATE INDEX idx_outreach_created_at ON outreach(created_at);

-- RLS (Row Level Security)
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own outreach"
  ON outreach FOR ALL
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON outreach
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
