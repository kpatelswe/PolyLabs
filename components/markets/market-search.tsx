"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function MarketSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // We consolidate everything into 'q'
  const initialValue = searchParams.get("q") || searchParams.get("id") || ""

  const [value, setValue] = React.useState(initialValue)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create new URL search params
    const params = new URLSearchParams(searchParams.toString())
    
    // Clear existing specific params, we only use 'q' now
    params.delete("q")
    params.delete("id")
    params.delete("page") // Reset pagination on new search
    
    if (value.trim()) {
      params.set("q", value.trim())
    }

    router.push(`/dashboard/markets?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-2xl gap-2">
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Title or URL"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
      </div>
      
      <Button type="submit">Search</Button>
    </form>
  )
}
