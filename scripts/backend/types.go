package main

// CreateLeagueRequest represents the request body for creating a league
type CreateLeagueRequest struct {
	Name            string  `json:"name"`
	Description     *string `json:"description,omitempty"`
	CommissionerID  string  `json:"commissioner_id"`
	IsPublic        bool    `json:"is_public"`
	StartingCapital float64 `json:"starting_capital"`
	MaxPositionSize float64 `json:"max_position_size"`
	ScoringType     string  `json:"scoring_type"`
}

// TradeRequest represents the request body for processing a trade
type TradeRequest struct {
	LeagueMemberID string  `json:"league_member_id"`
	MarketID       string  `json:"market_id"`
	MarketSlug     *string `json:"market_slug,omitempty"`
	MarketQuestion string  `json:"market_question"`
	TradeType      string  `json:"trade_type"`
	Outcome        string  `json:"outcome"`
	Shares         float64 `json:"shares"`
	Price          float64 `json:"price"`
}

// MarketPriceResponse represents the response for market price
type MarketPriceResponse struct {
	MarketID  string  `json:"market_id"`
	YesPrice  float64 `json:"yes_price"`
	NoPrice   float64 `json:"no_price"`
	Volume    float64 `json:"volume"`
	Liquidity float64 `json:"liquidity"`
}

// MarketsResponse represents the response for markets list
type MarketsResponse struct {
	Markets []map[string]interface{} `json:"markets"`
	Count   int                      `json:"count"`
}
