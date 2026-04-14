import { createClient } from '@/lib/supabase/server'
import type { CandidatoConPerfil } from '@/types/database'

export async function getCandidatosElite(): Promise<CandidatoConPerfil[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('candidatos_elite')
    .select(`
      *,
      usuario:usuarios(usuario_id, nombre, correo, rol),
      calificaciones(*, modulo:modulos(modulo_id, nombre_tema))
    `)
    .order('promedio_final', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as CandidatoConPerfil[]
}

export async function getCandidatoById(usuarioId: string): Promise<CandidatoConPerfil | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('candidatos_elite')
    .select(`
      *,
      usuario:usuarios(usuario_id, nombre, correo, rol),
      calificaciones(*, modulo:modulos(modulo_id, nombre_tema))
    `)
    .eq('usuario_id', usuarioId)
    .single()

  if (error) return null
  return data as CandidatoConPerfil
}
