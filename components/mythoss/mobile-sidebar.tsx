"use client"

import { useState } from "react"
import { Menu, X, Zap, Globe, TrendingUp, Fuel, Bitcoin, Map, Target, Loader2 } from "lucide-react"
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

interface MobileSidebarProps {
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

export function MobileSidebar({
  activeSection,
  sectionStatuses,
  onSelectSection,
  onFullScan,
  fullScanProgress,
  customFocus,
  onCustomFocusChange,
  onRunCustom,
  isLoading,
}: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectSection = (id: SectionId) => {
    onSelectSection(id)
    setIsOpen(false)
  }

  return (
    <div className="md:hidden">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-gold text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-background-alt border-r border-gold-border transform transition-transform duration-300 ease-out overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-3 border-b border-gold-border">
          <div className="font-serif font-black text-lg text-gold tracking-widest">MYTHOSS</div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-foreground-dim"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => {
            onFullScan()
            setIsOpen(false)
          }}
          disabled={fullScanProgress !== null}
          className="mx-3 mt-3 p-2.5 w-[calc(100%-1.5rem)] bg-gold-dim border border-gold/40 text-gold font-mono text-[11px] tracking-[0.12em] rounded-sm transition-all hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Zap className="w-3 h-3" />
          FULL MARKET SCAN
        </button>

        {fullScanProgress !== null && (
          <div className="mx-3 mt-2 h-0.5 bg-gold/10 rounded-sm overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-[#f5e4a0] transition-all duration-300"
              style={{ width: `${fullScanProgress}%` }}
            />
          </div>
        )}

        <div className="text-[11px] text-foreground-dim tracking-[0.18em] px-3 pb-1.5 pt-4">
          MODULES
        </div>

        <nav>
          {SECTION_IDS.map((id) => {
            const section = SECTIONS[id]
            const Icon = ICONS[section.icon]
            const status = sectionStatuses[id]
            const isActive = activeSection === id

            return (
              <button
                key={id}
                onClick={() => handleSelectSection(id)}
                className={cn(
                  "flex items-center gap-2.5 w-full py-3 px-3 border-l-2 border-transparent text-foreground/60 font-mono text-left transition-all hover:bg-gold-dim hover:text-gold",
                  isActive && "bg-gold/8 border-l-gold text-gold"
                )}
              >
                {Icon && <Icon className="w-5 h-5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[11px]">{section.label}</div>
                  <div className="text-[10px] opacity-55">{section.desc}</div>
                </div>
                <StatusIndicator status={status} />
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gold-border mt-4">
          <div className="text-[11px] text-foreground-dim tracking-[0.1em] mb-1.5">CUSTOM FOCUS</div>
          <textarea
            value={customFocus}
            onChange={(e) => onCustomFocusChange(e.target.value)}
            placeholder="e.g. focus on NVDA, oil stocks, BTC..."
            className="w-full min-h-[52px] bg-input border border-gold-border text-foreground font-mono text-[11px] p-2 resize-y outline-none rounded-sm placeholder:text-foreground-dim"
          />
          <button
            onClick={() => {
              onRunCustom()
              setIsOpen(false)
            }}
            disabled={isLoading || !activeSection}
            className="w-full mt-1.5 p-2 bg-gold/5 border border-gold/20 text-gold font-mono text-[11px] tracking-[0.1em] rounded-sm transition-all hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed"
          >
            RUN ACTIVE MODULE
          </button>
        </div>
      </div>
    </div>
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
