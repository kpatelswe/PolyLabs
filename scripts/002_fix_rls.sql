-- Fix Infinite Recursion in RLS Policies

-- 1. Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "leagues_select_public" ON leagues;
DROP POLICY IF EXISTS "league_members_select" ON league_members;

-- 2. Create a helper function to check membership safely
-- SECURITY DEFINER allows this function to bypass RLS on league_members table
CREATE OR REPLACE FUNCTION is_league_member(league_check_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM league_members
    WHERE league_id = league_check_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Re-create leagues policy (Public + Commissioner + Members)
CREATE POLICY "leagues_select_policy" ON leagues FOR SELECT USING (
  is_public = true OR 
  commissioner_id = auth.uid() OR
  is_league_member(id)
);

-- 4. Re-create league_members policy (Self + League Members + Public Leagues)
CREATE POLICY "league_members_select_policy" ON league_members FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid() OR
  -- User can see members of leagues they are in
  is_league_member(league_id) OR
  -- User can see members of public leagues
  -- This check on 'leagues' table is safe because 'leagues' policy now uses the DEFINER function
  -- which breaks the chain back to league_members.
  EXISTS (SELECT 1 FROM leagues WHERE id = league_id AND is_public = true)
);
