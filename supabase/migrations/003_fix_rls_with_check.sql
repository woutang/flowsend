-- Fix RLS policy to include WITH CHECK clause
-- Prevents user_id manipulation on INSERT and UPDATE

DROP POLICY IF EXISTS "Users can manage own outreach" ON outreach;

CREATE POLICY "Users can manage own outreach"
  ON outreach FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
