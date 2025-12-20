"use client"

import { Calendar, Heart, MessageCircle, Clock, FileText, Search, FolderOpen, Eye, EyeOff, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

const stats = [
  {
    label: "Rendez-vous",
    value: "3",
    subtitle: "ce mois",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Mes Médecins",
    value: "4",
    subtitle: "spécialistes",
    icon: Users,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    label: "Dossiers",
    value: "6",
    subtitle: "médicaux",
    icon: FolderOpen,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
]

const recentHistory = [
  {
    id: 1,
    type: "Consultation",
    doctor: "Dr. Martin",
    date: "15 Dec 2025",
    status: "Terminé",
  },
  {
    id: 2,
    type: "Analyse Sang",
    doctor: "Labo Central",
    date: "10 Dec 2025",
    status: "Résultats",
  },
  {
    id: 3,
    type: "Radiographie",
    doctor: "Dr. Leblanc",
    date: "05 Dec 2025",
    status: "Terminé",
  },
]

const myDoctors = [
  {
    id: 1,
    name: "Dr. Sophie Martin",
    specialty: "Cardiologue",
    avatar: "/female-doctor-portrait.png",
    online: true,
  },
  {
    id: 2,
    name: "Dr. Pierre Leblanc",
    specialty: "Radiologue",
    avatar: "/male-doctor-portrait.png",
    online: false,
  },
]

const allDoctors = [
  {
    id: 3,
    name: "Dr. Claire Dubois",
    specialty: "Généraliste",
    avatar: "/woman-doctor-portrait.png",
    online: true,
  },
  {
    id: 4,
    name: "Dr. Jean Moreau",
    specialty: "Neurologue",
    avatar: "/male-doctor-portrait.png",
    online: false,
  },
  {
    id: 5,
    name: "Dr. Anne Bernard",
    specialty: "Dermatologue",
    avatar: "/female-doctor-portrait.png",
    online: true,
  },
  {
    id: 6,
    name: "Dr. Marc Petit",
    specialty: "Orthopédiste",
    avatar: "/male-doctor-portrait.png",
    online: false,
  },
]

const sharedFolders = [
  {
    id: 1,
    name: "Bilan Cardiaque",
    sharedWith: "Dr. Sophie Martin",
    date: "10 Dec 2025",
    viewed: true,
    viewedAt: "11 Dec 2025",
  },
  {
    id: 2,
    name: "IRM Cérébrale",
    sharedWith: "Dr. Pierre Leblanc",
    date: "08 Dec 2025",
    viewed: false,
    viewedAt: null,
  },
  {
    id: 3,
    name: "Analyses Sanguines",
    sharedWith: "Dr. Claire Dubois",
    date: "05 Dec 2025",
    viewed: true,
    viewedAt: "06 Dec 2025",
  },
]

interface HomeViewProps {
  onStartDiscussion: (doctorId: number) => void
}

export function HomeView({ onStartDiscussion }: HomeViewProps) {
  const [doctorSearch, setDoctorSearch] = useState("")
  const [allDoctors, setAllDoctors] = useState<any[]>([])
  const [stats, setStats] = useState([
    { label: "Rendez-vous", value: "0", subtitle: "ce mois", icon: Calendar, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Mes Médecins", value: "0", subtitle: "spécialistes", icon: Users, color: "text-accent", bgColor: "bg-accent/10" },
    { label: "Dossiers", value: "0", subtitle: "médicaux", icon: FolderOpen, color: "text-violet-500", bgColor: "bg-violet-500/10" },
  ])
  const [recentHistory, setRecentHistory] = useState<any[]>([])
  const [myDoctors, setMyDoctors] = useState<any[]>([])

  useEffect(() => {
    // Fetch all doctors
    const fetchDoctors = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/dashboard/doctors')
        if (res.ok) {
          const data = await res.json()
          setAllDoctors(data)
        }
      } catch (e) { console.error(e) }
    }
    fetchDoctors()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token')
      try {
        const res = await fetch('http://localhost:5000/api/dashboard/patient/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setStats([
            { label: data.stats[0].label, value: data.stats[0].value, subtitle: data.stats[0].subtitle, icon: Calendar, color: "text-primary", bgColor: "bg-primary/10" },
            { label: data.stats[1].label, value: data.stats[1].value, subtitle: data.stats[1].subtitle, icon: Users, color: "text-accent", bgColor: "bg-accent/10" },
            { label: data.stats[2].label, value: data.stats[2].value, subtitle: data.stats[2].subtitle, icon: FolderOpen, color: "text-violet-500", bgColor: "bg-violet-500/10" },
          ])
          setRecentHistory(data.recentHistory)
          setMyDoctors(data.myDoctors)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchStats()
  }, [])

  const filteredAllDoctors = allDoctors.filter(
    (d) =>
      d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.specialty.toLowerCase().includes(doctorSearch.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold">Bonjour, Marie !</h1>
        <p className="mt-1 text-primary-foreground/80">Voici un résumé de votre espace santé</p>
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
        {/* My Doctors */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5 text-primary" />
              Mes Médecins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={doctor.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {doctor.online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{doctor.name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                  onClick={() => onStartDiscussion(doctor.id)}
                >
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                  Chat
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent History */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Historique Récent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.type}</p>
                    <p className="text-xs text-muted-foreground">{item.doctor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                  <Badge variant="secondary" className="mt-1 rounded bg-accent/10 text-xs text-accent">
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Shared Folders Tracking */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-5 w-5 text-primary" />
            Dossiers Partagés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sharedFolders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${folder.viewed ? "bg-accent/10" : "bg-amber-500/10"}`}
                  >
                    {folder.viewed ? (
                      <Eye className="h-4 w-4 text-accent" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">Partagé avec {folder.sharedWith}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="secondary"
                    className={`rounded ${folder.viewed ? "bg-accent/10 text-accent" : "bg-amber-500/10 text-amber-600"}`}
                  >
                    {folder.viewed ? "Vu" : "Non vu"}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {folder.viewed ? `Vu le ${folder.viewedAt}` : `Envoyé le ${folder.date}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Doctors with Search */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Tous les Médecins
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un médecin..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                className="h-9 rounded-lg border-muted bg-muted/50 pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredAllDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={doctor.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-sm text-primary">
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {doctor.online && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-muted bg-accent" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{doctor.name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg p-0 text-primary hover:bg-primary/10"
                  onClick={() => onStartDiscussion(doctor.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {filteredAllDoctors.length === 0 && (
              <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">Aucun médecin trouvé</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
