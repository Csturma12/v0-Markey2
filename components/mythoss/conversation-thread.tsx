"use client"

import { Send, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export interface Message {
  role: "user" | "assistant"
  content: string
}

interface ConversationThreadProps {
  messages: Message[]
  isLoading: boolean
  onSendMessage: (message: string) => Promise<void>
  sectionPrompt: string
}

export function ConversationThread({ messages, isLoading, onSendMessage, sectionPrompt }: ConversationThreadProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")

    try {
      await onSendMessage(userMessage)
    } catch (err) {
      console.error("[v0] Failed to send message:", err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-foreground-dim">
            <div className="text-center">
              <p className="text-[11px] tracking-[0.1em] mb-2">READY FOR FOLLOW-UP QUESTIONS</p>
              <p className="text-[10px] text-foreground/30">Ask for clarification, deeper analysis, or specific tickers</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && <div className="w-6 h-6 flex-shrink-0 rounded-sm bg-gold/10 border border-gold/25 flex items-center justify-center text-[8px] text-gold font-bold">M</div>}

            <div
              className={`max-w-xs md:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-sm text-[12px] md:text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-gold/12 border border-gold/30 text-foreground rounded-br-none"
                  : "bg-foreground-dim/8 border border-foreground/12 text-foreground rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 flex-shrink-0 rounded-sm bg-gold/10 border border-gold/25 flex items-center justify-center text-[8px] text-gold font-bold">M</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-sm text-foreground-dim">
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
              <span className="text-[12px]">Analyzing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gold/8 pt-3 md:pt-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            disabled={isLoading}
            className="flex-1 bg-foreground/5 border border-gold/15 rounded-sm px-3 py-2 text-[12px] md:text-[13px] text-foreground placeholder-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 md:px-4 py-2 bg-gold/12 border border-gold/25 text-gold font-mono text-[10px] md:text-[11px] tracking-[0.1em] rounded-sm transition-all hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">SEND</span>
          </button>
        </div>
      </div>
    </div>
  )
}
