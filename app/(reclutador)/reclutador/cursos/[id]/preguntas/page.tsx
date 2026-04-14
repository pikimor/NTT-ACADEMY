import { createClient } from '@/lib/supabase/server'
import { getPreguntasByModulo } from '@/lib/db/preguntas'
import { getModuloById } from '@/lib/db/modulos'
import { Badge } from '@/components/ui/Badge'
import { notFound, redirect } from 'next/navigation'
import { PreguntasManager } from './PreguntasManager'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PreguntasPage({ params }: PageProps) {
  const { id } = await params
  const moduloId = parseInt(id)

  if (isNaN(moduloId)) notFound()

  const [modulo, preguntas] = await Promise.all([
    getModuloById(moduloId),
    getPreguntasByModulo(moduloId),
  ])

  if (!modulo) notFound()

  async function addPregunta(formData: FormData) {
    'use server'
    const supabase = await createClient()
    await supabase.from('preguntas').insert({
      modulo_id: moduloId,
      enunciado: formData.get('enunciado') as string,
      opcion_a: formData.get('opcion_a') as string,
      opcion_b: formData.get('opcion_b') as string,
      opcion_c: formData.get('opcion_c') as string,
      opcion_d: formData.get('opcion_d') as string,
      respuesta_correcta: formData.get('respuesta_correcta') as string,
    })
    redirect(`/reclutador/cursos/${moduloId}/preguntas`)
  }

  async function deletePregunta(preguntaId: number) {
    'use server'
    const supabase = await createClient()
    await supabase.from('preguntas').delete().eq('pregunta_id', preguntaId)
    redirect(`/reclutador/cursos/${moduloId}/preguntas`)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{modulo.nombre_tema}</h1>
        {modulo.area_ti && <Badge variant="blue">{modulo.area_ti}</Badge>}
      </div>
      <p className="text-gray-500 mb-6">{preguntas.length} pregunta(s) en el quiz</p>

      <PreguntasManager
        preguntas={preguntas}
        addPregunta={addPregunta}
        deletePregunta={deletePregunta}
      />
    </div>
  )
}
