import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h2 className="card-title text-4xl text-error justify-center">404</h2>
          <p className="text-xl font-semibold">Page non trouvée</p>
          <p className="text-base-content/70">
            La page que vous recherchez n'existe pas.
          </p>
          <div className="card-actions justify-center mt-4">
            <Link href="/" className="btn btn-primary">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
