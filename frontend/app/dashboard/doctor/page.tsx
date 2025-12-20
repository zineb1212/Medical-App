"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Sidebar } from "../../../components/dashboard/doctor/sidebar"
import { Header } from "../../../components/dashboard/doctor/header"
import { HomeView } from "../../../components/dashboard/doctor/home-view"
import { PatientsView } from "../../../components/dashboard/doctor/patients-view"
import { ScheduleView } from "../../../components/dashboard/doctor/schedule-view"
import { MessagesView } from "../../../components/dashboard/doctor/messages-view"

import { SettingsView } from "../../../components/dashboard/doctor/settings-view"
import { DossierView } from "../../../components/dashboard/patient/dossier-view" // Correct import path
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

type View = "home" | "patients" | "schedule" | "messages" | "record" | "settings"

export default function DoctorDashboard() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const currentView = (searchParams.get("view") as View) || "home"
    const patientId = searchParams.get("patientId")

    const handleViewChange = (view: View) => {
        router.push(`/dashboard/doctor?view=${view}`)
    }

    const renderView = () => {
        switch (currentView) {
            case "home":
                return <HomeView />
            case "patients":
                return <PatientsView />
            case "schedule":
                return <ScheduleView />
            case "messages":
                return <MessagesView />
            case "settings":
                return <SettingsView />
            case "record":
                return (
                    <div className="space-y-4">
                        <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                        </Button>
                        <DossierView userId={patientId!} readOnly={true} />
                    </div>
                )
            default:
                return <HomeView />
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
