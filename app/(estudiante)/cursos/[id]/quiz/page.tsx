import { createClient } from '@/lib/supabase/server'
import { getPreguntasPublicasByModulo, getPreguntasByModulo } from '@/lib/db/preguntas'
import { insertCalificacion } from '@/lib/db/calificaciones'
import { QuizForm } from '@/components/quiz/QuizForm'
import { notFound, redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuizPage({ params }: PageProps) {
  const { id } = await params
  const moduloId = parseInt(id)

  if (isNaN(moduloId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar que el estudiante esta inscripto
  const { data: inscripcion } = await supabase
    .from('inscripciones')
    .select('inscripcion_id, completado')
    .eq('usuario_id', user!.id)
    .eq('modulo_id', moduloId)
    .maybeSingle()

  if (!inscripcion) {
    redirect(`/cursos/${moduloId}`)
  }

  // Verificar que no haya completado el quiz ya
  const { data: calificacionExistente } = await supabase
    .from('calificaciones')
    .select('nota')
    .eq('usuario_id', user!.id)
    .eq('modulo_id', moduloId)
    .maybeSingle()

  if (calificacionExistente) {
    redirect(`/cursos/${moduloId}`)
  }

  const preguntas = await getPreguntasPublicasByModulo(moduloId)

  if (preguntas.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Quiz del curso</h1>
        <p className="text-gray-500">Este curso aun no tiene preguntas. Volve mas tarde.</p>
      </div>
    )
  }

  // Server Action: corrige el quiz server-side (nunca expone respuesta_correcta al cliente)
  async function submitQuiz(respuestas: Record<number, string>): Promise<{ nota: number; correctas: number }> {
    'use server'

    const preguntasConRespuesta = await getPreguntasByModulo(moduloId)
    let correctas = 0

    for (const pregunta of preguntasConRespuesta) {
      if (respuestas[pregunta.pregunta_id] === pregunta.respuesta_correcta) {
        correctas++
      }
    }

    const nota = parseFloat(((correctas / preguntasConRespuesta.length) * 5).toFixed(2))

    await insertCalificacion(user!.id, moduloId, nota)

    // Marcar inscripcion como completada
    const supabaseServer = await createClient()
    await supabaseServer
      .from('inscripciones')
      .update({ completado: true })
      .eq('usuario_id', user!.id)
      .eq('modulo_id', moduloId)

    return { nota, correctas }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz del curso</h1>
      <p className="text-gray-500 mb-6">{preguntas.length} preguntas — responde todas antes de enviar.</p>
      <QuizForm
        preguntas={preguntas}
        moduloId={moduloId}
        submitQuiz={submitQuiz}
      />
    </div>
  )
}
