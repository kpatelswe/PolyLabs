# Polyleagues Go Backend

This backend service handles market data synchronization, position updates, league rankings, and achievement processing for the Polyleagues platform.

## Setup

1. Install Go 1.25.5 (or higher).

2. Initialize dependencies:
```bash
go mod tidy
```

3. Set environment variables (or use `.env` file):
```bash
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

4. Build and run the server:
```bash
go build -o polylabs-server .
./polylabs-server
```

Alternatively, for development:
```bash
go run .
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
- `POST /api/positions/settle` - Settle positions for resolved markets

### Leagues
- `POST /api/leagues` - Create a new league
- `POST /api/leagues/{league_id}/update-rankings` - Update rankings for a league
- `POST /api/leagues/update-all-rankings` - Update all league rankings

### Achievements
- `POST /api/achievements/check/{user_id}` - Check and award achievements

### Trades
- `POST /api/trades` - Process a trade

## Scheduled Tasks

For production, set up cron jobs (or a scheduler) to call these endpoints periodically:

```bash
# Update position prices every 5 minutes
*/5 * * * * curl -X POST http://localhost:8000/api/positions/update-prices

# Update rankings every 15 minutes
*/15 * * * * curl -X POST http://localhost:8000/api/leagues/update-all-rankings

# Settle positions every hour
0 * * * * curl -X POST http://localhost:8000/api/positions/settle
```

## Deployment

Everything is compiled into a single binary `polylabs-server`. This can be deployed to:
- Railway (Go)
- Render (Go)
- AWS EC2 / DigitalOcean
- Any Docker-compatible platform
