'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="card w-96 bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-error">Une erreur est survenue</h2>
              <p className="text-base-content/70">
                {error.message || 'Erreur inattendue'}
              </p>
              <div className="card-actions justify-end">
                <button onClick={reset} className="btn btn-primary">
                  Réessayer
                </button>
                <a href="/" className="btn btn-ghost">
                  Retour à l'accueil
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
