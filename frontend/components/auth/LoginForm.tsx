"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SelectRole from "./SelectRole"

export default function LoginForm() {
  // ============================
  // ROUTER NEXT.JS
  // ============================
  const router = useRouter()

  // ============================
  // STATES FORM
  // ============================
  const [role, setRole] = useState("patient")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // ============================
  // SUBMIT LOGIN
  // ============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // ============================
    // VALIDATION SIMPLE FRONT
    // ============================
    if (!email || !password) {
      setError("Email et mot de passe requis")
      return
    }

    // ============================
    // LOGIN API CALL
    // ============================
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erreur de connexion")
        return
      }

      // ============================
      // STOCKAGE SESSION
      // ============================
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("token", data.token)

      // ============================
      // REDIRECTION SELON ROLE
      // ============================
      if (data.user.role === "patient") {
        router.push("/dashboard/patient")
      } else if (data.user.role === "doctor" || data.user.role === "docteur") {
        router.push("/dashboard/doctor")
      }

    } catch (err) {
      setError("Erreur de connexion au serveur")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* ============================
          SELECT ROLE
         ============================ */}
      <SelectRole role={role} setRole={setRole} />

      {/* ============================
          EMAIL
         ============================ */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-input rounded-xl
                   text-foreground placeholder:text-muted-foreground
                   focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                   transition-all"
      />

      {/* ============================
          PASSWORD
         ============================ */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 pr-10 text-sm bg-muted/50 border border-input rounded-xl
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                     transition-all"
        />

        {/* Show / Hide password */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      {/* ============================
          ERROR MESSAGE
         ============================ */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* ============================
          SUBMIT BUTTON
         ============================ */}
      <button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground
                   font-semibold py-2.5 px-4 rounded-xl transition-all
                   shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30
                   active:scale-[0.98] text-sm"
      >
        Se connecter
      </button>

      {/* ============================
          LINK REGISTER
         ============================ */}
      {role !== "admin" && role !== "doctor" && (
        <div className="text-center pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href={`/auth/register?role=${role}`}
              className="text-primary font-medium hover:underline"
            >
              S'inscrire
            </Link>
          </p>
        </div>
      )}
    </form>
  )
}
