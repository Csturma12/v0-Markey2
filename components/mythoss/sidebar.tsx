"use client"

import { Zap, Globe, TrendingUp, Fuel, Bitcoin, Map, Target, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SectionId, SectionStatus } from "@/lib/sections"
import { SECTIONS, SECTION_IDS } from "@/lib/sections"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  "trending-up": TrendingUp,
  fuel: Fuel,
  bitcoin: Bitcoin,
  map: Map,
  target: Target,
}

interface SidebarProps {
  activeSection: SectionId | null
  sectionStatuses: Record<SectionId, SectionStatus>
  onSelectSection: (id: SectionId) => void
  onFullScan: () => void
  fullScanProgress: number | null
  customFocus: string
  onCustomFocusChange: (value: string) => void
  onRunCustom: () => void
  isLoading: boolean
}

export function Sidebar({
  activeSection,
  sectionStatuses,
  onSelectSection,
  onFullScan,
  fullScanProgress,
  customFocus,
  onCustomFocusChange,
  onRunCustom,
  isLoading,
}: SidebarProps) {
  return (
    <aside className="w-[170px] md:w-[220px] min-w-[170px] md:min-w-[220px] border-r border-gold-border flex flex-col bg-background-alt overflow-y-auto">
      <button
        onClick={onFullScan}
        disabled={fullScanProgress !== null}
        className="mx-2 md:mx-3 mt-2 md:mt-3 p-2 md:p-2.5 bg-gold-dim border border-gold/40 text-gold font-mono text-[10px] md:text-[11px] tracking-[0.12em] rounded-sm transition-all hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Zap className="w-3 h-3" />
        FULL MARKET SCAN
      </button>

      {fullScanProgress !== null && (
        <div className="mx-2 md:mx-3 mt-2 h-0.5 bg-gold/10 rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-[#f5e4a0] transition-all duration-300"
            style={{ width: `${fullScanProgress}%`, boxShadow: "0 0 6px rgba(232,201,122,0.5)" }}
          />
        </div>
      )}

      <div className="text-[10px] md:text-[11px] text-foreground-dim tracking-[0.18em] px-2 md:px-3 pb-1 md:pb-1.5 pt-3 md:pt-4">
        MODULES
      </div>

      <nav className="flex-1">
        {SECTION_IDS.map((id) => {
          const section = SECTIONS[id]
          const Icon = ICONS[section.icon]
          const status = sectionStatuses[id]
          const isActive = activeSection === id

          return (
            <button
              key={id}
              onClick={() => onSelectSection(id)}
              className={cn(
                "flex items-center gap-2 md:gap-2.5 w-full py-2 md:py-2.5 px-2 md:px-3 border-l-2 border-transparent text-foreground/60 font-mono text-left transition-all hover:bg-gold-dim hover:text-gold",
                isActive && "bg-gold/8 border-l-gold text-gold"
              )}
            >
              {Icon && <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[10px] md:text-[11px]">{section.label}</div>
                <div className="text-[9px] md:text-[10px] opacity-55">{section.desc}</div>
              </div>
              <StatusIndicator status={status} />
            </button>
          )
        })}
      </nav>

      <div className="p-2 md:p-3 border-t border-gold-border mt-auto">
        <div className="text-[10px] md:text-[11px] text-foreground-dim tracking-[0.1em] mb-1.5">
          CUSTOM FOCUS
        </div>
        <textarea
          value={customFocus}
          onChange={(e) => onCustomFocusChange(e.target.value)}
          placeholder="e.g. focus on NVDA, oil stocks, BTC..."
          className="w-full min-h-[48px] md:min-h-[52px] bg-input border border-gold-border text-foreground font-mono text-[10px] md:text-[11px] p-1.5 md:p-2 resize-y outline-none rounded-sm placeholder:text-foreground-dim"
        />
        <button
          onClick={onRunCustom}
          disabled={isLoading || !activeSection}
          className="w-full mt-1.5 p-1.5 md:p-2 bg-gold/5 border border-gold/20 text-gold font-mono text-[10px] md:text-[11px] tracking-[0.1em] rounded-sm transition-all hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed"
        >
          RUN ACTIVE MODULE
        </button>
      </div>
    </aside>
  )
}

function StatusIndicator({ status }: { status: SectionStatus }) {
  if (status === "loading") {
    return <Loader2 className="w-3 h-3 text-gold animate-spin shrink-0" />
  }
  if (status === "done") {
    return <div className="w-2 h-2 rounded-full bg-success shrink-0" />
  }
  if (status === "error") {
    return <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
  }
  return <div className="w-2 h-2 shrink-0" />
}
