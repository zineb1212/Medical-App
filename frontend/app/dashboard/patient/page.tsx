"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sidebar } from "../../../components/dashboard/patient/sidebar";
import { Header } from "../../../components/dashboard/patient/header";
import { HomeView } from "../../../components/dashboard/patient/home-view"
import { DiscussionView } from "../../../components/dashboard/patient/discussion-view"
import { DossierView } from "../../../components/dashboard/patient/dossier-view"
import { AIAssistantView } from "../../../components/dashboard/patient/ai-assistant-view"
import { AccessView } from "../../../components/dashboard/patient/access-view"
import { SettingsView } from "../../../components/dashboard/patient/settings-view"

type View = "home" | "discussion" | "dossier" | "ai" | "access" | "settings"

export default function PatientDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentView = (searchParams.get("view") as View) || "home"

  const handleViewChange = (view: View) => {
    router.push(`/dashboard/patient?view=${view}`)
  }

  const handleStartDiscussion = (doctorId: number) => {
    handleViewChange("discussion")
  }

  const renderView = () => {
    switch (currentView) {
      case "home":
        return <HomeView onStartDiscussion={handleStartDiscussion} />
      case "discussion":
        return <DiscussionView />
      case "dossier":
        return <DossierView />
      case "ai":
        return <AIAssistantView />
      case "access":
        return <AccessView />
      case "settings":
        return <SettingsView />
      default:
        return <HomeView onStartDiscussion={handleStartDiscussion} />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <div className="flex-1 flex flex-col pl-64">
        <Header />
        <main className="p-6 flex-1 overflow-auto">{renderView()}</main>
      </div>
    </div>
  )
}
