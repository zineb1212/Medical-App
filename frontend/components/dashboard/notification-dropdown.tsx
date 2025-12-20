"use client"

import { useState, useEffect } from "react"
import { Bell, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/use-notifications"
import { useRouter } from "next/navigation"

interface Notification {
    type: 'message' | 'access' | 'consultation'
    id: number
    sender_id: string
    content: string
    timestamp: string
    status?: string // For access requests
}

interface NotificationDropdownProps {
    userId: string
    userRole: "patient" | "doctor"
}

export function NotificationDropdown({ userId, userRole }: NotificationDropdownProps) {
    const router = useRouter()
    const unreadCount = useNotifications(userId)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const handleNotificationClick = async (notif: Notification) => {
        try {
            const token = localStorage.getItem("token") || ""

            if (notif.type === 'message') {
                // 1. Mark as read
                await fetch("http://localhost:5000/api/messages/mark-read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        sender_id: notif.sender_id
                    })
                })

                // 2. Navigate
                const targetView = userRole === "doctor" ? "messages" : "discussion"
                let url = `/dashboard/${userRole}?view=${targetView}`
                if (userRole === "doctor") {
                    url += `&contactId=${notif.sender_id}`
                }
                router.push(url)

            } else if (notif.type === 'access') {
                if (userRole === 'doctor') {
                    // Mark as seen
                    await fetch("http://localhost:5000/api/access/mark-seen", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            request_id: notif.id
                        })
                    })
                    // Stay on current page or maybe go to patients list?
                    // For now, just removing it from list visually is enough mostly
                } else {
                    // Patient: Navigate to access view
                    router.push(`/dashboard/patient?view=request`) // 'request' tab in Patient Dashboard? checking patients-view... wait, patient dashboard uses AccessView for access management
                    // Let's check patient dashboard again. It has 'home', 'dossier', 'chat', 'access'.
                    // So view=access
                    router.push(`/dashboard/patient?view=access`)
                }
            } else if (notif.type === 'consultation') {
                // Mark as seen
                await fetch("http://localhost:5000/api/access/log-seen", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        log_id: notif.id
                    })
                })
                // Go to history
                // Need to support ?tab=history in DossierView or just go to dossier and hope user clicks history
                // I will update DossierView logic to read tab from URL later if needed, but for now just go to dossier?
                // Ideally ?view=dossier&tab=history
                // Does PatientDashboard support view=dossier?
                // PatientDashboard has case "dossier": return <DossierView ... />
                // But DossierView doesn't read URL params yet (except via my next step).
                // I will link to ?view=dossier
                router.push(`/dashboard/patient?view=dossier&tab=history`)
            }

            // Remove from local list
            setNotifications(prev => prev.filter(n => !(n.id === notif.id && n.type === notif.type)))

        } catch (error) {
            console.error("Error handling notification click:", error)
        }
        setIsOpen(false)
    }

    const handleViewAllClick = () => {
        if (userRole === 'doctor') {
            router.push(`/dashboard/doctor?view=messages`)
        } else {
            router.push(`/dashboard/patient?view=discussion`)
        }
        setIsOpen(false)
    }

    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            fetch(`http://localhost:5000/api/notifications/unread-messages?user_id=${userId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) {
                        setNotifications(data)
                    }
                })
                .catch((err) => console.error(err))
        }
    }, [isOpen, unreadCount, userId])

    return (
        <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-xs text-destructive-foreground">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Notifications</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {unreadCount} nouvelle(s) notification(s)
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {unreadCount === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
                            <Bell className="mb-2 h-8 w-8 opacity-20" />
                            <p className="text-sm">Aucune nouvelle notification</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 p-1">
                            {notifications.map((notif) => (
                                <DropdownMenuItem
                                    key={`${notif.type}-${notif.id}`}
                                    className="flex cursor-pointer flex-col items-start gap-1 rounded-lg p-3 focus:bg-accent"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleNotificationClick(notif)
                                    }}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <span className="font-semibold text-xs text-primary">
                                            {notif.type === 'access' ? 'Accès' : notif.sender_id}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 line-clamp-2 w-full">
                                        {notif.content}
                                    </p>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer justify-center text-primary font-medium"
                    onClick={handleViewAllClick}
                >
                    Voir tous les messages
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
