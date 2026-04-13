"use client"

import { useState, useCallback } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Welcome } from "./welcome"
import { AnalysisPanel } from "./analysis-panel"
import { MobileSidebar } from "./mobile-sidebar"
import { SECTIONS, SECTION_IDS, type SectionId, type SectionStatus } from "@/lib/sections"

export function Dashboard() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [sectionStatuses, setSectionStatuses] = useState<Record<SectionId, SectionStatus>>(
    Object.fromEntries(SECTION_IDS.map((id) => [id, "idle"])) as Record<SectionId, SectionStatus>
  )
  const [sectionData, setSectionData] = useState<Record<SectionId, string | null>>(
    Object.fromEntries(SECTION_IDS.map((id) => [id, null])) as Record<SectionId, string | null>
  )
  const [sectionErrors, setSectionErrors] = useState<Record<SectionId, string | null>>(
    Object.fromEntries(SECTION_IDS.map((id) => [id, null])) as Record<SectionId, string | null>
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

      const prompt = customText ? `${section.prompt}\n\nAdditional focus from user: ${customText}` : section.prompt

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
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
      runSection(activeSection, customFocus)
    }
  }, [activeSection, customFocus, runSection])

  const runCustom = useCallback(() => {
    if (activeSection) {
      setSectionData((prev) => ({ ...prev, [activeSection]: null }))
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
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}
