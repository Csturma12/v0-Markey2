"use client"

import { Zap } from "lucide-react"

interface HeaderProps {
  lastUpdated: string | null
}

export function Header({ lastUpdated }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-3 py-2 md:px-5 md:py-3 border-b border-gold-border bg-background-alt shrink-0">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 border border-gold rounded-full flex items-center justify-center animate-glow">
          <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold" />
        </div>
        <div>
          <div className="font-serif font-black text-base md:text-xl text-gold tracking-widest">
            MYTHOSS
          </div>
          <div className="text-[10px] md:text-[11px] text-foreground-dim tracking-[0.15em]">
            MARKET INTELLIGENCE
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {lastUpdated && (
          <div className="text-[10px] md:text-[11px] text-foreground-dim hidden sm:block">
            {lastUpdated}
          </div>
        )}
        <div className="w-2 h-2 rounded-full bg-success animate-pulse-status" />
        <div className="text-[10px] md:text-[11px] text-success tracking-[0.1em]">
          ONLINE
        </div>
      </div>
    </header>
  )
}
