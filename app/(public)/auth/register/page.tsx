'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Rol } from '@/types/database'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'estudiante' as Rol })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.correo,
      password: form.password,
      options: {
        data: { nombre: form.nombre, rol: form.rol },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push(form.rol === 'reclutador' ? '/reclutador/cursos' : '/cursos')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear cuenta</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="nombre"
            label="Nombre completo"
            value={form.nombre}
            onChange={handleChange('nombre')}
            required
          />
          <Input
            id="correo"
            label="Correo electronico"
            type="email"
            value={form.correo}
            onChange={handleChange('correo')}
            required
          />
          <Input
            id="password"
            label="Contrasena"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required
            minLength={6}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="rol" className="text-sm font-medium text-gray-700">
              Registrarse como
            </label>
            <select
              id="rol"
              value={form.rol}
              onChange={handleChange('rol')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="estudiante">Estudiante</option>
              <option value="reclutador">Reclutador</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading}>
            Crear cuenta
          </Button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Ya tenes cuenta?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  )
}
