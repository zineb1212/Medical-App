"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Calendar as CalendarIcon, MoreVertical, Video, MapPin, Loader2 } from "lucide-react"
import { appointmentService, Appointment } from "@/services/appointmentService"
import { toast } from "sonner"

export function ScheduleView() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(false)

    // New Appointment Form State
    const [newApptOpen, setNewApptOpen] = useState(false)
    const [formData, setFormData] = useState({
        patient_id: "",
        date: "",
        time: "",
        type: "general",
        mode: "in-person"
    })

    useEffect(() => {
        fetchAppointments()
    }, [date])

    const fetchAppointments = async () => {
        if (!date) return
        setLoading(true)
        try {
            const data = await appointmentService.getAppointments(date)
            setAppointments(data)
        } catch (error) {
            console.error(error)
            toast.error("Erreur lors du chargement des rendez-vous")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAppointment = async () => {
        try {
            await appointmentService.createAppointment({
                ...formData,
                date: formData.date,
                time: formData.time,
                // @ts-ignore
                type: formData.type,
                // @ts-ignore
                mode: formData.mode
            })
            toast.success("Rendez-vous créé avec succès")
            setNewApptOpen(false)
            fetchAppointments()
        } catch (error) {
            toast.error("Erreur lors de la création du rendez-vous")
        }

    }

    const updateStatus = async (id: number, status: string) => {
        try {
            await appointmentService.updateStatus(id, status)
            toast.success("Statut mis à jour")
            fetchAppointments()
        } catch (error) {
            toast.error("Erreur lors de la mise à jour")
            console.error(error)
        }
    }

    const deleteAppointment = async (id: number) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) return
        try {
            await appointmentService.deleteAppointment(id)
            toast.success("Rendez-vous supprimé")
            fetchAppointments()
        } catch (error) {
            toast.error("Erreur lors de la suppression")
            console.error(error)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return "bg-green-100 text-green-800 hover:bg-green-100"
            case 'pending': return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
            case 'cancelled': return "bg-red-100 text-red-800 hover:bg-red-100"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return "Confirmé"
            case 'pending': return "En attente"
            case 'cancelled': return "Annulé"
            default: return status
        }
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
                    <p className="text-muted-foreground">Gérez vos rendez-vous et votre emploi du temps.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAppointments}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Actualiser
                    </Button>
                    <Dialog open={newApptOpen} onOpenChange={setNewApptOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau Rendez-vous
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Ajouter un rendez-vous</DialogTitle>
                                <DialogDescription>
                                    Planifiez une nouvelle consultation.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="patient_id" className="text-right">
                                        Patient (Email)
                                    </Label>
                                    <Input
                                        id="patient_id"
                                        placeholder="email@patient.com"
                                        className="col-span-3"
                                        value={formData.patient_id}
                                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">
                                        Date
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        className="col-span-3"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="time" className="text-right">
                                        Heure
                                    </Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, time: val })}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Choisir une heure" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 18 }, (_, i) => i + 8).flatMap(hour =>
                                                ['00', '30'].map(min => {
                                                    const timeStr = `${hour.toString().padStart(2, '0')}:${min}`
                                                    const isOccupied = appointments.some(a => a.time.slice(0, 5) === timeStr)
                                                    return (
                                                        <SelectItem
                                                            key={timeStr}
                                                            value={timeStr}
                                                            disabled={isOccupied}
                                                        >
                                                            {timeStr} {isOccupied ? '(Occupé)' : ''}
                                                        </SelectItem>
                                                    )
                                                })
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">
                                        Type
                                    </Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Type de consultation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">Consultation Générale</SelectItem>
                                            <SelectItem value="followup">Suivi</SelectItem>
                                            <SelectItem value="emergency">Urgence</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="mode" className="text-right">
                                        Mode
                                    </Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, mode: val })}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="in-person">Cabinet</SelectItem>
                                            <SelectItem value="video">Téléconsultation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleCreateAppointment}>Sauvegarder</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                {/* Left Side: Calendar & Mini Stats */}
                <div className="md:col-span-4 space-y-6">
                    <Card>
                        <CardContent className="p-4 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow-sm"
                                modifiers={{
                                    hasAppointment: (date) => appointments.some(a => new Date(a.date).toDateString() === date.toDateString())
                                }}
                                modifiersStyles={{
                                    hasAppointment: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Statistiques du Jour</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-bold">{appointments.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Confirmés</span>
                                <span className="font-bold text-green-600">
                                    {appointments.filter(a => a.status === 'confirmed').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">En attente</span>
                                <span className="font-bold text-yellow-600">
                                    {appointments.filter(a => a.status === 'pending').length}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Appointment List */}
                <div className="md:col-span-8 space-y-4">
                    <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                                {date ? format(date, "d MMMM yyyy", { locale: fr }) : "Sélectionnez une date"}
                            </h3>
                            <Badge variant="outline" className="ml-2">
                                {appointments.length} rendez-vous
                            </Badge>
                        </div>

                        {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    </div>

                    <div className="space-y-3">
                        {appointments.length > 0 ? (
                            appointments.map((apt) => (
                                <Card key={apt.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        {/* Time Column */}
                                        <div className="flex flex-col items-center min-w-[3rem] gap-1">
                                            <span className="font-bold text-lg">{apt.time}</span>
                                        </div>

                                        {/* Separator */}
                                        <div className="h-12 w-1 bg-border rounded-full"></div>

                                        {/* Patient Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={apt.patient_avatar} />
                                                        <AvatarFallback>{apt.patient_name ? apt.patient_name.charAt(0) : '?'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-semibold">{apt.patient_name}</h4>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <span>{apt.type}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                {apt.mode === 'video' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                                                {apt.mode === 'video' ? 'Téléconsultation' : 'Cabinet'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Badge className={getStatusColor(apt.status)}>
                                                    {getStatusLabel(apt.status)}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setFormData({
                                                        patient_id: apt.patient_id,
                                                        date: apt.date,
                                                        time: apt.time,
                                                        type: apt.type,
                                                        mode: apt.mode
                                                    })
                                                    setNewApptOpen(true)
                                                    // Note: Ideally we would have an update mode or ID tracking to differentiate create vs update
                                                }}>
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => updateStatus(apt.id, 'cancelled')}
                                                    className="text-red-600"
                                                >
                                                    Annuler le rendez-vous
                                                </DropdownMenuItem>
                                                {apt.status === 'pending' && (
                                                    <DropdownMenuItem
                                                        onClick={() => updateStatus(apt.id, 'confirmed')}
                                                        className="text-green-600"
                                                    >
                                                        Confirmer
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => deleteAppointment(apt.id)}
                                                    className="text-red-600 font-medium"
                                                >
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
                                <div className="bg-muted p-4 rounded-full mb-4">
                                    <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">Aucun rendez-vous</h3>
                                <p className="text-muted-foreground">{loading ? "Chargement..." : "Rien de prévu pour cette date."}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
