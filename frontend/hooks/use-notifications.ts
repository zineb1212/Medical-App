"use client"

import { useState, useEffect } from "react"

export function useNotifications(userId: string) {
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!userId) return

        const fetchNotifications = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/notifications/unread-count?user_id=${userId}`)
                if (res.ok) {
                    const data = await res.json()
                    setUnreadCount(data.count)
                }
            } catch (error) {
                console.error("Error fetching notifications:", error)
            }
        }

        fetchNotifications()
        const interval = setInterval(fetchNotifications, 5000) // Poll every 5s

        return () => clearInterval(interval)
    }, [userId])

    return unreadCount
}
