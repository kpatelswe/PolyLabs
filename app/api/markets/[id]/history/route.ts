import { NextRequest, NextResponse } from "next/server"
import { fetchPriceHistory } from "@/lib/polymarket"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const interval = searchParams.get("interval") as "1d" | "1w" | "1m" | "all" || "1m"

  try {
    const history = await fetchPriceHistory(id, interval)
    return NextResponse.json(history)
  } catch (error) {
    console.error("Failed to fetch price history:", error)
    return NextResponse.json([], { status: 500 })
  }
}
