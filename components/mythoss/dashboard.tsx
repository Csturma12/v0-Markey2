"use client"

import { useState, useCallback } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Welcome } from "./welcome"
import { AnalysisPanel } from "./analysis-panel"
import { MobileSidebar } from "./mobile-sidebar"
import { SECTIONS, SECTION_IDS, type SectionId, type SectionStatus } from "@/lib/sections"
import type { Message } from "./conversation-thread"

export function Dashboard() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [sectionStatuses, setSectionStatuses] = useState<Record<SectionId, SectionStatus>>(() =>
    Object.fromEntries(SECTION_IDS.map((id) => [id, "idle"])) as Record<SectionId, SectionStatus>
  )
  const [sectionData, setSectionData] = useState<Record<SectionId, string | null>>(() =>
    Object.fromEntries(SECTION_IDS.map((id) => [id, null])) as Record<SectionId, string | null>
  )
  const [sectionErrors, setSectionErrors] = useState<Record<SectionId, string | null>>(() =>
    Object.fromEntries(SECTION_IDS.map((id) => [id, null])) as Record<SectionId, string | null>
  )
  const [conversationMessages, setConversationMessages] = useState<Record<SectionId, Message[]>>(() =>
    Object.fromEntries(SECTION_IDS.map((id) => [id, []])) as Record<SectionId, Message[]>
  )
  const [conversationLoading, setConversationLoading] = useState<Record<SectionId, boolean>>(() =>
    Object.fromEntries(SECTION_IDS.map((id) => [id, false])) as Record<SectionId, boolean>
  )
  const [customFocus, setCustomFocus] = useState("")
  const [fullScanProgress, setFullScanProgress] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const runSection = useCallback(
    async (id: SectionId, customText = "") => {
      const section = SECTIONS[id]
      if (!section) return

      setSectionStatuses((prev) => ({ ...prev, [id]: "loading" }))
      setSectionErrors((prev) => ({ ...prev, [id]: null }))

      try {
        // Step 1: Fetch real-time market data from web search
        let marketContext = ""
        try {
          const searchRes = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              sectionId: id,
              customQuery: customText || null
            }),
          })
          
          const searchData = await searchRes.json()
          
          if (searchData.results && searchData.results.length > 0) {
            marketContext = `\n\n--- REAL-TIME MARKET DATA (fetched ${new Date().toLocaleString()}) ---\n`
            marketContext += searchData.results
              .map((r: { title: string; snippet: string; url: string }) => 
                `**${r.title}**\n${r.snippet}\nSource: ${r.url}`
              )
              .join("\n\n")
            marketContext += "\n--- END MARKET DATA ---\n"
          }
        } catch (searchErr) {
          console.log("[v0] Search failed, continuing without real-time data:", searchErr)
        }

        // Step 2: Build prompt with market context
        let prompt = section.prompt
        if (marketContext) {
          prompt = `${section.prompt}\n\nIMPORTANT: Use the following REAL-TIME market data I've gathered to inform your analysis. Reference specific data points, prices, and news from these sources:\n${marketContext}`
        }
        if (customText) {
          prompt += `\n\nAdditional focus from user: ${customText}`
        }

        // Step 3: Call AI with enriched prompt
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
          }),
        })

        const json = await res.json()

        if (json.error) {
          throw new Error(json.error.message || JSON.stringify(json.error))
        }

        const text = (json.content || [])
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n")

        if (!text) {
          throw new Error("Empty response from API")
        }

        setSectionData((prev) => ({ ...prev, [id]: text }))
        setSectionStatuses((prev) => ({ ...prev, [id]: "done" }))
        setLastUpdated(`Updated ${new Date().toLocaleTimeString()}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setSectionErrors((prev) => ({ ...prev, [id]: errorMessage }))
        setSectionStatuses((prev) => ({ ...prev, [id]: "error" }))
      }
    },
    []
  )

  const handleSendMessage = useCallback(
    async (sectionId: SectionId, userMessage: string) => {
      if (!userMessage.trim()) return

      const section = SECTIONS[sectionId]
      if (!section) return

      // Add user message to conversation
      setConversationMessages((prev) => ({
        ...prev,
        [sectionId]: [...prev[sectionId], { role: "user", content: userMessage }],
      }))

      setConversationLoading((prev) => ({ ...prev, [sectionId]: true }))

      try {
        // Search for relevant data based on user question
        let searchContext = ""
        try {
          const searchRes = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              sectionId: sectionId,
              customQuery: userMessage
            }),
          })
          const searchData = await searchRes.json()
          
          if (searchData.results && searchData.results.length > 0) {
            searchContext = `\n\n[REAL-TIME DATA for this question]:\n`
            searchContext += searchData.results
              .slice(0, 5)
              .map((r: { title: string; snippet: string }) => `- ${r.title}: ${r.snippet}`)
              .join("\n")
          }
        } catch {
          // Continue without search data
        }

        // Build message history with original analysis context
        const enrichedMessage = searchContext 
          ? `${userMessage}\n${searchContext}`
          : userMessage

        const allMessages = [
          { role: "user" as const, content: section.prompt },
          { role: "assistant" as const, content: sectionData[sectionId] || "" },
          ...conversationMessages[sectionId],
          { role: "user" as const, content: enrichedMessage },
        ]

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: allMessages,
          }),
        })

        const json = await res.json()

        if (json.error) {
          throw new Error(json.error.message || JSON.stringify(json.error))
        }

        const text = (json.content || [])
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n")

        if (!text) {
          throw new Error("Empty response from API")
        }

        // Add assistant response to conversation
        setConversationMessages((prev) => ({
          ...prev,
          [sectionId]: [...prev[sectionId], { role: "assistant", content: text }],
        }))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"

        // Add error message to conversation
        setConversationMessages((prev) => ({
          ...prev,
          [sectionId]: [
            ...prev[sectionId],
            {
              role: "assistant",
              content: `Error: ${errorMessage}. Please try again or refresh the analysis.`,
            },
          ],
        }))
      } finally {
        setConversationLoading((prev) => ({ ...prev, [sectionId]: false }))
      }
    },
    [sectionData, conversationMessages]
  )

  const selectSection = useCallback(
    (id: SectionId, autoRun = true) => {
      setActiveSection(id)
      if (autoRun && !sectionData[id] && sectionStatuses[id] !== "loading") {
        runSection(id)
      }
    },
    [sectionData, sectionStatuses, runSection]
  )

  const runFullScan = useCallback(async () => {
    if (fullScanProgress !== null) return

    setFullScanProgress(0)

    for (let i = 0; i < SECTION_IDS.length; i++) {
      const id = SECTION_IDS[i]
      setFullScanProgress(Math.round((i / SECTION_IDS.length) * 100))

      if (!activeSection) {
        setActiveSection(id)
      }

      await runSection(id)
      await new Promise((r) => setTimeout(r, 150))
    }

    setFullScanProgress(100)
    setTimeout(() => setFullScanProgress(null), 1500)
  }, [activeSection, fullScanProgress, runSection])

  const refreshCurrent = useCallback(() => {
    if (activeSection) {
      setSectionData((prev) => ({ ...prev, [activeSection]: null }))
      setConversationMessages((prev) => ({ ...prev, [activeSection]: [] }))
      runSection(activeSection, customFocus)
    }
  }, [activeSection, customFocus, runSection])

  const runCustom = useCallback(() => {
    if (activeSection) {
      setSectionData((prev) => ({ ...prev, [activeSection]: null }))
      setConversationMessages((prev) => ({ ...prev, [activeSection]: [] }))
      runSection(activeSection, customFocus)
    }
  }, [activeSection, customFocus, runSection])

  const currentSection = activeSection ? SECTIONS[activeSection] : null
  const isLoading = activeSection ? sectionStatuses[activeSection] === "loading" : false

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header lastUpdated={lastUpdated} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            activeSection={activeSection}
            sectionStatuses={sectionStatuses}
            onSelectSection={selectSection}
            onFullScan={runFullScan}
            fullScanProgress={fullScanProgress}
            customFocus={customFocus}
            onCustomFocusChange={setCustomFocus}
            onRunCustom={runCustom}
            isLoading={isLoading}
          />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar
          activeSection={activeSection}
          sectionStatuses={sectionStatuses}
          onSelectSection={selectSection}
          onFullScan={runFullScan}
          fullScanProgress={fullScanProgress}
          customFocus={customFocus}
          onCustomFocusChange={setCustomFocus}
          onRunCustom={runCustom}
          isLoading={isLoading}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {!activeSection ? (
            <Welcome onSelectSection={selectSection} />
          ) : currentSection ? (
            <AnalysisPanel
              section={currentSection}
              status={sectionStatuses[activeSection]}
              content={sectionData[activeSection]}
              error={sectionErrors[activeSection]}
              onRefresh={refreshCurrent}
              conversationMessages={conversationMessages[activeSection] || []}
              onSendMessage={(msg) => handleSendMessage(activeSection, msg)}
              isConversationLoading={conversationLoading[activeSection] || false}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}
