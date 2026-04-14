import { createClient } from '@/lib/supabase/server'
import { getModulos } from '@/lib/db/modulos'
import { CourseCard } from '@/components/cursos/CourseCard'

export default async function CursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [modulos, inscripcionesRes] = await Promise.all([
    getModulos(),
    supabase
      .from('inscripciones')
      .select('modulo_id')
      .eq('usuario_id', user!.id),
  ])

  const modulosInscritos = new Set(
    (inscripcionesRes.data ?? []).map(i => i.modulo_id)
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cursos disponibles</h1>

      {modulos.length === 0 ? (
        <p className="text-gray-500">Aun no hay cursos disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map(modulo => (
            <CourseCard
              key={modulo.modulo_id}
              modulo={modulo}
              inscrito={modulosInscritos.has(modulo.modulo_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
