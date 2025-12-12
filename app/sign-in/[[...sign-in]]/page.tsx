"use client"
import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PackagePlus } from 'lucide-react'
import { toast } from 'react-toastify'

const SignInPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 handleSubmit appelé - DÉBUT')
    e.preventDefault()
    console.log('✋ preventDefault appelé')
    setLoading(true)
    console.log('⏳ Loading activé')

    try {
      console.log('🔄 Tentative de connexion avec:', email)
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('📥 SignIn result complet:', JSON.stringify(result, null, 2))
      console.log('📊 Result.ok:', result?.ok)
      console.log('📊 Result.error:', result?.error)
      console.log('📊 Result.status:', result?.status)
      console.log('📊 Result.url:', result?.url)

      if (result?.error) {
        console.error('❌ Erreur de connexion:', result.error)
        toast.error('Email ou mot de passe incorrect')
        setLoading(false)
      } else if (result?.ok) {
        console.log('✅ Connexion réussie, redirection dans 1000ms...')
        toast.success('Connexion réussie !')
        // Attendre que la session soit enregistrée
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('🔀 Redirection vers /post-sign-in')
        window.location.href = '/post-sign-in'
      } else {
        // Cas inattendu - même si pas d'erreur explicite, on redirige quand même
        console.warn('⚠️ Résultat inattendu mais pas d\'erreur - tentative de redirection:', result)
        toast.success('Connexion en cours...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('🔀 Redirection forcée vers /post-sign-in')
        window.location.href = '/post-sign-in'
      }
    } catch (error) {
      console.error('💥 Erreur de connexion:', error)
      console.error('💥 Stack:', error instanceof Error ? error.stack : 'No stack')
      toast.error('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className='flex justify-center items-center min-h-screen bg-linear-to-br from-base-200 to-base-300'>
      <div className='card w-full max-w-md bg-base-100 shadow-2xl'>
        <div className='card-body'>
          <div className='flex items-center justify-center gap-2 mb-6'>
            <PackagePlus className='w-8 h-8 text-primary' />
            <h1 className='text-3xl font-bold text-center'>GeStock</h1>
          </div>
          
          <h2 className='text-2xl font-semibold text-center mb-6'>Connexion</h2>
          
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Email</span>
              </label>
              <input
                type='email'
                placeholder='votre@email.com'
                className='input input-bordered w-full'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Mot de passe</span>
              </label>
              <input
                type='password'
                placeholder='••••••••'
                className='input input-bordered w-full'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label className='label'>
                <Link href='/forgot-password' className='label-text-alt link link-hover link-primary'>
                  Mot de passe oublié ?
                </Link>
              </label>
            </div>

            <div className='form-control mt-6'>
              <button
                type='submit'
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>

          <div className='divider'>OU</div>

          <p className='text-center text-sm'>
            Pas encore de compte ?{' '}
            <Link href='/sign-up' className='link link-primary'>
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignInPage
