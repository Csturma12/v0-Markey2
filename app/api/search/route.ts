// Web search API for real-time market data

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

// Define search queries for each section type
const SECTION_SEARCH_QUERIES: Record<string, string[]> = {
  macro: [
    "Federal Reserve interest rates April 2026",
    "US inflation CPI latest data 2026",
    "US GDP growth economic data 2026",
    "Treasury yields bond market today",
    "US dollar DXY index today"
  ],
  equities: [
    "S&P 500 stock market today April 2026",
    "NASDAQ stock market performance today",
    "NVDA NVIDIA stock price news today",
    "best performing stocks this week 2026",
    "stocks at 52 week low bottoming 2026",
    "high short interest stocks squeeze candidates"
  ],
  commodities: [
    "crude oil WTI price today 2026",
    "gold price XAU today 2026",
    "copper price today China demand",
    "OPEC oil production news",
    "natural gas prices today"
  ],
  crypto: [
    "Bitcoin BTC price today April 2026",
    "Ethereum ETH price news today",
    "crypto market news today",
    "Bitcoin ETF flows institutional",
    "altcoin market performance today"
  ],
  geopolitical: [
    "US China trade relations tariffs 2026",
    "Middle East oil supply risk",
    "Europe economy news today",
    "geopolitical risks markets 2026",
    "emerging markets currency today"
  ],
  plays: [
    "best stock trades today momentum",
    "swing trade ideas stocks 2026",
    "contrarian stock picks undervalued",
    "high conviction trade ideas",
    "market catalyst events this week"
  ]
}

async function searchBrave(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          "Accept": "application/json",
          "X-Subscription-Token": apiKey
        }
      }
    )
    
    if (!response.ok) {
      console.log("[v0] Brave search failed:", response.status)
      return []
    }
    
    const data = await response.json()
    return (data.web?.results || []).slice(0, 3).map((r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.description
    }))
  } catch (err) {
    console.log("[v0] Brave search error:", err)
    return []
  }
}

async function searchTavily(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: 5,
        include_answer: false
      })
    })
    
    if (!response.ok) {
      console.log("[v0] Tavily search failed:", response.status)
      return []
    }
    
    const data = await response.json()
    return (data.results || []).slice(0, 3).map((r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.substring(0, 300) || ""
    }))
  } catch (err) {
    console.log("[v0] Tavily search error:", err)
    return []
  }
}

// Fallback: use a free news API or scrape finance sites
async function searchFallback(query: string): Promise<SearchResult[]> {
  // Use DuckDuckGo instant answer API (limited but free)
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    const results: SearchResult[] = []
    
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || "",
        snippet: data.AbstractText
      })
    }
    
    // Add related topics
    for (const topic of (data.RelatedTopics || []).slice(0, 3)) {
      if (topic.Text) {
        results.push({
          title: topic.Text.split(" - ")[0] || "",
          url: topic.FirstURL || "",
          snippet: topic.Text
        })
      }
    }
    
    return results
  } catch {
    return []
  }
}

export async function POST(req: Request) {
  try {
    const { sectionId, customQuery } = await req.json()
    
    const braveKey = process.env.BRAVE_API_KEY
    const tavilyKey = process.env.TAVILY_API_KEY
    
    // Get queries for this section
    const queries = customQuery 
      ? [customQuery]
      : SECTION_SEARCH_QUERIES[sectionId] || SECTION_SEARCH_QUERIES.macro
    
    const allResults: SearchResult[] = []
    
    for (const query of queries) {
      let results: SearchResult[] = []
      
      // Try Tavily first (best for market data)
      if (tavilyKey) {
        results = await searchTavily(query, tavilyKey)
      }
      // Then try Brave
      else if (braveKey) {
        results = await searchBrave(query, braveKey)
      }
      // Fallback to DuckDuckGo
      else {
        results = await searchFallback(query)
      }
      
      allResults.push(...results)
    }
    
    // Dedupe by URL
    const seen = new Set()
    const uniqueResults = allResults.filter(r => {
      if (seen.has(r.url)) return false
      seen.add(r.url)
      return true
    })
    
    return new Response(JSON.stringify({ 
      results: uniqueResults.slice(0, 15),
      searchProvider: tavilyKey ? "tavily" : braveKey ? "brave" : "duckduckgo"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.log("[v0] Search error:", errorMessage)
    return new Response(JSON.stringify({ error: errorMessage, results: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
