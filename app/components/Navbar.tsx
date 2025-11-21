"use client"
import React from 'react'
import { ListTree, Menu, PackagePlus, X, Settings, ShoppingBasket, Warehouse, HandHelping, Receipt, LayoutDashboard, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useUserInfo } from '@/hooks/useUserInfo'
import { UserButton } from './UserButton'

const Navbar = () => {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { data: session, status } = useSession();
  const { user: dbUser, isAdmin, loading } = useUserInfo();

  // Vérifier si l'utilisateur peut accéder aux fonctionnalités
  const canAccessFeatures = dbUser?.isApproved && dbUser?.role;

  const navLinks = [
    { href: '/category', label: 'Catégories', icon: ListTree },
    { href: '/products', label: 'Produits', icon: ShoppingBasket },
    { href: '/alimentations', label: 'Alimentations', icon: TrendingUp },
    { href: '/octrois', label: 'Octrois', icon: TrendingDown },
    { href: '/transactions', label: 'Transactions', icon: Receipt },
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/statistiques', label: 'Statistiques', icon: BarChart3 },
  ]

  // Filtrer les liens selon les permissions
  // Afficher les liens si l'utilisateur a accès (même pendant le chargement pour éviter menu vide)
  let visibleLinks = (!session?.user) ? [] : (canAccessFeatures || isAdmin || loading ? navLinks : []);
  
  // Ajouter le lien admin si l'utilisateur est administrateur
  const allNavLinks = isAdmin
    ? [...visibleLinks, { href: '/admin/dashboard', label: 'Administration', icon: Settings }]
    : visibleLinks;

  const renderDesktopLinks = () => (
    <>
      {allNavLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href
        const activeClass = isActive ? 'btn-primary' : 'btn-ghost'
        return (
          <Link
            href={href}
            key={href}
            className={`btn ${activeClass} btn-sm flex gap-2 items-center`}
            onClick={() => setMenuOpen(false)}
          >
            <Icon className='w-4 h-4' />
            {label}
          </Link>
        )
      })}
    </>
  )

  const renderMobileLinks = () => (
    <>
      {allNavLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href
        return (
          <Link
            href={href}
            key={href}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-[#793205] text-white shadow-md'
                : 'hover:bg-[#F1D2BF]/30 text-base-content'
              }`}
          >
            <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-[#F1D2BF]/50'
              }`}>
              <Icon className='w-5 h-5' />
            </div>
            <span className='font-medium text-base'>{label}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <div className='border-b border-base-300 px-5 md:px-[10%] py-4 relative'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center'>
          <div className='p-2'>
            <PackagePlus className='w-6 h-6 text-primary' />
          </div>
          <span className='font-bold text-lg'>
            GeStock
          </span>
        </div>

        <button
          className='btn btn-ghost btn-circle sm:hidden'
          onClick={() => setMenuOpen(!menuOpen)}
          title="Menu"
        >
          <Menu className='w-5 h-5' />
        </button>

        <div className='hidden space-x-2 sm:flex items-center'>
          {renderDesktopLinks()}
          {status !== 'loading' && (
            <>
              {session?.user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {session.user.name}
                      {isAdmin && (
                        <span className="ml-2 badge badge-primary badge-xs">Admin</span>
                      )}
                    </div>
                    {dbUser?.role && (
                      <div className="text-xs text-base-content/70">
                        {dbUser.role.name}
                        {dbUser.ministere && (
                          <span className="ml-1">
                            - {dbUser.ministere.abreviation}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <UserButton />
                </div>
              ) : (
                <Link href="/sign-in" className="btn btn-primary btn-sm">
                  Se connecter
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Menu mobile avec design Retro */}
      <div className={`fixed top-0 right-0 w-80 h-screen bg-linear-to-b from-[#F1D2BF] to-base-100 shadow-2xl transition-transform duration-300 ease-in-out sm:hidden z-50 ${menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className='flex flex-col h-full'>
          {/* Header du menu mobile */}
          <div className='bg-[#793205] text-white p-4 shadow-md'>
            <div className='flex justify-between items-center mb-3'>
              <div className='flex items-center gap-2'>
                <PackagePlus className='w-6 h-6' />
                <span className='font-bold text-lg'>GeStock</span>
              </div>
              <button
                className='btn btn-circle btn-sm bg-white/20 border-none hover:bg-white/30'
                onClick={() => setMenuOpen(false)}
                title="Fermer menu"
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Info utilisateur dans le header */}
            {status !== 'loading' && session?.user && (
              <div className="flex items-center gap-3 pt-3 border-t border-white/20">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="font-semibold">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className='flex-1'>
                  <div className="text-sm font-semibold">
                    {session.user.name}
                  </div>
                  {dbUser?.role && (
                    <div className="text-xs opacity-90">
                      {dbUser.role.name}
                    </div>
                  )}
                  {isAdmin && (
                    <span className="badge badge-warning badge-xs mt-1">Admin</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation links */}
          <div className='flex-1 overflow-y-auto p-4 space-y-2'>
            {renderMobileLinks()}
          </div>

          {/* Footer du menu mobile */}
          <div className='p-4 bg-base-200 border-t border-base-300'>
            {status !== 'loading' && !session?.user && (
              <Link href="/sign-in" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>
                Se connecter
              </Link>
            )}
            {dbUser?.ministere && (
              <div className='text-xs text-center text-base-content/60 mt-3'>
                {dbUser.ministere.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay pour fermer le menu */}
      {menuOpen && (
        <div
          className='fixed inset-0 bg-black/50 sm:hidden z-40'
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}

export default Navbar
