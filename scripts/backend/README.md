# Polyleagues FastAPI Backend

This backend service handles market data synchronization, position updates, league rankings, and achievement processing for the Polyleagues platform.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

3. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

### Health
- `GET /health` - Health check

### Markets
- `GET /api/markets` - List markets from Polymarket
- `GET /api/markets/{market_id}` - Get single market
- `GET /api/markets/{market_id}/price` - Get current market price

### Positions
- `POST /api/positions/update-prices` - Update all position prices (background task)

### Leagues
- `POST /api/leagues/{league_id}/update-rankings` - Update rankings for a league
- `POST /api/leagues/update-all-rankings` - Update all league rankings

### Achievements
- `POST /api/achievements/check/{user_id}` - Check and award achievements

### Trades
- `POST /api/trades` - Process a trade

## Scheduled Tasks

For production, set up cron jobs to call these endpoints periodically:

```bash
# Update position prices every 5 minutes
*/5 * * * * curl -X POST http://localhost:8000/api/positions/update-prices

# Update rankings every 15 minutes
*/15 * * * * curl -X POST http://localhost:8000/api/leagues/update-all-rankings
```

## Deployment

This can be deployed to:
- Vercel (as a Python serverless function)
- Railway
- Render
- Any Docker-compatible platform
