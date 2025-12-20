"use client"

import { useState, useEffect } from "react"
import { Bell, LogOut, Settings, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

import { NotificationDropdown } from "@/components/dashboard/notification-dropdown"

export function Header() {
    const router = useRouter()
    const [user, setUser] = useState<{ name: string; role: string; id: string; avatar_url: string } | null>(null)

    useEffect(() => {
        const loadUser = () => {
            const storedUser = localStorage.getItem("user")
            if (storedUser) {
                setUser(JSON.parse(storedUser))
            }
        }
        loadUser()

        const handleUserUpdate = () => loadUser()
        window.addEventListener("user-updated", handleUserUpdate)
        return () => window.removeEventListener("user-updated", handleUserUpdate)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        router.push("/auth/login")
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <div>
                <h1 className="text-lg font-semibold text-foreground">Espace Médecin</h1>
                <p className="text-xs text-muted-foreground">Tableau de bord</p>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                {user && <NotificationDropdown userId={user.id} userRole={user.role as "patient" | "doctor"} />}

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex h-auto items-center gap-3 rounded-xl p-2 hover:bg-muted">
                            <Avatar className="h-9 w-9 border-2 border-primary/20">
                                <AvatarImage src={user?.avatar_url || "/male-doctor-portrait.png"} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {user?.name ? user.name[0] : "D"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <p className="text-sm font-medium text-foreground">{user?.name || "Médecin"}</p>
                                <p className="text-xs text-muted-foreground">Médecin Généraliste</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                        <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => router.push('/dashboard/doctor?view=settings')}>
                            <User className="mr-2 h-4 w-4" />
                            Mon Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => router.push('/dashboard/doctor?view=settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            Paramètres
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Déconnexion
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
