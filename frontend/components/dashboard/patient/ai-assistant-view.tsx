"use client"

import { useState, useRef, useEffect } from "react"
import { aiService, AIResponse } from "@/services/aiService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Upload, Brain, Activity, MessageSquare, AlertTriangle, CheckCircle, FileText, History as HistoryIcon, PlusCircle, RotateCcw, Trash2 } from "lucide-react"

interface HistoryItem {
    id: number
    action_type: string
    input_data: string
    output_data: string
    timestamp: string
}

export function AIAssistantView() {
    const [activeTab, setActiveTab] = useState("chat")
    const [history, setHistory] = useState<HistoryItem[]>([])

    // Load history
    const loadHistory = async () => {
        try {
            const userStr = localStorage.getItem("user")
            const user = userStr ? JSON.parse(userStr) : null
            const userId = user?.id || user?.email || "patient@test.com" // Fallback
            const data = await aiService.getHistory(userId)
            if (Array.isArray(data)) setHistory(data)
        } catch (e) {
            console.error("Failed to load history", e)
        }
    }

    useEffect(() => {
        loadHistory()
    }, [])

    // Chat State
    const [sessionId, setSessionId] = useState<string>("")
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: 'Bonjour ! Je suis MediBrain. Comment puis-je vous aider aujourd\'hui ?' }
    ])
    const [input, setInput] = useState("")
    const [chatLoading, setChatLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // MRI State
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [mriResult, setMriResult] = useState<AIResponse | null>(null)
    const [mriLoading, setMriLoading] = useState(false)

    // Record Analysis State
    const [recordAnalysis, setRecordAnalysis] = useState<AIResponse | null>(null)
    const [recordLoading, setRecordLoading] = useState(false)

    // Generate session ID on mount or reset
    useEffect(() => {
        setSessionId(Date.now().toString())
    }, [])

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg = input
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setInput("")
        setChatLoading(true)

        try {
            // Context could be fetched from dossier view if needed
            const res = await aiService.chat(userMsg, {
                user_id: JSON.parse(localStorage.getItem("user") || "{}").id,
                session_id: sessionId // Pass current session
            })
            setMessages(prev => [...prev, { role: 'ai', content: res.response || "Désolé, je n'ai pas compris." }])
            loadHistory()
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', content: "Erreur de connexion au service IA." }])
        } finally {
            setChatLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            setMriResult(null)
        }
    }

    const handleAnalyzeMRI = async () => {
        if (!selectedFile) return
        setMriLoading(true)
        try {
            const res = await aiService.analyzeMRI(selectedFile)
            setMriResult(res)
            loadHistory()
        } catch (e) {
            console.error(e)
            alert("Erreur lors de l'analyse")
        } finally {
            setMriLoading(false)
        }
    }

    const handleAnalyzeRecord = async () => {
        const storedUser = localStorage.getItem("user")
        if (!storedUser) return

        const user = JSON.parse(storedUser)
        setRecordLoading(true)

        try {
            const res = await aiService.analyzeRecord(user.id || user.email)
            setRecordAnalysis(res)
            loadHistory()
        } catch (e) {
            console.error(e)
            alert("Erreur lors de l'analyse du dossier")
        } finally {
            setRecordLoading(false)
        }
    }

    const handleReset = (type: 'chat' | 'mri' | 'record') => {
        if (type === 'chat') {
            setMessages([
                { role: 'ai', content: 'Bonjour ! Je suis MediBrain. Comment puis-je vous aider aujourd\'hui ?' }
            ])
            setInput("")
            setSessionId(Date.now().toString()) // Start new session
        } else if (type === 'mri') {
            setSelectedFile(null)
            setPreviewUrl(null)
            setMriResult(null)
        } else if (type === 'record') {
            setRecordAnalysis(null)
        }
    }

    const handleHistoryClick = (item: HistoryItem) => {
        try {
            const output = JSON.parse(item.output_data)

            if (item.action_type === 'chat') {
                setActiveTab('chat')
                // Restore chat context
                setMessages([
                    { role: 'ai', content: 'Bonjour ! Je suis MediBrain. Comment puis-je vous aider aujourd\'hui ?' },
                    { role: 'user', content: item.input_data },
                    { role: 'ai', content: output.response || "Réponse non disponible." }
                ])
                if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
            }
            else if (item.action_type === 'mri') {
                setActiveTab('mri')
                setMriResult(output)
                setSelectedFile(null) // Reset file input as we are showing history
                setPreviewUrl(null)
            }
            else if (item.action_type === 'record') {
                setActiveTab('record')
                setRecordAnalysis(output)
            }
        } catch (e) {
            console.error("Failed to parse history item", e)
        }
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-row gap-6">
            <div className="flex-1 flex flex-col space-y-4">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Brain className="h-8 w-8 text-primary" />
                    Assistant MediBrain
                </h2>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="chat" className="flex gap-2"><MessageSquare className="h-4 w-4" /> Ask AI</TabsTrigger>
                        <TabsTrigger value="mri" className="flex gap-2"><Activity className="h-4 w-4" /> Analyse IRM</TabsTrigger>
                        <TabsTrigger value="record" className="flex gap-2"><FileText className="h-4 w-4" /> Analyse Dossier</TabsTrigger>
                    </TabsList>

                    {/* CHAT TAB */}
                    <TabsContent value="chat" className="flex-1 flex flex-col h-[500px]">
                        <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-sm relative">
                            {/* NEW BUTTON ADDED HERE */}
                            <div className="absolute top-2 right-4 z-10">
                                <Button variant="ghost" size="sm" onClick={() => handleReset('chat')} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                                    <PlusCircle className="mr-1 h-3 w-3" /> Nouvelle conversation
                                </Button>
                            </div>
                            <ScrollArea className="flex-1 p-4 bg-muted/20 pt-10">
                                <div className="space-y-4">
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl ${m.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                                : 'bg-white border rounded-bl-none'
                                                }`}>
                                                <p className="text-sm">{m.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border p-3 rounded-2xl rounded-bl-none">
                                                <p className="text-sm text-muted-foreground animate-pulse">MediBrain réfléchit...</p>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>
                            <div className="p-4 bg-card border-t flex gap-2">
                                <Input
                                    placeholder="Posez une question sur votre santé..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <Button onClick={handleSend} disabled={chatLoading}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* MRI TAB */}
                    <TabsContent value="mri" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Détection de Tumeurs Cérébrales via IA</CardTitle>
                                <CardDescription>Téléversez une image IRM pour obtenir une analyse instantanée.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 hover:bg-muted/50 transition-colors">
                                    {previewUrl ? (
                                        <div className="relative">
                                            <img src={previewUrl} alt="Preview" className="h-64 rounded-lg object-contain" />
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setMriResult(null); }}
                                            >
                                                X
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center">
                                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                                            <span className="text-sm font-medium">Cliquez pour téléverser une image IRM</span>
                                            <span className="text-xs text-muted-foreground mt-1">JPG, PNG supportés</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                        </label>
                                    )}
                                </div>

                                {selectedFile && !mriResult && (
                                    <div className="flex justify-center">
                                        <Button onClick={handleAnalyzeMRI} disabled={mriLoading} className="w-full sm:w-auto">
                                            {mriLoading ? "Analyse en cours..." : "Lancer l'analyse"}
                                        </Button>
                                    </div>
                                )}

                                {mriResult && (
                                    <div className="bg-muted/30 rounded-xl p-6 border animate-in fade-in slide-in-from-bottom-4 relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Résultats de l'analyse</h3>
                                            <Button variant="outline" size="sm" onClick={() => handleReset('mri')}>
                                                <RotateCcw className="mr-2 h-3 w-3" /> Nouvelle Analyse
                                            </Button>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Diagnostic IA</p>
                                                <p className="text-2xl font-bold text-primary">{mriResult.diagnosis}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Confiance</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-1000"
                                                            style={{ width: `${mriResult.confidence}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-medium">{mriResult.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {mriResult.raw_scores && (
                                            <div className="mt-6 pt-4 border-t">
                                                <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Détails des scores</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {Object.entries(mriResult.raw_scores).map(([type, score]) => (
                                                        <div key={type} className="flex justify-between p-2 bg-background rounded border">
                                                            <span>{type}</span>
                                                            <span className="font-mono">{(score * 100).toFixed(1)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* RECORD TAB */}
                    <TabsContent value="record" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analyse du Dossier Médical</CardTitle>
                                <CardDescription>L'IA analyse vos antécédents pour détecter des facteurs de risque.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {!recordAnalysis ? (
                                    <div className="text-center py-10">
                                        <Brain className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                                        <Button onClick={handleAnalyzeRecord} disabled={recordLoading}>
                                            {recordLoading ? "Analyse en cours..." : "Lancer l'analyse du dossier"}
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-4 max-w-sm mx-auto">
                                            Cette analyse se base sur vos symptômes actuels, antécédents familiaux et conditions chroniques renseignés.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-6 bg-muted/30 rounded-xl border">
                                            <div>
                                                <h3 className="font-semibold text-lg">Niveau de Risque Estimé</h3>
                                                <p className="text-sm text-muted-foreground">Basé sur les données disponibles</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-4 py-2 rounded-full font-bold text-white ${recordAnalysis.risk_level === 'Élevé' ? 'bg-destructive' :
                                                    recordAnalysis.risk_level === 'Modéré' ? 'bg-orange-500' : 'bg-green-500'
                                                    }`}>
                                                    {recordAnalysis.risk_level} ({recordAnalysis.risk_score}/100)
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                    Facteurs de Risque Identifiés
                                                </h4>
                                                {recordAnalysis.risk_factors && recordAnalysis.risk_factors.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {recordAnalysis.risk_factors.map((factor, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5" />
                                                                {factor}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">Aucun facteur majeur détecté.</p>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    Recommandation
                                                </h4>
                                                <p className="text-sm bg-green-50 text-green-700 p-3 rounded-lg border border-green-100">
                                                    {recordAnalysis.recommendation}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button variant="outline" size="sm" onClick={() => handleReset('record')}>
                                                <RotateCcw className="mr-2 h-4 w-4" /> Nouvelle Analyse
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* History Sidebar - Rendered outside Tabs to persist or reuse space, but user wants it for all features */}
            </div>

            {/* History Panel */}
            <div className="w-80 border-l pl-4 flex flex-col h-full bg-card/50">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                    <HistoryIcon className="h-4 w-4" /> Historique Récent
                </h3>
                <ScrollArea className="flex-1 pr-3">
                    <div className="space-y-3">
                        {history.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Aucune activité récente.</p>}
                        {(() => {
                            // GROUP HISTORY BY SESSION
                            const sessions: Record<string, HistoryItem[]> = {}
                            history.filter(h => h.action_type === 'chat').forEach(h => {
                                const sessId = (h as any).session_id || 'unknown'
                                if (!sessions[sessId]) sessions[sessId] = []
                                sessions[sessId].push(h)
                            })

                            // Sort sessions by most recent timestamp
                            const sortedSessionIds = Object.keys(sessions).sort((a, b) => {
                                const lastA = sessions[a][0].timestamp
                                const lastB = sessions[b][0].timestamp
                                return new Date(lastB).getTime() - new Date(lastA).getTime()
                            })

                            return sortedSessionIds.map(sessId => {
                                const sessItems = sessions[sessId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                const lastItem = sessItems[sessItems.length - 1]
                                const firstItem = sessItems[0]

                                return (
                                    <div
                                        key={sessId}
                                        className="relative group/item space-y-1 mb-2"
                                    >
                                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                                            Conversation du {new Date(firstItem.timestamp).toLocaleDateString()}
                                        </h4>
                                        <div
                                            onClick={() => {
                                                setActiveTab('chat')
                                                // RESTORE FULL CONVERSATION
                                                const restoredMessages = sessItems.flatMap(item => {
                                                    try {
                                                        const output = JSON.parse(item.output_data)
                                                        return [
                                                            { role: 'user', content: item.input_data },
                                                            { role: 'ai', content: output.response || "..." }
                                                        ]
                                                    } catch { return [] }
                                                })
                                                // Prepend system greeting if desired, or just show history
                                                setMessages([
                                                    { role: 'ai', content: 'Bonjour ! Je suis MediBrain. (Session restaurée)' },
                                                    ...restoredMessages as any
                                                ])
                                            }}
                                            className="text-xs p-3 bg-white rounded-lg border shadow-sm group hover:border-primary/50 transition-colors cursor-pointer hover:bg-muted/50"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium text-foreground line-clamp-2">"{(firstItem as any).input_data}"</p>
                                                <p className="text-xs text-muted-foreground">{sessItems.length} échange(s)</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-6 -right-1 h-6 w-6 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity shadow-md z-10"
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                if (confirm("Supprimer toute cette conversation ?")) {
                                                    for (const item of sessItems) {
                                                        await aiService.deleteHistory(item.id)
                                                    }
                                                    loadHistory()
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )
                            })
                        })()}
                        {/* Render other types normally */}
                        {history.filter(h => h.action_type !== 'chat').map((item) => (
                            <div
                                key={item.id}
                                className="relative group/item"
                            >
                                <div
                                    onClick={() => handleHistoryClick(item)}
                                    className="text-xs p-3 bg-white rounded-lg border shadow-sm group hover:border-primary/50 transition-colors cursor-pointer hover:bg-muted/50"
                                >
                                    <div className="flex justify-between items-center text-muted-foreground mb-2">
                                        <span className={`uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${item.action_type === 'mri' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {item.action_type}
                                        </span>
                                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>

                                    {item.action_type === 'mri' && (
                                        <div className="space-y-1">
                                            <p className="font-medium text-foreground truncate">{item.input_data}</p>
                                            {(() => {
                                                try {
                                                    const data = JSON.parse(item.output_data);
                                                    return <p className="font-bold text-primary">{data.diagnosis} ({data.confidence}%)</p>
                                                } catch { return null }
                                            })()}
                                        </div>
                                    )}

                                    {item.action_type === 'record' && (
                                        <div className="space-y-1">
                                            <p className="font-medium">Analyse Dossier</p>
                                            {(() => {
                                                try {
                                                    const data = JSON.parse(item.output_data);
                                                    return <p className={data.risk_level === 'Élevé' ? 'text-red-500 font-bold' : 'text-green-600 font-medium'}>
                                                        Risque {data.risk_level}
                                                    </p>
                                                } catch { return null }
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity shadow-md z-10"
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        if (confirm("Supprimer cet élément ?")) {
                                            await aiService.deleteHistory(item.id)
                                            loadHistory()
                                        }
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div >
    )
}
