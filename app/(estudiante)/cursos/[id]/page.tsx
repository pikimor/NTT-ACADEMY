import { createClient } from '@/lib/supabase/server'
import { getModuloById } from '@/lib/db/modulos'
import { MaterialViewer } from '@/components/cursos/MaterialViewer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

async function inscribirse(moduloId: number, usuarioId: string) {
  'use server'
  const supabase = await createClient()
  await supabase
    .from('inscripciones')
    .upsert({ usuario_id: usuarioId, modulo_id: moduloId }, { onConflict: 'usuario_id,modulo_id' })
  redirect(`/cursos/${moduloId}`)
}

export default async function CursoDetailPage({ params }: PageProps) {
  const { id } = await params
  const moduloId = parseInt(id)

  if (isNaN(moduloId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [modulo, inscripcionRes, calificacionRes] = await Promise.all([
    getModuloById(moduloId),
    supabase
      .from('inscripciones')
      .select('completado')
      .eq('usuario_id', user!.id)
      .eq('modulo_id', moduloId)
      .maybeSingle(),
    supabase
      .from('calificaciones')
      .select('nota')
      .eq('usuario_id', user!.id)
      .eq('modulo_id', moduloId)
      .maybeSingle(),
  ])

  if (!modulo) notFound()

  const inscrito = !!inscripcionRes.data
  const nota = calificacionRes.data?.nota

  const inscribirseAction = inscribirse.bind(null, moduloId, user!.id)

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{modulo.nombre_tema}</h1>
        {modulo.area_ti && <Badge variant="blue">{modulo.area_ti}</Badge>}
      </div>

      {modulo.descripcion && (
        <p className="text-gray-600 mb-6">{modulo.descripcion}</p>
      )}

      {nota !== undefined && nota !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            Tu nota en este curso: <span className="text-xl">{nota.toFixed(2)}</span> / 5.00
          </p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Materiales del curso</h2>
        <MaterialViewer archivos={modulo.archivos} />
      </section>

      <div className="flex gap-3">
        {!inscrito ? (
          <form action={inscribirseAction}>
            <Button type="submit">Inscribirse al curso</Button>
          </form>
        ) : nota === null || nota === undefined ? (
          <Link href={`/cursos/${moduloId}/quiz`}>
            <Button>Tomar el quiz</Button>
          </Link>
        ) : (
          <Badge variant="green">Quiz completado</Badge>
        )}
      </div>
    </div>
  )
}
