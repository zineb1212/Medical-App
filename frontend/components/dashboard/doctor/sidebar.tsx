"use client"

import { cn } from "@/lib/utils"
import { Home, Users, Calendar, MessageCircle, Activity, Settings } from "lucide-react"

type View = "home" | "patients" | "schedule" | "messages" | "record" | "settings"

interface SidebarProps {
    currentView: View
    onViewChange: (view: View) => void
}

const navItems = [
    { id: "home" as const, label: "Tableau de bord", icon: Home },
    { id: "patients" as const, label: "Mes Patients", icon: Users },
    { id: "schedule" as const, label: "Agenda", icon: Calendar },
    { id: "messages" as const, label: "Messages", icon: MessageCircle },
    { id: "settings" as const, label: "Paramètres", icon: Settings },
]

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    const isActive = (itemId: string) => {
        if (itemId === "patients" && currentView === "record") return true
        return currentView === itemId
    }

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
            {/* Logo */}
            <div className="flex h-16 items-center px-4 border-b border-sidebar-border gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                    <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-sidebar-foreground">MediCare Pro</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 p-4">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                            isActive(item.id)
                                ? "bg-sidebar-accent text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                    >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border p-4">
                <div className="rounded-xl bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">Support Technique</p>
                    <p className="mt-1 text-sm font-semibold text-primary">01 23 45 67 89</p>
                </div>
            </div>
        </aside>
    )
}
