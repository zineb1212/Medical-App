"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Search, MoreVertical, Phone, Video, Image as ImageIcon, Mic, Paperclip, File } from "lucide-react"
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

export function DiscussionView() {
  const searchParams = useSearchParams()
  const contactId = searchParams.get("contactId")

  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
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
    if (contactId) {
      setSelectedDoctorId(contactId)
    }
  }, [contactId])

  // 3. Fetch Doctors (Poll)
  useEffect(() => {
    if (!currentUserId) return

    const fetchDoctors = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/contacts")
        if (res.ok) {
          const data = await res.json()
          // Filter for doctors only, and exclude self (though redundant for patients)
          const docs = data.filter((u: any) =>
            (u.role === "doctor" || u.role === "docteur") && u.id !== currentUserId
          )
          setDoctors(docs)

          // Auto-select first doctor if none selected
          if (docs.length > 0 && !selectedDoctorId && !contactId) {
            setSelectedDoctorId(docs[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching contacts:", error)
      }
    }

    fetchDoctors()
    const interval = setInterval(fetchDoctors, 5000)
    return () => clearInterval(interval)
  }, [currentUserId, selectedDoctorId, contactId])

  // 4. Fetch Messages
  useEffect(() => {
    if (!selectedDoctorId || !currentUserId) return

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/messages?user1_id=${currentUserId}&user2_id=${selectedDoctorId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data)

          // Mark as read
          if (data.length > 0) {
            await fetch("http://localhost:5000/api/messages/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: currentUserId,
                sender_id: selectedDoctorId
              })
            })
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [selectedDoctorId, currentUserId])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !currentAttachment) || !selectedDoctorId || !currentUserId) return

    try {
      const res = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          receiver_id: selectedDoctorId,
          content: newMessage,
          attachment_url: currentAttachment?.url,
          attachment_type: currentAttachment?.type
        }),
      })

      if (res.ok) {
        setNewMessage("")
        setCurrentAttachment(null)
        const refreshRes = await fetch(`http://localhost:5000/api/messages?user1_id=${currentUserId}&user2_id=${selectedDoctorId}`)
        const data = await refreshRes.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const selectedDoctor = doctors.find(c => c.id === selectedDoctorId)

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-12 gap-6">
      {/* Sidebar - Doctors */}
      <Card className="col-span-4 flex flex-col rounded-2xl border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Mes Docteurs</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un médecin..." className="pl-9 bg-muted/50 border-0" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {doctors.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoctorId(doc.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedDoctorId === doc.id ? 'bg-primary/10' : 'hover:bg-accent/10'}`}
              >
                <Avatar>
                  <AvatarImage src={doc.avatar_url || "/male-doctor-portrait.png"} />
                  <AvatarFallback>{doc.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${selectedDoctorId === doc.id ? 'text-primary' : 'text-foreground'}`}>{doc.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Médecin Généraliste
                  </p>
                </div>
              </div>
            ))}
            {doctors.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun médecin trouvé.
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <Card className="col-span-8 flex flex-col rounded-2xl border-0 shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={selectedDoctor?.avatar_url || "/male-doctor-portrait.png"} />
              <AvatarFallback>{selectedDoctor?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{selectedDoctor?.name || "Sélectionnez un médecin"}</h3>
              {selectedDoctor && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  En ligne
                </p>
              )}
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
                      : "bg-background border rounded-bl-none"
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
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
              className="text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
              <Mic className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Écrivez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 rounded-full bg-muted/50 focus-visible:ring-1"
            />
            <Button type="submit" size="icon" className="rounded-full h-10 w-10">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
