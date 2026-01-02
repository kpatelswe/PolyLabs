# PolyLabs: Fantasy Prediction Markets

PolyLabs is a fantasy trading platform that allows users to compete in leagues by trading simulated shares on real-world events from [Polymarket](https://polymarket.com).

![PolyLabs Dashboard](https://github.com/user-attachments/assets/placeholder)

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Go (Golang) 1.25+
- **Database**: Supabase (PostgreSQL + Real-time)
- **Market Data**: Polymarket Gamma API

## 🏗 Architecture

The application consists of two main services:

1.  **Frontend (`/`)**: A Next.js application that handles the user interface, authentication, and client-side interactions.
2.  **Backend (`/scripts/backend`)**: A Go service that acts as an API gateway, handling simulated order execution, market data ingestion, and background jobs (rankings, settlements).

## 🛠 Prerequisites

- Node.js 18+
- Go 1.25+
- Supabase Project

## ⚡️ Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Start the Backend (Go)

The backend handles trading logic and market data.

```bash
cd scripts/backend
go mod tidy
go run .
```
*Server will start on http://localhost:8000*

### 3. Start the Frontend (Next.js)

Open a new terminal window:

```bash
npm install
npm run dev
```
*App will be available at http://localhost:3000*

## ✨ Features

- **Fantasy Leagues**: Create or join public/private leagues with custom starting capital.
- **Real-Time Trading**: Buy and sell positions on active Polymarket events (Sports, Politics, Crypto, etc.).
- **Live Leaderboards**: Track performance against friends with real-time PnL updates.
- **Simulated Matching Engine**: Orders are "filled" against real-world liquidity snapshots.
- **Achievements**: Earn badges for trading milestones (e.g., "First Trade", "ROI King").

## 📂 Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable UI components (Shadcn + custom)
- `/lib` - Utilities, API clients, and Supabase helpers
- `/scripts/backend` - Go backend source code
  - `handlers_*.go` - REST API endpoint logic
  - `main.go` - Server entry point

## 📜 License

MIT
