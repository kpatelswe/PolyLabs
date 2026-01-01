export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  total_leagues_joined: number
  total_trades: number
  best_roi: number
  created_at: string
  updated_at: string
}

export interface League {
  id: string
  name: string
  description: string | null
  commissioner_id: string
  is_public: boolean
  invite_code: string | null
  starting_capital: number
  max_position_size: number
  max_leverage: number
  scoring_type: "standard" | "early_conviction" | "risk_adjusted"
  allowed_categories: string[]
  start_date: string | null
  end_date: string | null
  status: "active" | "completed" | "upcoming"
  created_at: string
  updated_at: string
  commissioner?: Profile
  member_count?: number
}

export interface LeagueMember {
  id: string
  league_id: string
  user_id: string
  current_balance: number
  total_pnl: number
  win_rate: number
  total_trades: number
  rank: number | null
  joined_at: string
  profile?: Profile
  league?: League
}

export interface Position {
  id: string
  league_member_id: string
  market_id: string
  market_slug: string | null
  market_question: string | null
  outcome: "yes" | "no"
  shares: number
  entry_price: number
  current_price: number | null
  unrealized_pnl: number
  created_at: string
  updated_at: string
}

export interface Trade {
  id: string
  league_member_id: string
  market_id: string
  market_slug: string | null
  market_question: string | null
  trade_type: "buy" | "sell"
  outcome: "yes" | "no"
  shares: number
  price: number
  total_value: number
  pnl: number | null
  created_at: string
}

export interface Achievement {
  id: string
  user_id: string
  league_id: string | null
  achievement_type: string
  title: string
  description: string | null
  earned_at: string
}

export interface PolymarketEvent {
  id: string
  slug: string
  title: string
  description: string
  markets: PolymarketMarket[]
  startDate: string
  endDate: string
  image: string
  category: string
}

export interface PolymarketMarket {
  id: string
  question: string
  slug: string
  outcomePrices: string
  outcomes: string
  volume: string
  liquidity: string
  endDate: string
  image: string
  groupItemTitle?: string
}
