-- Function to increment leagues joined count
CREATE OR REPLACE FUNCTION increment_leagues_joined(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET total_leagues_joined = total_leagues_joined + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$;
