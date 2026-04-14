'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Rol } from '@/types/database'

interface NavbarProps {
  rol: Rol
}

export function Navbar({ rol }: NavbarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const links = rol === 'estudiante'
    ? [
        { href: '/cursos', label: 'Cursos' },
        { href: '/dashboard', label: 'Mi progreso' },
      ]
    : [
        { href: '/reclutador/cursos', label: 'Mis cursos' },
        { href: '/reclutador/candidatos', label: 'Candidatos Elite' },
      ]

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-blue-700">NTT Academy</span>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-red-600"
      >
        Cerrar sesion
      </button>
    </nav>
  )
}
