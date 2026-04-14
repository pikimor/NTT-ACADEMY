'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const AREAS_TI = ['Redes', 'Ciberseguridad', 'Cloud', 'Bases de datos', 'Programacion', 'Soporte TI', 'DevOps', 'Data Analytics']

export default function NuevoCursoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre_tema: '', descripcion: '', area_ti: '' })
  const [archivos, setArchivos] = useState<File[]>([])

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const invalidos = files.filter(f => !f.type.startsWith('video/') && f.type !== 'application/pdf')
    if (invalidos.length > 0) {
      setError('Solo se permiten archivos PDF o video.')
      return
    }
    setError(null)
    setArchivos(files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre_tema.trim()) {
      setError('El nombre del curso es obligatorio.')
      return
    }
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Crear el modulo
    const { data: modulo, error: moduloError } = await supabase
      .from('modulos')
      .insert({
        nombre_tema: form.nombre_tema,
        descripcion: form.descripcion || null,
        area_ti: form.area_ti || null,
        reclutador_id: user!.id,
      })
      .select()
      .single()

    if (moduloError || !modulo) {
      setError('Error al crear el curso.')
      setLoading(false)
      return
    }

    // 2. Subir cada archivo a Supabase Storage + registrar en DB
    for (const file of archivos) {
      const path = `modulo-${modulo.modulo_id}/${Date.now()}-${file.name}`
      const tipo = file.type === 'application/pdf' ? 'pdf' : 'video'

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(path, file)

      if (uploadError) {
        setError(`Error subiendo ${file.name}`)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(path)

      await supabase.from('archivos').insert({
        modulo_id: modulo.modulo_id,
        nombre: file.name,
        tipo,
        url_storage: urlData.publicUrl,
      })
    }

    router.push(`/reclutador/cursos/${modulo.modulo_id}/preguntas`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear nuevo curso</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          id="nombre_tema"
          label="Nombre del curso"
          value={form.nombre_tema}
          onChange={handleChange('nombre_tema')}
          placeholder="Ej: Introduccion a Ciberseguridad"
          required
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
            Descripcion
          </label>
          <textarea
            id="descripcion"
            value={form.descripcion}
            onChange={handleChange('descripcion')}
            rows={3}
            placeholder="Que aprenderian los estudiantes?"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="area_ti" className="text-sm font-medium text-gray-700">
            Area TI
          </label>
          <select
            id="area_ti"
            value={form.area_ti}
            onChange={handleChange('area_ti')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar area...</option>
            {AREAS_TI.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Materiales del curso (PDF o video)
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,video/*"
            onChange={handleFileChange}
            className="text-sm text-gray-600"
          />
          {archivos.length > 0 && (
            <ul className="text-sm text-gray-500">
              {archivos.map(f => <li key={f.name}>• {f.name}</li>)}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" loading={loading}>
          Crear curso y configurar quiz
        </Button>
      </form>
    </div>
  )
}
