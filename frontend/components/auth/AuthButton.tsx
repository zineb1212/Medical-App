"use client"

interface AuthButtonProps {
  text: string
  type?: "button" | "submit"
  onClick?: () => void
}

export default function AuthButton({ text, type = "button", onClick }: AuthButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
    >
      {text}
    </button>
  )
}
