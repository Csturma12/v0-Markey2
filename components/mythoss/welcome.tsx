"use client"

import { Globe, TrendingUp, Fuel, Bitcoin, Map, Target } from "lucide-react"
import type { SectionId } from "@/lib/sections"

const CARDS: Array<{ id: SectionId; icon: React.ComponentType<{ className?: string }>; name: string; desc: string }> = [
  { id: "macro", icon: Globe, name: "MACRO", desc: "Economy & Fed Policy" },
  { id: "equities", icon: TrendingUp, name: "EQUITIES", desc: "Stocks & Sectors" },
  { id: "commodities", icon: Fuel, name: "COMMODITIES", desc: "Oil, Gold, Metals" },
  { id: "crypto", icon: Bitcoin, name: "CRYPTO", desc: "Digital Assets" },
  { id: "geopolitical", icon: Map, name: "GEO/POL", desc: "Global Risk & Tariffs" },
  { id: "plays", icon: Target, name: "TRADE PLAYS", desc: "Top Actionable Ideas" },
]

interface WelcomeProps {
  onSelectSection: (id: SectionId) => void
}

export function Welcome({ onSelectSection }: WelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <h1 className="font-serif font-black text-3xl md:text-6xl text-gold/7 tracking-[0.25em] text-center mb-4 md:mb-6">
        MYTHOSS
      </h1>
      <div className="grid grid-cols-2 gap-2 md:gap-3 max-w-[420px] w-full">
        {CARDS.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.id}
              onClick={() => onSelectSection(card.id)}
              className="p-3 md:p-4 text-center bg-gold/3 border border-gold-border rounded-sm transition-all hover:bg-gold-dim hover:border-gold/40 min-h-[88px]"
            >
              <Icon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-foreground/60" />
              <div className="text-gold font-bold text-[10px] md:text-[11px]">{card.name}</div>
              <div className="text-[9px] md:text-[10px] opacity-50 mt-0.5">{card.desc}</div>
            </button>
          )
        })}
      </div>
      <div className="mt-4 md:mt-6 text-[10px] md:text-[11px] text-foreground-dim tracking-[0.1em]">
        SELECT A MODULE OR HIT FULL MARKET SCAN
      </div>
    </div>
  )
}
