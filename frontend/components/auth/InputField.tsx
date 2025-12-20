"use client"

interface InputFieldProps {
  type: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  label?: string
}

export default function InputField({ type, placeholder, value, onChange, label }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
      />
    </div>
  )
}
