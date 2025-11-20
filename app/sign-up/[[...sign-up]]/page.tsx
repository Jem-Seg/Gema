"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PackagePlus } from 'lucide-react'
import { toast } from 'react-toastify'

const SignUpPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    name: '',
    adminSecretKey: ''
  })
  const [loading, setLoading] = useState(false)
  const [isFirstUser, setIsFirstUser] = useState(false)

  // Vérifier si c'est le premier utilisateur au chargement
  React.useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await fetch('/api/auth/check-first-user')
        const data = await response.json()
        setIsFirstUser(data.isFirstUser)
      } catch (error) {
        console.error('Erreur lors de la vérification:', error)
      }
    }
    checkFirstUser()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          name: formData.name,
          adminSecretKey: formData.adminSecretKey
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.isFirstUser) {
          toast.success('Compte administrateur créé avec succès ! Vous pouvez maintenant vous connecter.')
        } else {
          toast.success('Inscription réussie ! Votre compte sera activé après validation.')
        }
        router.push('/sign-in')
      } else {
        toast.error(data.message || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error)
      toast.error('Une erreur est survenue')
    } finally {
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
          
          <h2 className='text-2xl font-semibold text-center mb-6'>
            {isFirstUser ? 'Créer le compte administrateur' : 'Inscription'}
          </h2>

          {isFirstUser && (
            <div className='alert alert-info mb-4'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Aucun utilisateur détecté. Créez le premier compte administrateur.</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className='space-y-4'>
            {isFirstUser && (
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text font-medium'>Clé d'administration *</span>
                </label>
                <input
                  type='password'
                  name='adminSecretKey'
                  placeholder='Clé secrète admin'
                  className='input input-bordered w-full'
                  value={formData.adminSecretKey}
                  onChange={handleChange}
                  required={isFirstUser}
                />
                <label className='label'>
                  <span className='label-text-alt text-warning'>Contactez l'administrateur système pour obtenir cette clé</span>
                </label>
              </div>
            )}
            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Prénom</span>
              </label>
              <input
                type='text'
                name='firstName'
                placeholder='Votre prénom'
                className='input input-bordered w-full'
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Nom</span>
              </label>
              <input
                type='text'
                name='name'
                placeholder='Votre nom'
                className='input input-bordered w-full'
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Email</span>
              </label>
              <input
                type='email'
                name='email'
                placeholder='votre@email.com'
                className='input input-bordered w-full'
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Mot de passe</span>
              </label>
              <input
                type='password'
                name='password'
                placeholder='••••••••'
                className='input input-bordered w-full'
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <label className='label'>
                <span className='label-text-alt'>Minimum 8 caractères</span>
              </label>
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Confirmer le mot de passe</span>
              </label>
              <input
                type='password'
                name='confirmPassword'
                placeholder='••••••••'
                className='input input-bordered w-full'
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className='form-control mt-6'>
              <button
                type='submit'
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </div>
          </form>

          <div className='divider'>OU</div>

          <p className='text-center text-sm'>
            Vous avez déjà un compte ?{' '}
            <Link href='/sign-in' className='link link-primary'>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
