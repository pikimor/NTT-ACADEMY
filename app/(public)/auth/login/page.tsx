'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ correo: '', password: '' })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.correo,
      password: form.password,
    })

    if (signInError) {
      setError('Correo o contrasena incorrectos')
      setLoading(false)
      return
    }

    // El middleware redirige segun el rol
    router.refresh()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Iniciar sesion</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading}>
            Iniciar sesion
          </Button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          No tenes cuenta?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
