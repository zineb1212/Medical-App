"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  FolderOpen,
  Upload,
  FileText,
  ImageIcon,
  Trash2,
  Share2,
  Download,
  Plus,
  MoreVertical,
  Check,
  ArrowLeft,
  FolderPlus,
  Calendar,
  Stethoscope,
  Search,
  Save,
  Activity,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { medicalService, MedicalRecord, MedicalFolder, MedicalDocument } from "@/services/medicalService"
import { accessService } from "@/services/accessService"
import { chatService } from "@/services/chatService"

// Mock doctors for sharing dialog (can be fetched from API later)
const doctors = [
  { id: 1, name: "Dr. Sophie Martin", specialty: "Cardiologue" },
  { id: 2, name: "Dr. Pierre Leblanc", specialty: "Radiologue" },
  { id: 3, name: "Dr. Claire Dubois", specialty: "Généraliste" },
]

interface DossierViewProps {
  userId?: string
  readOnly?: boolean
}

export function DossierView({ userId: propUserId, readOnly = false }: DossierViewProps) {
  // Tab selection
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || "documents"
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<MedicalFolder | null>(null)
  const [userId, setUserId] = useState<string>(propUserId || "")
  const [currentLogId, setCurrentLogId] = useState<number | null>(null)

  // Dialog states
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [addFileDialogOpen, setAddFileDialogOpen] = useState(false)

  // Form states
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderDescription, setNewFolderDescription] = useState("")
  const [newFileName, setNewFileName] = useState("") // Just for UI, actual name from file
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)

  // Medical Info Form State
  const [medicalInfo, setMedicalInfo] = useState({
    height: "",
    weight: "",
    blood_type: "",
    allergies: "",
    chronic_conditions: "",
    current_medications: "",
    family_history: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    general_observations: ""
  })



  useEffect(() => {
    if (propUserId) {
      setUserId(propUserId)
      return
    }

    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserId(user.id || user.email)
      } catch (e) {
        console.error("Error parsing user", e)
      }
    }
  }, [propUserId])

  useEffect(() => {
    if (userId) {
      loadRecord()
    }
  }, [userId])

  useEffect(() => {
    // Auto log access if doctor (readOnly mode)
    // We use a flag or check if we already logged this session/view to avoid spamming?
    // For simplicity, log once on mount if readOnly is true and unique patient
    if (readOnly && userId && userId !== 'undefined') {
      const token = localStorage.getItem('token') || ''
      accessService.logAccess(userId, "Dossier Complet", token)
        .then(log => {
          console.log("Consultation logged:", log)
          if (log && log.id) setCurrentLogId(log.id)
        })
        .catch(err => console.error("Failed to log access", err))
    }
  }, [readOnly, userId])

  const loadRecord = async () => {
    try {
      setLoading(true)
      if (!userId) return
      const data = await medicalService.getRecord(userId)
      setRecord(data)

      // Populate form
      setMedicalInfo({
        height: data.height?.toString() || "",
        weight: data.weight?.toString() || "",
        blood_type: data.blood_type || "",
        allergies: data.allergies || "",
        chronic_conditions: data.chronic_conditions || "",
        current_medications: data.current_medications || "",
        family_history: data.family_history || "",
        emergency_contact_name: data.emergency_contact_name || "",
        emergency_contact_phone: data.emergency_contact_phone || "",
        general_observations: data.general_observations || ""
      })
    } catch (error) {
      console.error("Error loading record:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMedicalInfo = async () => {
    if (!userId) return
    try {
      await medicalService.updateRecord({
        user_id: userId,
        height: parseFloat(medicalInfo.height),
        weight: parseFloat(medicalInfo.weight),
        blood_type: medicalInfo.blood_type,
        allergies: medicalInfo.allergies,
        chronic_conditions: medicalInfo.chronic_conditions,
        current_medications: medicalInfo.current_medications,
        family_history: medicalInfo.family_history,
        emergency_contact_name: medicalInfo.emergency_contact_name,
        emergency_contact_phone: medicalInfo.emergency_contact_phone,
        general_observations: medicalInfo.general_observations
      })
      alert("Informations sauvegardées !")
      loadRecord()
    } catch (error) {
      console.error("Error saving info:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return
    try {
      await medicalService.createFolder(userId, newFolderName, newFolderDescription)
      setCreateFolderDialogOpen(false)
      setNewFolderName("")
      setNewFolderDescription("")
      loadRecord()
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) return
    try {
      await medicalService.deleteFolder(folderId)
      if (selectedFolder?.id === folderId) setSelectedFolder(null)
      loadRecord()
    } catch (error) {
      console.error("Error deleting folder:", error)
    }
  }

  const handleUploadFile = async () => {
    if (!fileToUpload || !userId) return
    try {
      await medicalService.uploadDocument(fileToUpload, userId, selectedFolder?.id)
      setAddFileDialogOpen(false)
      setFileToUpload(null)
      loadRecord()

      // Update selected folder view if open
      if (selectedFolder) {
        const newData = await medicalService.getRecord(userId)
        const updatedFolder = newData.folders.find(f => f.id === selectedFolder?.id)
        if (updatedFolder) setSelectedFolder(updatedFolder)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
    }
  }

  const handleDeleteFile = async (docId: number) => {
    if (!confirm("Supprimer ce document ?")) return
    try {
      await medicalService.deleteDocument(docId)
      loadRecord()
      if (selectedFolder) {
        const newData = await medicalService.getRecord(userId)
        const updatedFolder = newData.folders.find(f => f.id === selectedFolder.id)
        if (updatedFolder) setSelectedFolder(updatedFolder)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const getFileIcon = (type: string) => {
    return type?.includes("image") ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Mon Dossier Médical</h2>
          <TabsList>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </TabsTrigger>
            {readOnly && (
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Actions
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-4">
          {/* If a folder is selected, show folder content */}
          {selectedFolder ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setSelectedFolder(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground truncate">{selectedFolder.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedFolder.description}</p>
                </div>
                {!readOnly && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg bg-transparent"
                      onClick={() => setShareDialogOpen(true)}
                    >
                      <Share2 className="mr-1.5 h-4 w-4" />
                      Partager
                    </Button>
                    <Button size="sm" className="rounded-lg bg-primary" onClick={() => setAddFileDialogOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Ajouter
                    </Button>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {selectedFolder.files.length === 0 ? (
                  <Card className="rounded-xl border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <FolderOpen className="mb-2 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Aucun fichier</p>
                      {!readOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 rounded-lg bg-transparent"
                          onClick={() => setAddFileDialogOpen(true)}
                        >
                          <Plus className="mr-1.5 h-4 w-4" />
                          Ajouter
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  selectedFolder.files.map((file) => (
                    <Card key={file.id} className="rounded-xl border-0 shadow-sm">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700"
                        >
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.type} · {file.date} · {file.size}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground"
                          onClick={() => window.open(file.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Folder Grid View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{record?.folders.length || 0} dossier(s)</p>
                </div>
                {!readOnly && (
                  <Button className="rounded-lg bg-primary" onClick={() => setCreateFolderDialogOpen(true)}>
                    <FolderPlus className="mr-1.5 h-4 w-4" />
                    Nouveau
                  </Button>
                )}
              </div>

              {(record?.folders.length === 0) ? (
                <Card className="rounded-xl border-0 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FolderOpen className="mb-3 h-12 w-12 text-muted-foreground/40" />
                    <h3 className="font-medium text-foreground">Aucun dossier</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Créez votre premier dossier</p>
                    {!readOnly && (
                      <Button className="mt-4 rounded-lg bg-primary" onClick={() => setCreateFolderDialogOpen(true)}>
                        <FolderPlus className="mr-1.5 h-4 w-4" />
                        Créer
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {record?.folders.map((folder) => (
                    <Card
                      key={folder.id}
                      className="group cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm transition-shadow hover:shadow-md"
                      onClick={() => setSelectedFolder(folder)}
                    >
                      <CardContent className="p-0">
                        <div className={cn("h-1.5", folder.color)} />
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", folder.color + "/10")}>
                              <FolderOpen className={cn("h-5 w-5", folder.color.replace("bg-", "text-"))} />
                            </div>
                            {!readOnly && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem
                                    className="rounded-lg text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteFolder(folder.id)
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <h3 className="mt-3 font-medium text-foreground">{folder.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">{folder.description || "Pas de description"}</p>
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{folder.files.length} fichier(s)</span>
                            <span>{folder.date}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* INFO TAB */}
        <TabsContent value="info">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Informations Personnelles & Médicales</CardTitle>
              <CardDescription>
                Ces informations sont partagées avec vos médecins lors des consultations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Groupe Sanguin</Label>
                  <Select
                    disabled={readOnly}
                    value={medicalInfo.blood_type}
                    onValueChange={(val) => setMedicalInfo({ ...medicalInfo, blood_type: val })}
                  >
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taille (cm)</Label>
                    <Input
                      disabled={readOnly}
                      type="number"
                      value={medicalInfo.height}
                      onChange={(e) => setMedicalInfo({ ...medicalInfo, height: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Poids (kg)</Label>
                    <Input
                      disabled={readOnly}
                      type="number"
                      value={medicalInfo.weight}
                      onChange={(e) => setMedicalInfo({ ...medicalInfo, weight: e.target.value })}
                    />
                  </div>

                </div>
              </div>

              <div className="space-y-2">
                <Label>Allergies connues</Label>
                <Textarea
                  disabled={readOnly}
                  placeholder="Ex: Pénicilline, Arachides..."
                  value={medicalInfo.allergies}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, allergies: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Conditions Chroniques</Label>
                <Textarea
                  disabled={readOnly}
                  placeholder="Ex: Diabète type 2, Hypertension..."
                  value={medicalInfo.chronic_conditions}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, chronic_conditions: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Traitements en cours</Label>
                <Textarea
                  disabled={readOnly}
                  placeholder="Listez vos médicaments actuels..."
                  value={medicalInfo.current_medications}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, current_medications: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Antécédents Familiaux</Label>
                <Textarea
                  disabled={readOnly}
                  placeholder="Maladies héréditaires..."
                  value={medicalInfo.family_history}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, family_history: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Observations Générales</Label>
                <Textarea
                  disabled={readOnly}
                  placeholder="Autres notes importantes..."
                  value={medicalInfo.general_observations}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, general_observations: e.target.value })}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact d'urgence (Nom)</Label>
                  <Input
                    disabled={readOnly}
                    value={medicalInfo.emergency_contact_name}
                    onChange={(e) => setMedicalInfo({ ...medicalInfo, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact d'urgence (Tél)</Label>
                  <Input
                    disabled={readOnly}
                    value={medicalInfo.emergency_contact_phone}
                    onChange={(e) => setMedicalInfo({ ...medicalInfo, emergency_contact_phone: e.target.value })}
                  />
                </div>
              </div>

              {!readOnly && (
                <div className="flex justify-end">
                  <Button className="bg-primary" onClick={handleSaveMedicalInfo}>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB (Patient Only) */}
        <TabsContent value="history">
          <AccessHistory userId={userId} />
        </TabsContent>

        {readOnly && (
          <TabsContent value="actions">
            <DoctorActions userId={userId} logId={currentLogId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau Dossier</DialogTitle>
            <DialogDescription>
              Créez un dossier pour organiser vos documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Ex: Bilan 2024" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newFolderDescription} onChange={(e) => setNewFolderDescription(e.target.value)} placeholder="Optionnel" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateFolder}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add File Dialog */}
      <Dialog open={addFileDialogOpen} onOpenChange={setAddFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">Document</Label>
              <Input id="file" type="file" onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFileDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleUploadFile} disabled={!fileToUpload}>Uploader</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function AccessHistory({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return
    const token = localStorage.getItem('token') || ''
    accessService.getAccessHistory(userId, token)
      .then(setLogs)
      .catch(console.error)
  }, [userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Consultations</CardTitle>
        <CardDescription>
          Liste des médecins ayant consulté votre dossier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune consultation enregistrée.</p>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">Dr. {log.doctor_name || log.doctor_id}</h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString()} à {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Consulté :</span> {log.sections_viewed}
                  </p>
                  {log.consultation_note && (
                    <div className="mt-2 text-xs bg-muted p-2 rounded">
                      <span className="font-semibold">Note:</span> {log.consultation_note}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {log.action_type === 'message_sent' && <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Message envoyé</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}


function DoctorActions({ userId, logId }: { userId: string, logId: number | null }) {
  const [note, setNote] = useState("")
  const router = useRouter()

  const handleSendAction = async (action: string, noteContent: string = "") => {
    if (!logId) {
      alert("Erreur: Consultation non enregistrée (ID manquant).")
      return
    }
    const token = localStorage.getItem('token') || ''

    try {
      if (action === 'Message envoyé') {
        const userStr = localStorage.getItem('user')
        if (!userStr) throw new Error("Utilisateur non identifié")
        const currentUser = JSON.parse(userStr)
        const senderId = currentUser.id

        // 1. Envoyer le message standard
        await chatService.sendMessage(senderId, userId, "Bonjour, suite à la consultation de votre dossier, je souhaiterais échanger avec vous.")

        // 2. Logger l'action dans l'historique
        await accessService.addConsultationNote(logId, "Message envoyé au patient", "message_sent", token)

        // 3. Rediriger vers la messagerie
        router.push(`/dashboard/doctor?view=messages&contactId=${userId}`)
      } else {
        await accessService.addConsultationNote(logId, noteContent, action, token)
        alert(`Action enregistrée : ${action}`)
        if (noteContent) setNote("")
      }
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'action.")
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Note de Consultation</CardTitle>
          <CardDescription>Ajouter une observation visible par le patient.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Rédiger une note..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <Button onClick={() => handleSendAction('Note ajoutée', note)} disabled={!note || !logId}>
            Enregistrer la note
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
          <CardDescription>Contacter le patient.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start" onClick={() => handleSendAction('Message envoyé')} disabled={!logId}>
            <Share2 className="mr-2 h-4 w-4" /> Envoyer un message
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => handleSendAction('Rendez-vous suggéré')} disabled={!logId}>
            <Calendar className="mr-2 h-4 w-4" /> Suggérer un rendez-vous (Simulé)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
