import { createClient } from '@/lib/supabase/server'
import type { Archivo, TipoArchivo } from '@/types/database'

export async function createArchivo(archivo: Omit<Archivo, 'archivo_id' | 'fecha_subida'>): Promise<Archivo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('archivos')
    .insert(archivo)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function uploadArchivoToStorage(
  file: File,
  moduloId: number
): Promise<string> {
  const supabase = await createClient()
  const extension = file.name.split('.').pop()
  const path = `modulo-${moduloId}/${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from('course-materials')
    .upload(path, file)

  if (error) throw new Error(error.message)

  const { data } = supabase.storage
    .from('course-materials')
    .getPublicUrl(path)

  return data.publicUrl
}

export function inferirTipoArchivo(file: File): TipoArchivo {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('video/')) return 'video'
  throw new Error('Tipo de archivo no soportado. Solo PDF o video.')
}
