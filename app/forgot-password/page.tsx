'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetLink, setResetLink] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Veuillez entrer votre email')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        
        // En mode développement, afficher le lien
        if (data.developmentLink) {
          setResetLink(data.developmentLink)
        } else {
          // En production, rediriger vers la page de connexion après quelques secondes
          setTimeout(() => {
            router.push('/sign-in')
          }, 3000)
        }
      } else {
        toast.error(data.message || 'Erreur lors de la demande')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la demande de réinitialisation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center mb-4">
            Mot de passe oublié ?
          </h2>
          
          <p className="text-sm text-base-content/70 mb-6 text-center">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {!resetLink ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="votreemail@exemple.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>

              <div className="text-center mt-4">
                <Link href="/sign-in" className="link link-primary text-sm">
                  Retour à la connexion
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Lien de réinitialisation généré !</span>
              </div>

              <div className="bg-base-200 p-4 rounded-lg">
                <p className="text-xs font-semibold mb-2 text-warning">
                  ⚠️ MODE DÉVELOPPEMENT
                </p>
                <p className="text-sm mb-2">
                  Utilisez ce lien pour réinitialiser votre mot de passe :
                </p>
                <div className="flex gap-2">
                  <input
                    id="reset-link-input"
                    type="text"
                    value={resetLink}
                    readOnly
                    aria-label="Lien de réinitialisation"
                    className="input input-bordered input-sm flex-1 text-xs"
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(resetLink)
                      toast.success('Lien copié !')
                    }}
                  >
                    Copier
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={resetLink} className="btn btn-primary flex-1">
                  Ouvrir le lien
                </Link>
                <Link href="/sign-in" className="btn btn-outline flex-1">
                  Connexion
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
