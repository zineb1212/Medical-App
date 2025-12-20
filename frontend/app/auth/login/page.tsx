"use client"

import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/50 to-secondary/30 p-4 overflow-auto">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-2xl shadow-primary/10 border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-primary/80 px-6 py-6 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="w-14 h-14 bg-primary-foreground/15 rounded-xl mx-auto mb-3 flex items-center justify-center backdrop-blur-sm rotate-3 hover:rotate-0 transition-transform">
                <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-primary-foreground mb-1">Connexion</h1>
              <p className="text-primary-foreground/80 text-xs">
                Accédez à votre espace médical
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-5">
            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <svg className="w-3.5 h-3.5 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <p className="text-muted-foreground text-xs">Plateforme médicale sécurisée</p>
        </div>
      </div>
    </div>
  )
}
