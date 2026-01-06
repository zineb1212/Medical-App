"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function RegisterLayout() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "patient"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name || !email || !password) {
      setError("Tous les champs sont requis")
      return
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      })

      const data = await res.json()

      if (res.ok) {
        // Auto login
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("token", data.token)
        router.push(role === "docteur" ? "/dashboard/doctor" : "/dashboard/patient")
      } else {
        setError(data.error || "Erreur lors de l'inscription")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
          <p className="text-sm text-muted-foreground">
            Inscrivez-vous en tant que {role === "docteur" ? "médecin" : "patient"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-input rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-input rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-input rounded-xl"
            />
          </div>

          {error && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:bg-primary/90"
          >
            S'inscrire
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="text-primary hover:underline">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
