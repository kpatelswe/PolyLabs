-- Polyleagues Database Schema

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  total_leagues_joined INTEGER DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  best_roi DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  commissioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  invite_code TEXT UNIQUE,
  starting_capital DECIMAL(12, 2) DEFAULT 10000.00,
  max_position_size DECIMAL(5, 2) DEFAULT 25.00, -- percentage
  max_leverage DECIMAL(3, 1) DEFAULT 1.0,
  scoring_type TEXT DEFAULT 'standard', -- standard, early_conviction, risk_adjusted
  allowed_categories TEXT[] DEFAULT ARRAY['politics', 'sports', 'crypto', 'entertainment', 'science'],
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, completed, upcoming
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- League Members table
CREATE TABLE IF NOT EXISTS league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_balance DECIMAL(12, 2),
  total_pnl DECIMAL(12, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- Positions table (active trades)
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_member_id UUID NOT NULL REFERENCES league_members(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL, -- Polymarket market ID
  market_slug TEXT,
  market_question TEXT,
  outcome TEXT NOT NULL, -- 'yes' or 'no'
  shares DECIMAL(12, 4) NOT NULL,
  entry_price DECIMAL(10, 4) NOT NULL,
  current_price DECIMAL(10, 4),
  unrealized_pnl DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade History table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_member_id UUID NOT NULL REFERENCES league_members(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL,
  market_slug TEXT,
  market_question TEXT,
  trade_type TEXT NOT NULL, -- 'buy' or 'sell'
  outcome TEXT NOT NULL,
  shares DECIMAL(12, 4) NOT NULL,
  price DECIMAL(10, 4) NOT NULL,
  total_value DECIMAL(12, 2) NOT NULL,
  pnl DECIMAL(12, 2), -- realized P&L for sells
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'best_roi', 'sharpest_prediction', 'first_trade', etc.
  title TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- Leagues policies (public leagues visible to all, private only to members)
CREATE POLICY "leagues_select_public" ON leagues FOR SELECT USING (
  is_public = true OR 
  commissioner_id = auth.uid() OR
  EXISTS (SELECT 1 FROM league_members WHERE league_id = leagues.id AND user_id = auth.uid())
);
CREATE POLICY "leagues_insert_auth" ON leagues FOR INSERT WITH CHECK (auth.uid() = commissioner_id);
CREATE POLICY "leagues_update_commissioner" ON leagues FOR UPDATE USING (auth.uid() = commissioner_id);
CREATE POLICY "leagues_delete_commissioner" ON leagues FOR DELETE USING (auth.uid() = commissioner_id);

-- League Members policies
CREATE POLICY "league_members_select" ON league_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM leagues WHERE id = league_id AND (is_public = true OR commissioner_id = auth.uid())) OR
  user_id = auth.uid()
);
CREATE POLICY "league_members_insert" ON league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "league_members_update_own" ON league_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "league_members_delete" ON league_members FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM leagues WHERE id = league_id AND commissioner_id = auth.uid())
);

-- Positions policies
CREATE POLICY "positions_select" ON positions FOR SELECT USING (
  EXISTS (SELECT 1 FROM league_members WHERE id = league_member_id AND user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM league_members lm 
    JOIN leagues l ON lm.league_id = l.id 
    WHERE lm.id = league_member_id AND l.is_public = true
  )
);
CREATE POLICY "positions_insert" ON positions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM league_members WHERE id = league_member_id AND user_id = auth.uid())
);
CREATE POLICY "positions_update" ON positions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM league_members WHERE id = league_member_id AND user_id = auth.uid())
);
CREATE POLICY "positions_delete" ON positions FOR DELETE USING (
  EXISTS (SELECT 1 FROM league_members WHERE id = league_member_id AND user_id = auth.uid())
);

-- Trades policies
CREATE POLICY "trades_select" ON trades FOR SELECT USING (
  EXISTS (SELECT 1 FROM league_members WHERE id = league_member_id AND user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM league_members lm 
    JOIN leagues l ON lm.league_id = l.id 
    WHERE lm.id = league_member_id AND l.is_public = true
  )
);
CREATE POLICY "trades_insert" ON trades FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM league_members WHERE id = league_member_id AND user_id = auth.uid())
);

-- Achievements policies
CREATE POLICY "achievements_select" ON achievements FOR SELECT USING (true);
CREATE POLICY "achievements_insert" ON achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leagues_commissioner ON leagues(commissioner_id);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);
CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_member ON positions(league_member_id);
CREATE INDEX IF NOT EXISTS idx_trades_member ON trades(league_member_id);
CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at DESC);
