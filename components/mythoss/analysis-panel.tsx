"use client"

import { RefreshCw, Globe, TrendingUp, Fuel, Bitcoin, Map, Target, Loader2, MessageSquare } from "lucide-react"
import { useState } from "react"
import type { Section, SectionStatus } from "@/lib/sections"
import { ConversationThread, type Message } from "./conversation-thread"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  "trending-up": TrendingUp,
  fuel: Fuel,
  bitcoin: Bitcoin,
  map: Map,
  target: Target,
}

interface AnalysisPanelProps {
  section: Section
  status: SectionStatus
  content: string | null
  error: string | null
  onRefresh: () => void
  conversationMessages?: Message[]
  onSendMessage?: (message: string) => Promise<void>
  isConversationLoading?: boolean
}

export function AnalysisPanel({
  section,
  status,
  content,
  error,
  onRefresh,
  conversationMessages = [],
  onSendMessage,
  isConversationLoading = false,
}: AnalysisPanelProps) {
  const Icon = ICONS[section.icon]
  const [showConversation, setShowConversation] = useState(false)

  return (
    <div className="p-4 md:p-6 max-w-[800px] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 md:mb-5 pb-3 md:pb-4 border-b border-gold-border">
        <div className="flex items-center gap-2 md:gap-3">
          {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 text-foreground/60" />}
          <div>
            <h2 className="font-serif font-bold text-lg md:text-2xl text-gold">{section.label}</h2>
            <div className="text-[10px] md:text-[11px] text-foreground-dim tracking-[0.08em]">
              {section.desc.toUpperCase()} &middot; {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {content && !showConversation && (
            <button
              onClick={() => setShowConversation(true)}
              className="p-1.5 md:p-2 px-2.5 md:px-3 bg-gold/5 border border-gold/25 text-gold font-mono text-[10px] md:text-[11px] tracking-[0.1em] rounded-sm transition-all hover:bg-gold-dim flex items-center gap-1.5"
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline">CHAT</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={status === "loading"}
            className="p-1.5 md:p-2 px-2.5 md:px-3 bg-gold/5 border border-gold/25 text-gold font-mono text-[10px] md:text-[11px] tracking-[0.1em] rounded-sm transition-all hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
        </div>
      </div>

      {/* Show conversation if in chat mode */}
      {showConversation && content ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ConversationThread
            messages={conversationMessages}
            isLoading={isConversationLoading}
            onSendMessage={onSendMessage || (async () => {})}
            sectionPrompt={section.prompt}
          />
          <button
            onClick={() => setShowConversation(false)}
            className="mt-3 text-[10px] text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            ← Back to Analysis
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 gap-3 md:gap-4">
              <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-gold animate-spin" />
              <div className="text-[11px] md:text-[12px] text-foreground-dim tracking-[0.15em]">
                ANALYZING MARKETS...
              </div>
            </div>
          )}

          {status === "error" && error && (
            <div className="p-3 md:p-4 bg-destructive/6 border border-destructive/20 rounded-sm mb-4">
              <div className="text-[12px] md:text-[13px] text-destructive font-bold mb-1">ERROR</div>
              <div className="text-[11px] md:text-[12px] text-destructive/70 font-mono break-all">{error}</div>
              <button
                onClick={onRefresh}
                className="mt-2 md:mt-3 p-1.5 md:p-2 px-3 md:px-4 bg-destructive/8 border border-destructive/25 text-destructive font-mono text-[10px] md:text-[11px] rounded-sm"
              >
                RETRY
              </button>
            </div>
          )}

          {content && status === "done" && (
            <>
              <div className="text-sm md:text-base leading-relaxed">
                <MarkdownRenderer content={content} />
              </div>
              <div className="mt-6 md:mt-8 pt-3 md:pt-4 border-t border-gold/8 text-[9px] md:text-[10px] text-foreground/20 tracking-[0.05em]">
                MYTHOSS INTELLIGENCE — FOR INFORMATIONAL PURPOSES ONLY — NOT FINANCIAL ADVICE — ALL TRADING INVOLVES RISK
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []

  lines.forEach((line, idx) => {
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={idx} className="font-serif text-base md:text-lg text-gold mt-4 md:mt-5 mb-1.5 md:mb-2 pb-1 border-b border-gold/15">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={idx} className="text-[12px] md:text-[13px] font-bold text-[#a8d8b0] mt-3 md:mt-4 mb-1 md:mb-1.5 tracking-[0.05em]">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={idx} className="flex gap-2 mb-1 pl-1">
          <span className="text-gold shrink-0">{"›"}</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (line === "---") {
      elements.push(<hr key={idx} className="border-none border-t border-gold/12 my-3 md:my-4" />)
    } else if (line.trim() === "") {
      elements.push(<div key={idx} className="h-2 md:h-3" />)
    } else {
      elements.push(
        <p key={idx} className="text-foreground my-1">
          {renderInline(line)}
        </p>
      )
    }
  })

  return <>{elements}</>
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  // Handle **bold** and `code`
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // Bold
      parts.push(
        <strong key={keyIdx++} className="text-[#f0e6c8] font-bold">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // Code
      parts.push(
        <code key={keyIdx++} className="bg-gold/8 px-1.5 py-0.5 text-[0.85em] rounded-sm">
          {match[3]}
        </code>
      )
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}
