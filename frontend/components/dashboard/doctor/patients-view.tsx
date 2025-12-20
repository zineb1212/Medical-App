
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { accessService } from "../../../services/accessService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, UserCheck, Clock, CheckCircle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PatientsView() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("list")
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Request Form State
    const [patientEmail, setPatientEmail] = useState("")
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [requestStatus, setRequestStatus] = useState("")

    const [availablePatients, setAvailablePatients] = useState<any[]>([])

    useEffect(() => {
        loadRequests()
        loadPatients()
    }, [])

    const loadPatients = async () => {
        try {
            const data = await accessService.getPatients()
            setAvailablePatients(data)
        } catch (error) {
            console.error("Failed to load patients", error)
        }
    }

    const loadRequests = async () => {
        try {
            const token = localStorage.getItem('token') || ''
            const data = await accessService.getRequests(token)
            setRequests(data)
        } catch (error) {
            console.error("Failed to load requests", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRequestAccess = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setRequestStatus("")

        try {
            const token = localStorage.getItem('token') || ''
            await accessService.requestAccess(patientEmail, message, "permanent", token)
            setRequestStatus("success")
            setPatientEmail("")
            setMessage("")
            loadRequests()
        } catch (error) {
            console.error("Request failed", error)
            setRequestStatus("error")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteRequest = async (requestId: number) => {
        if (!confirm("Voulez-vous supprimer cette demande de l'historique ?")) return
        try {
            const token = localStorage.getItem('token') || ''
            await accessService.deleteRequest(requestId, token)
            loadRequests()
        } catch (error) {
            console.error("Failed to delete request", error)
        }
    }

    const authorizedPatients = requests.filter(r => r.status === 'approved')
    const pendingRequests = requests.filter(r => r.status === 'pending')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Mes Patients</h2>
                <Button onClick={() => setActiveTab("request")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Patient
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">Patients Autorisés</TabsTrigger>
                    <TabsTrigger value="request">Demandes & Accès</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-green-600" />
                                Patients suivis
                            </CardTitle>
                            <CardDescription>Liste des patients qui vous ont autorisé l'accès.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <p>Chargement...</p> : (
                                authorizedPatients.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>Aucun patient suivi pour le moment.</p>
                                        <Button variant="link" onClick={() => setActiveTab("request")}>Demander un accès</Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {authorizedPatients.map(req => (
                                            <div key={req.id} className="p-4 border rounded-xl hover:border-primary transition-colors cursor-pointer group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold">{req.patient_id}</h4>
                                                        <p className="text-xs text-muted-foreground">Depuis le {new Date(req.granted_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Actif</Badge>
                                                </div>
                                                <Button
                                                    className="w-full mt-4"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/doctor?view=record&patientId=${req.patient_id}`)}
                                                >
                                                    Consulter le dossier
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="request" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Request Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Demander un accès</CardTitle>
                                <CardDescription>Envoyez une demande pour accéder au dossier d'un patient.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleRequestAccess} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Patient</label>
                                        <Select onValueChange={setPatientEmail} value={patientEmail} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un patient" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availablePatients.map((patient) => (
                                                    <SelectItem key={patient.id} value={patient.id}>
                                                        {patient.name} ({patient.id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Message (Optionnel)</label>
                                        <Textarea
                                            placeholder="Raison de la demande (ex: consultation de routine, suivi...)"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>

                                    {requestStatus === "success" && (
                                        <p className="text-sm text-green-600 flex items-center gap-1">
                                            <CheckCircle className="h-4 w-4" /> Demande envoyée avec succès!
                                        </p>
                                    )}
                                    {requestStatus === "error" && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <XCircle className="h-4 w-4" /> Erreur lors de l'envoi.
                                        </p>
                                    )}

                                    <Button type="submit" className="w-full" disabled={submitting}>
                                        {submitting ? "Envoi..." : "Envoyer la demande"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Sent Requests List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Historique des demandes</CardTitle>
                                <CardDescription>Statut de vos demandes d'accès.</CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-[400px] overflow-auto">
                                {loading ? <p>Chargement...</p> : (
                                    <div className="space-y-4">
                                        {requests.map(req => (
                                            <div key={req.id} className="flex items-start justify-between p-3 border rounded-lg text-sm">
                                                <div>
                                                    <p className="font-medium">{req.patient_id}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <Badge variant="outline" className={
                                                    req.status === 'approved' ? 'bg-green-50 text-green-700' :
                                                        req.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }>
                                                    {req.status === 'approved' ? 'Acceptée' :
                                                        req.status === 'pending' ? 'En attente' : req.status}
                                                </Badge>
                                                {(req.status === 'rejected' || req.status === 'revoked') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="ml-2 text-destructive hover:bg-destructive/10 h-6 px-2"
                                                        onClick={() => handleDeleteRequest(req.id)}
                                                    >
                                                        Supprimer
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {requests.length === 0 && <p className="text-center text-muted-foreground py-4">Aucune demande.</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
