"""
Polyleagues FastAPI Backend
This backend handles:
- Market data synchronization from Polymarket
- Position price updates
- League rankings calculation
- Achievement processing
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from datetime import datetime
from supabase import create_client, Client

# Initialize FastAPI
app = FastAPI(
    title="Polyleagues API",
    description="Backend API for Polyleagues prediction market platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    return create_client(url, key)

# Polymarket API
GAMMA_API = "https://gamma-api.polymarket.com"

# Pydantic models
class MarketPrice(BaseModel):
    market_id: str
    yes_price: float
    no_price: float
    volume: float
    liquidity: float

class LeagueRanking(BaseModel):
    league_id: str
    user_id: str
    rank: int
    total_pnl: float

class Achievement(BaseModel):
    user_id: str
    league_id: Optional[str]
    achievement_type: str
    title: str
    description: Optional[str]

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Market endpoints
@app.get("/api/markets")
async def get_markets(limit: int = 50, offset: int = 0, category: Optional[str] = None):
    """Fetch markets from Polymarket API"""
    async with httpx.AsyncClient() as client:
        url = f"{GAMMA_API}/markets?limit={limit}&offset={offset}&active=true&closed=false"
        if category:
            url += f"&tag={category}"
        
        response = await client.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch markets")
        
        markets = response.json()
        return {"markets": markets, "count": len(markets)}

@app.get("/api/markets/{market_id}")
async def get_market(market_id: str):
    """Fetch a single market by ID"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{GAMMA_API}/markets/{market_id}")
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Market not found")
        return response.json()

@app.get("/api/markets/{market_id}/price")
async def get_market_price(market_id: str) -> MarketPrice:
    """Get current price for a market"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{GAMMA_API}/markets/{market_id}")
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Market not found")
        
        data = response.json()
        
        # Parse prices
        outcome_prices = data.get("outcomePrices", ["0.5", "0.5"])
        if isinstance(outcome_prices, str):
            import json
            outcome_prices = json.loads(outcome_prices)
        
        yes_price = float(outcome_prices[0]) if len(outcome_prices) > 0 else 0.5
        no_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else 0.5
        
        return MarketPrice(
            market_id=market_id,
            yes_price=yes_price,
            no_price=no_price,
            volume=float(data.get("volume", 0) or 0),
            liquidity=float(data.get("liquidity", 0) or 0)
        )

# Position updates
@app.post("/api/positions/update-prices")
async def update_position_prices(background_tasks: BackgroundTasks, supabase: Client = Depends(get_supabase)):
    """Update all position prices from current market data"""
    background_tasks.add_task(update_all_positions, supabase)
    return {"status": "started", "message": "Position price update started"}

async def update_all_positions(supabase: Client):
    """Background task to update all position prices"""
    # Fetch all active positions
    result = supabase.table("positions").select("*").execute()
    positions = result.data
    
    if not positions:
        return
    
    # Group by market_id to minimize API calls
    market_ids = set(p["market_id"] for p in positions)
    
    async with httpx.AsyncClient() as client:
        for market_id in market_ids:
            try:
                response = await client.get(f"{GAMMA_API}/markets/{market_id}")
                if response.status_code != 200:
                    continue
                
                data = response.json()
                outcome_prices = data.get("outcomePrices", ["0.5", "0.5"])
                if isinstance(outcome_prices, str):
                    import json
                    outcome_prices = json.loads(outcome_prices)
                
                yes_price = float(outcome_prices[0]) if len(outcome_prices) > 0 else 0.5
                no_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else 0.5
                
                # Update positions for this market
                for position in positions:
                    if position["market_id"] == market_id:
                        current_price = yes_price if position["outcome"] == "yes" else no_price
                        unrealized_pnl = (current_price - position["entry_price"]) * position["shares"]
                        
                        supabase.table("positions").update({
                            "current_price": current_price,
                            "unrealized_pnl": unrealized_pnl,
                            "updated_at": datetime.utcnow().isoformat()
                        }).eq("id", position["id"]).execute()
                        
            except Exception as e:
                print(f"Error updating market {market_id}: {e}")
                continue

# League rankings
@app.post("/api/leagues/{league_id}/update-rankings")
async def update_league_rankings(league_id: str, supabase: Client = Depends(get_supabase)):
    """Recalculate and update rankings for a league"""
    # Fetch all members sorted by P&L
    result = supabase.table("league_members") \
        .select("id, user_id, total_pnl") \
        .eq("league_id", league_id) \
        .order("total_pnl", desc=True) \
        .execute()
    
    members = result.data
    
    # Update ranks
    for i, member in enumerate(members, 1):
        supabase.table("league_members") \
            .update({"rank": i}) \
            .eq("id", member["id"]) \
            .execute()
    
    return {"status": "success", "members_updated": len(members)}

@app.post("/api/leagues/update-all-rankings")
async def update_all_rankings(background_tasks: BackgroundTasks, supabase: Client = Depends(get_supabase)):
    """Update rankings for all active leagues"""
    background_tasks.add_task(update_all_league_rankings, supabase)
    return {"status": "started", "message": "Ranking updates started"}

async def update_all_league_rankings(supabase: Client):
    """Background task to update all league rankings"""
    # Fetch all active leagues
    result = supabase.table("leagues").select("id").eq("status", "active").execute()
    leagues = result.data
    
    for league in leagues:
        try:
            # Fetch members sorted by P&L
            members_result = supabase.table("league_members") \
                .select("id, total_pnl") \
                .eq("league_id", league["id"]) \
                .order("total_pnl", desc=True) \
                .execute()
            
            members = members_result.data
            
            # Update ranks
            for i, member in enumerate(members, 1):
                supabase.table("league_members") \
                    .update({"rank": i}) \
                    .eq("id", member["id"]) \
                    .execute()
                    
        except Exception as e:
            print(f"Error updating rankings for league {league['id']}: {e}")
            continue

# Achievements
@app.post("/api/achievements/check/{user_id}")
async def check_achievements(user_id: str, league_id: Optional[str] = None, supabase: Client = Depends(get_supabase)):
    """Check and award achievements for a user"""
    achievements_awarded = []
    
    # Fetch user's memberships and trades
    if league_id:
        memberships = supabase.table("league_members") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("league_id", league_id) \
            .execute().data
    else:
        memberships = supabase.table("league_members") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute().data
    
    for membership in memberships:
        member_league_id = membership.get("league_id")
        
        # Check for "First Trade" achievement
        if membership["total_trades"] >= 1:
            existing = supabase.table("achievements") \
                .select("id") \
                .eq("user_id", user_id) \
                .eq("league_id", member_league_id) \
                .eq("achievement_type", "first_trade") \
                .execute().data
            
            if not existing:
                supabase.table("achievements").insert({
                    "user_id": user_id,
                    "league_id": member_league_id,
                    "achievement_type": "first_trade",
                    "title": "First Steps",
                    "description": "Made your first trade"
                }).execute()
                achievements_awarded.append("first_trade")
        
        # Check for "Best ROI" (top performer)
        if membership["rank"] == 1 and membership["total_pnl"] > 0:
            existing = supabase.table("achievements") \
                .select("id") \
                .eq("user_id", user_id) \
                .eq("league_id", member_league_id) \
                .eq("achievement_type", "best_roi") \
                .execute().data
            
            if not existing:
                supabase.table("achievements").insert({
                    "user_id": user_id,
                    "league_id": member_league_id,
                    "achievement_type": "best_roi",
                    "title": "Top Performer",
                    "description": "Ranked #1 in the league"
                }).execute()
                achievements_awarded.append("best_roi")
        
        # Check for "Consistent Trader" (10+ trades)
        if membership["total_trades"] >= 10:
            existing = supabase.table("achievements") \
                .select("id") \
                .eq("user_id", user_id) \
                .eq("league_id", member_league_id) \
                .eq("achievement_type", "consistent_trader") \
                .execute().data
            
            if not existing:
                supabase.table("achievements").insert({
                    "user_id": user_id,
                    "league_id": member_league_id,
                    "achievement_type": "consistent_trader",
                    "title": "Consistent Trader",
                    "description": "Completed 10 trades"
                }).execute()
                achievements_awarded.append("consistent_trader")
        
        # Check for "Sharpest Prediction" (70%+ win rate with 10+ trades)
        if membership["win_rate"] >= 70 and membership["total_trades"] >= 10:
            existing = supabase.table("achievements") \
                .select("id") \
                .eq("user_id", user_id) \
                .eq("league_id", member_league_id) \
                .eq("achievement_type", "sharpest_prediction") \
                .execute().data
            
            if not existing:
                supabase.table("achievements").insert({
                    "user_id": user_id,
                    "league_id": member_league_id,
                    "achievement_type": "sharpest_prediction",
                    "title": "Sharp Shooter",
                    "description": "Achieved 70%+ win rate"
                }).execute()
                achievements_awarded.append("sharpest_prediction")
    
    return {"achievements_awarded": achievements_awarded}

# Trade processing
class TradeRequest(BaseModel):
    league_member_id: str
    market_id: str
    market_slug: Optional[str]
    market_question: str
    trade_type: str  # buy or sell
    outcome: str  # yes or no
    shares: float
    price: float

@app.post("/api/trades")
async def process_trade(trade: TradeRequest, supabase: Client = Depends(get_supabase)):
    """Process a trade and update member stats"""
    total_value = trade.shares * trade.price
    
    # Fetch member
    member_result = supabase.table("league_members") \
        .select("*") \
        .eq("id", trade.league_member_id) \
        .single() \
        .execute()
    
    if not member_result.data:
        raise HTTPException(status_code=404, detail="League member not found")
    
    member = member_result.data
    
    # Validate balance for buys
    if trade.trade_type == "buy" and total_value > member["current_balance"]:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    pnl = None
    new_balance = member["current_balance"]
    
    if trade.trade_type == "buy":
        # Create position
        supabase.table("positions").insert({
            "league_member_id": trade.league_member_id,
            "market_id": trade.market_id,
            "market_slug": trade.market_slug,
            "market_question": trade.market_question,
            "outcome": trade.outcome,
            "shares": trade.shares,
            "entry_price": trade.price,
            "current_price": trade.price,
            "unrealized_pnl": 0
        }).execute()
        
        new_balance -= total_value
        
    elif trade.trade_type == "sell":
        # Find and close position
        position_result = supabase.table("positions") \
            .select("*") \
            .eq("league_member_id", trade.league_member_id) \
            .eq("market_id", trade.market_id) \
            .eq("outcome", trade.outcome) \
            .limit(1) \
            .execute()
        
        if position_result.data:
            position = position_result.data[0]
            pnl = (trade.price - position["entry_price"]) * trade.shares
            new_balance += total_value
            
            # Delete or reduce position
            if trade.shares >= position["shares"]:
                supabase.table("positions").delete().eq("id", position["id"]).execute()
            else:
                remaining_shares = position["shares"] - trade.shares
                supabase.table("positions").update({
                    "shares": remaining_shares,
                    "unrealized_pnl": (position["current_price"] - position["entry_price"]) * remaining_shares
                }).eq("id", position["id"]).execute()
    
    # Record trade
    supabase.table("trades").insert({
        "league_member_id": trade.league_member_id,
        "market_id": trade.market_id,
        "market_slug": trade.market_slug,
        "market_question": trade.market_question,
        "trade_type": trade.trade_type,
        "outcome": trade.outcome,
        "shares": trade.shares,
        "price": trade.price,
        "total_value": total_value,
        "pnl": pnl
    }).execute()
    
    # Update member stats
    new_total_pnl = member["total_pnl"] + (pnl or 0)
    new_total_trades = member["total_trades"] + 1
    
    # Calculate new win rate
    trades_result = supabase.table("trades") \
        .select("pnl") \
        .eq("league_member_id", trade.league_member_id) \
        .eq("trade_type", "sell") \
        .execute()
    
    sell_trades = trades_result.data
    profitable_trades = len([t for t in sell_trades if (t.get("pnl") or 0) > 0])
    new_win_rate = (profitable_trades / len(sell_trades) * 100) if sell_trades else 0
    
    supabase.table("league_members").update({
        "current_balance": new_balance,
        "total_pnl": new_total_pnl,
        "total_trades": new_total_trades,
        "win_rate": new_win_rate
    }).eq("id", trade.league_member_id).execute()
    
    return {
        "status": "success",
        "trade_id": trade.league_member_id,
        "new_balance": new_balance,
        "pnl": pnl
    }

# Scheduled tasks info
@app.get("/api/tasks/status")
async def get_task_status():
    """Get status of background tasks"""
    return {
        "tasks": [
            {"name": "update_prices", "endpoint": "POST /api/positions/update-prices", "description": "Update all position prices"},
            {"name": "update_rankings", "endpoint": "POST /api/leagues/update-all-rankings", "description": "Update all league rankings"},
            {"name": "check_achievements", "endpoint": "POST /api/achievements/check/{user_id}", "description": "Check and award achievements"}
        ],
        "note": "These endpoints can be called by a scheduler (e.g., cron job) for periodic updates"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
