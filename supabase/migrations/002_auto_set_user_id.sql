-- Auto-set user_id on insert using auth.uid()
-- This ensures user_id cannot be spoofed from the client

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_user_id_on_insert
  BEFORE INSERT ON outreach
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();
