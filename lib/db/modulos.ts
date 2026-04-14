import { createClient } from '@/lib/supabase/server'
import type { Modulo, ModuloConArchivos } from '@/types/database'

export async function getModulos(): Promise<Modulo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .order('fecha_creacion', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getModuloById(id: number): Promise<ModuloConArchivos | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modulos')
    .select('*, archivos(*)')
    .eq('modulo_id', id)
    .single()

  if (error) return null
  return data as ModuloConArchivos
}

export async function getModulosByReclutador(reclutadorId: string): Promise<Modulo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .eq('reclutador_id', reclutadorId)
    .order('fecha_creacion', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createModulo(
  modulo: Pick<Modulo, 'nombre_tema' | 'descripcion' | 'area_ti' | 'reclutador_id'>
): Promise<Modulo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modulos')
    .insert(modulo)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
