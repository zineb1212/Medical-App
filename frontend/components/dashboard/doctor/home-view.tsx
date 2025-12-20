"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, MessageCircle, Clock, FileText, Search, Activity, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const stats = [
    {
        label: "Patients du jour",
        value: "8",
        subtitle: "+2 urgences",
        icon: Users,
        color: "text-primary",
        bgColor: "bg-primary/10",
    },
    {
        label: "Consultations",
        value: "12",
        subtitle: "en attente",
        icon: Calendar,
        color: "text-accent",
        bgColor: "bg-accent/10",
    },
    {
        label: "Messages",
        value: "5",
        subtitle: "non lus",
        icon: MessageCircle,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
    },
]

const upcomingAppointments = [
    {
        id: 1,
        patient: "Marie Dupont",
        time: "09:00",
        type: "Consultation Suivi",
        status: "En cours",
        avatar: "/thoughtful-patient.png",
    },
    {
        id: 2,
        patient: "Jean Martin",
        time: "10:30",
        type: "Urgence",
        status: "En attente",
        avatar: "/placeholder.svg",
    },
    {
        id: 3,
        patient: "Sophie Bernard",
        time: "11:15",
        type: "Bilan Sanguin",
        status: "Confirmé",
        avatar: "/placeholder.svg",
    },
]

const recentActivity = [
    {
        id: 1,
        desc: "Résultats labo reçus pour Marie Dupont",
        time: "Il y a 10 min",
        icon: Activity,
    },
    {
        id: 2,
        desc: "Nouveau message de Dr. Leblanc",
        time: "Il y a 30 min",
        icon: MessageCircle,
    },
    {
        id: 3,
        desc: "Rapport généré pour Jean Martin",
        time: "Il y a 1h",
        icon: FileText,
    },
]

export function HomeView() {
    const [stats, setStats] = useState([
        { label: "Patients", value: "0", subtitle: "suivis", icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
        { label: "Consultations", value: "0", subtitle: "total", icon: Calendar, color: "text-accent", bgColor: "bg-accent/10" },
        { label: "Messages", value: "0", subtitle: "non lus", icon: MessageCircle, color: "text-violet-500", bgColor: "bg-violet-500/10" }
    ])
    const [activities, setActivities] = useState<any[]>([])

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('token')
            try {
                const res = await fetch('http://localhost:5000/api/dashboard/doctor/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    // Map backend stats to UI
                    const newStats = [
                        { label: data.stats[0].label, value: data.stats[0].value, subtitle: data.stats[0].subtitle, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
                        { label: data.stats[1].label, value: data.stats[1].value, subtitle: data.stats[1].subtitle, icon: Calendar, color: "text-accent", bgColor: "bg-accent/10" },
                        { label: data.stats[2].label, value: data.stats[2].value, subtitle: data.stats[2].subtitle, icon: MessageCircle, color: "text-violet-500", bgColor: "bg-violet-500/10" }
                    ]
                    setStats(newStats)

                    // Map activities
                    const mappedActivities = data.recentActivity.map((act: any) => ({
                        id: act.id,
                        desc: act.desc,
                        time: act.time,
                        icon: act.desc.includes('Message') ? MessageCircle : (act.desc.includes('Note') ? FileText : Activity)
                    }))
                    setActivities(mappedActivities)
                }
            } catch (e) {
                console.error(e)
            }
        }
        fetchStats()
    }, [])

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                <h1 className="text-2xl font-bold">Bonjour, Docteur !</h1>
                <p className="mt-1 text-primary-foreground/80">Voici le résumé de votre activité</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.label} className="rounded-2xl border-0 shadow-sm">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className={`rounded-xl ${stat.bgColor} p-3`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Appointments (Keeping static/mock for now as agreed) */}
                <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-5 w-5 text-primary" />
                            Prochaines Consultations
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs">Voir tout</Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {upcomingAppointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={apt.avatar} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {apt.patient.split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{apt.patient}</p>
                                        <p className="text-xs text-muted-foreground">{apt.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary">{apt.time}</p>
                                    <Badge variant="outline" className="mt-1 text-[10px] h-5">{apt.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-5 w-5 text-primary" />
                            Activité Récente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activities.length > 0 ? activities.map((act) => (
                            <div key={act.id} className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                                    <act.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{act.desc}</p>
                                    <p className="text-xs text-muted-foreground">{act.time}</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-muted-foreground">Aucune activité récente.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
