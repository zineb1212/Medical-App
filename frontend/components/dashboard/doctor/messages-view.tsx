"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Search, MoreVertical, Phone, Video, Paperclip, Image as ImageIcon, File } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
    id: number
    sender_id: string
    receiver_id: string
    content: string
    timestamp: string
    is_read: boolean
    attachment_url?: string
    attachment_type?: string
}

export function MessagesView() {
    const searchParams = useSearchParams()
    const urlContactId = searchParams.get("contactId")

    const [contacts, setContacts] = useState<any[]>([])
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [currentUserId, setCurrentUserId] = useState<string>("")
    const [currentAttachment, setCurrentAttachment] = useState<{ url: string, type: string } | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch("http://localhost:5000/api/upload", {
                method: "POST",
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                setCurrentAttachment({
                    url: data.url,
                    type: data.type
                })
            }
        } catch (error) {
            console.error("Error uploading file:", error)
        } finally {
            setIsUploading(false)
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    // 1. Load User
    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            const user = JSON.parse(storedUser)
            setCurrentUserId(user.id)
        }
    }, [])

    // 2. Sync selection with URL
    useEffect(() => {
        if (urlContactId) {
            setSelectedContactId(urlContactId)
        }
    }, [urlContactId])

    // 3. Fetch Contacts (Polling)
    useEffect(() => {
        if (!currentUserId) return

        const fetchContacts = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/contacts")
                if (res.ok) {
                    const data = await res.json()
                    const others = data.filter((u: any) => u.id !== currentUserId)
                    setContacts(others)

                    // Only set default if:
                    // - we have contacts
                    // - NO contact is currently selected (using the latest state)
                    // - NO URL param exists (using the latest state)
                    if (others.length > 0 && !selectedContactId && !urlContactId) {
                        setSelectedContactId(others[0].id)
                    }
                }
            } catch (error) {
                console.error("Error fetching contacts:", error)
            }
        }

        // Initial fetch
        fetchContacts()

        // Poll every 5s
        const interval = setInterval(fetchContacts, 5000)
        return () => clearInterval(interval)
    }, [currentUserId, selectedContactId, urlContactId]) // Re-added selectedContactId and urlContactId to dependencies to ensure the default selection logic uses the latest values.

    // Fetch messages for selected contact
    useEffect(() => {
        if (!selectedContactId || !currentUserId) return

        const fetchMessages = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/messages?user1_id=${currentUserId}&user2_id=${selectedContactId}`)
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data)

                    // Mark as read
                    await fetch("http://localhost:5000/api/messages/mark-read", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: currentUserId,
                            sender_id: selectedContactId
                        })
                    })
                }
            } catch (error) {
                console.error("Error fetching messages:", error)
            }
        }

        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [selectedContactId, currentUserId])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!newMessage.trim() && !currentAttachment) || !selectedContactId || !currentUserId) return

        try {
            const res = await fetch("http://localhost:5000/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender_id: currentUserId,
                    receiver_id: selectedContactId,
                    content: newMessage,
                    attachment_url: currentAttachment?.url,
                    attachment_type: currentAttachment?.type
                }),
            })

            if (res.ok) {
                setNewMessage("")
                setCurrentAttachment(null)
                // Refresh messages
                const refreshRes = await fetch(`http://localhost:5000/api/messages?user1_id=${currentUserId}&user2_id=${selectedContactId}`)
                const data = await refreshRes.json()
                setMessages(data)
            }
        } catch (error) {
            console.error("Error sending message:", error)
        }
    }

    const selectedContact = contacts.find(c => c.id === selectedContactId)

    return (
        <div className="h-[calc(100vh-8rem)] grid grid-cols-12 gap-6">
            {/* Sidebar - Contacts */}
            <Card className="col-span-4 flex flex-col rounded-2xl border-0 shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher..." className="pl-9 bg-muted/50 border-0" />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {contacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedContactId(contact.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedContactId === contact.id ? 'bg-primary/10' : 'hover:bg-accent/10'}`}
                            >
                                <Avatar>
                                    <AvatarImage src={contact.avatar_url || "/placeholder-user.jpg"} />
                                    <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-medium ${selectedContactId === contact.id ? 'text-primary' : 'text-foreground'}`}>{contact.name}</span>
                                        <span className="text-xs text-muted-foreground">{contact.role}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        Cliquez pour discuter
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Main Chat Area */}
            <Card className="col-span-8 flex flex-col rounded-2xl border-0 shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between bg-card">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={selectedContact?.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{selectedContact?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold">{selectedContact?.name || "Sélectionnez un contact"}</h3>
                            <p className="text-xs text-primary flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                En ligne
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Video className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>

                {/* Messages List */}
                <ScrollArea className="flex-1 p-4 bg-muted/20">
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMe
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-white border rounded-bl-none"
                                            }`}
                                    >
                                        {msg.attachment_url && (
                                            <div className="mb-2">
                                                {msg.attachment_type === 'image' ? (
                                                    <img
                                                        src={msg.attachment_url}
                                                        alt="Attachment"
                                                        className="max-w-full rounded-lg max-h-[200px] object-cover"
                                                    />
                                                ) : (
                                                    <a
                                                        href={msg.attachment_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-primary-foreground/90 underline"
                                                    >
                                                        <File className="h-4 w-4" />
                                                        Voir le fichier
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-sm">{msg.content}</p>
                                        <span className={`text-[10px] block mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-card border-t">
                    {currentAttachment && (
                        <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                            <span className="text-xs truncate max-w-[200px]">{currentAttachment.url.split('/').pop()}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setCurrentAttachment(null)}
                            >
                                &times;
                            </Button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-muted-foreground hover:text-primary"
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input
                            placeholder="Écrivez votre message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                        />
                        <Button type="submit" size="icon" className="rounded-xl h-10 w-10">
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
