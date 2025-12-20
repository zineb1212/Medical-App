
"use client"

import { useEffect, useState } from "react"
import { accessService } from "../../../services/accessService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, X } from "lucide-react"

export function AccessView() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRequests()
    }, [])

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

    const handleGrant = async (requestId: number) => {
        try {
            const token = localStorage.getItem('token') || ''
            await accessService.grantAccess(requestId, token)
            loadRequests()
        } catch (error) {
            console.error("Failed to grant access", error)
        }
    }

    const handleRevoke = async (requestId: number) => {
        try {
            const token = localStorage.getItem('token') || ''
            await accessService.revokeAccess(requestId, null, token)
            loadRequests()
        } catch (error) {
            console.error("Failed to revoke access", error)
        }
    }

    const pendingRequests = requests.filter(r => r.status === 'pending')
    const activeAccess = requests.filter(r => r.status === 'approved')
    const history = requests.filter(r => r.status === 'revoked' || r.status === 'rejected')

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Gestion des accès</h2>
            <p className="text-muted-foreground">Gérez qui peut consulter votre dossier médical.</p>

            {/* Pending Requests */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        Demandes en attente
                    </CardTitle>
                    <CardDescription>Médecins demandant l'accès à votre dossier</CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aucune demande en attente.</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="flex items-start justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Dr. {req.doctor_id}</h4> {/* Ideally replace ID with Name */}
                                        <p className="text-sm text-gray-500 mt-1">"{req.request_message}"</p>
                                        <p className="text-xs text-gray-400 mt-2">Demandé le {new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleGrant(req.id)} className="bg-green-600 hover:bg-green-700">
                                            Autoriser
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRevoke(req.id)}>
                                            Refuser
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Active Access */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Accès Autorisés
                    </CardTitle>
                    <CardDescription>Médecins pouvant actuellement consulter votre dossier</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeAccess.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aucun accès actif.</p>
                    ) : (
                        <div className="space-y-4">
                            {activeAccess.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 border-green-100">
                                    <div>
                                        <h4 className="font-medium">Dr. {req.doctor_id}</h4>
                                        <p className="text-xs text-green-600 mt-1">Accès accordé le {new Date(req.granted_at).toLocaleDateString()}</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRevoke(req.id)}>
                                        Révoquer
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Historique
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {history.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-2 text-sm border-b last:border-0">
                                <span className="text-gray-600">Dr. {req.doctor_id}</span>
                                <Badge variant="outline" className={req.status === 'revoked' ? 'text-red-500' : 'text-gray-500'}>
                                    {req.status === 'revoked' ? 'Révoqué' : req.status}
                                </Badge>
                            </div>
                        ))}
                        {history.length === 0 && <p className="text-muted-foreground text-sm">Aucun historique.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
