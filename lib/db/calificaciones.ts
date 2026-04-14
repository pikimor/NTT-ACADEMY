import { createClient } from '@/lib/supabase/server'
import type { Calificacion } from '@/types/database'

export async function getCalificacionesByUsuario(usuarioId: string): Promise<
  (Calificacion & { modulos: { nombre_tema: string } })[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('calificaciones')
    .select('*, modulos(nombre_tema)')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as (Calificacion & { modulos: { nombre_tema: string } })[]
}

export async function getCalificacionesByUsuarioParaReclutador(
  usuarioId: string
): Promise<(Calificacion & { modulos: { nombre_tema: string } })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('calificaciones')
    .select('*, modulos(nombre_tema)')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as (Calificacion & { modulos: { nombre_tema: string } })[]
}

export async function insertCalificacion(
  usuarioId: string,
  moduloId: number,
  nota: number
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('calificaciones')
    .insert({ usuario_id: usuarioId, modulo_id: moduloId, nota })

  if (error) throw new Error(error.message)
}
