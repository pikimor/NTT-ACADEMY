import { createClient } from '@/lib/supabase/server'
import type { Pregunta, PreguntaPublica } from '@/types/database'

// Solo para el reclutador (incluye respuesta_correcta)
export async function getPreguntasByModulo(moduloId: number): Promise<Pregunta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preguntas')
    .select('*')
    .eq('modulo_id', moduloId)

  if (error) throw new Error(error.message)
  return data ?? []
}

// Para el estudiante — SIN respuesta_correcta
export async function getPreguntasPublicasByModulo(moduloId: number): Promise<PreguntaPublica[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preguntas')
    .select('pregunta_id, modulo_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d')
    .eq('modulo_id', moduloId)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createPregunta(
  pregunta: Omit<Pregunta, 'pregunta_id'>
): Promise<Pregunta> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preguntas')
    .insert(pregunta)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deletePregunta(preguntaId: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('preguntas')
    .delete()
    .eq('pregunta_id', preguntaId)

  if (error) throw new Error(error.message)
}
