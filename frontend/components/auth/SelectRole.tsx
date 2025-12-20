"use client"

interface SelectRoleProps {
  role: string
  setRole: (role: string) => void
}

export default function SelectRole({ role, setRole }: SelectRoleProps) {
  const roles = [
    { value: "patient", label: "Patient", icon: "👤" },
    { value: "doctor", label: "Docteur", icon: "⚕️" },
    { value: "admin", label: "Admin", icon: "⚙️" },
  ]

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Type de compte</label>
      <div className="grid grid-cols-3 gap-2">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
              ${role === r.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }
            `}
          >
            <span className="text-2xl mb-1">{r.icon}</span>
            <span className="text-xs font-medium">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
