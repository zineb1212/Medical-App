"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Save, Loader2 } from "lucide-react"

export function SettingsView() {
    const [user, setUser] = useState<any>(null)
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const userData = JSON.parse(userStr)
            setUser(userData)
            setName(userData.name || "")
        }
    }, [])

    const handleSave = async () => {
        setLoading(true)
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name,
                    avatar_url: user.avatar_url
                })
            })
            if (res.ok) {
                const data = await res.json()
                localStorage.setItem('user', JSON.stringify(data.user))
                setUser(data.user)
                window.dispatchEvent(new Event("user-updated"))
                alert("Profil mis à jour !")
            } else {
                alert("Erreur lors de la mise à jour.")
            }
        } catch (e) {
            console.error(e)
            alert("Erreur de connexion.")
        } finally {
            setLoading(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData
            })
            if (res.ok) {
                const data = await res.json()
                const newUser = { ...user, avatar_url: data.url }
                setUser(newUser)

                const token = localStorage.getItem('token')
                await fetch('http://localhost:5000/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        avatar_url: data.url
                    })
                })

                localStorage.setItem('user', JSON.stringify(newUser))
                window.dispatchEvent(new Event("user-updated"))
            } else {
                alert("Erreur lors de l'upload.")
            }
        } catch (e) {
            console.error(e)
            alert("Erreur d'upload.")
        } finally {
            setUploading(false)
        }
    }

    if (!user) return <div>Chargement...</div>

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                <h1 className="text-2xl font-bold">Mon Profil Médecin</h1>
                <p className="mt-1 text-primary-foreground/80">Gérer vos informations professionnelles</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informations Générales</CardTitle>
                    <CardDescription>Modifiez votre photo et votre nom d'affichage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 cursor-pointer">
                                <AvatarImage src={user.avatar_url || "/male-doctor-portrait.png"} />
                                <AvatarFallback className="text-xl">
                                    {user.name ? user.name[0] : "D"}
                                </AvatarFallback>
                            </Avatar>
                            <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Camera className="h-6 w-6" />
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                            <h3 className="font-medium text-lg">Photo de profil</h3>
                            <p className="text-sm text-muted-foreground">Cliquez sur l'image pour modifier. JPG, PNG acceptés.</p>
                            {uploading && <p className="text-xs text-primary animate-pulse">Téléchargement en cours...</p>}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Professionnel</Label>
                            <Input id="email" value={user.id} disabled className="bg-muted" />
                            <p className="text-[10px] text-muted-foreground">L'email ne peut pas être modifié.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nom complet (avec titre)</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Dr. Votre Nom"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={loading || uploading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer les modifications
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
