import Link from 'next/link'
import './auth/auth.css'

export default function HomePage() {
  return (
    <div className="auth-container">
      <h2>Bienvenue sur Medical App</h2>
      <p style={{ textAlign: 'center' }}>Veuillez vous connecter ou vous inscrire pour continuer.</p>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20 }}>
        <Link href="/auth/login">
          <button className="auth-button">Se connecter</button>
        </Link>
        <Link href="/auth/register">
          <button className="auth-button">S'inscrire</button>
        </Link>
      </div>
    </div>
  )
}