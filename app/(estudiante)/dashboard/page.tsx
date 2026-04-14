import { createClient } from '@/lib/supabase/server'
import { getCalificacionesByUsuario } from '@/lib/db/calificaciones'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [calificaciones, candidatoRes, inscripcionesRes] = await Promise.all([
    getCalificacionesByUsuario(user!.id),
    supabase
      .from('candidatos_elite')
      .select('promedio_final')
      .eq('usuario_id', user!.id)
      .maybeSingle(),
    supabase
      .from('inscripciones')
      .select('inscripcion_id, completado')
      .eq('usuario_id', user!.id),
  ])

  const promedio = calificaciones.length > 0
    ? calificaciones.reduce((acc, c) => acc + c.nota, 0) / calificaciones.length
    : null

  const esElite = !!candidatoRes.data
  const totalInscritos = inscripcionesRes.data?.length ?? 0
  const totalCompletados = inscripcionesRes.data?.filter(i => i.completado).length ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi progreso</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500 mb-1">Promedio general</p>
          <p className="text-3xl font-bold text-gray-900">
            {promedio !== null ? promedio.toFixed(2) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">sobre 5.00</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Cursos completados</p>
          <p className="text-3xl font-bold text-gray-900">{totalCompletados}</p>
          <p className="text-xs text-gray-400 mt-1">de {totalInscritos} inscripciones</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Estado</p>
          {esElite ? (
            <>
              <Badge variant="yellow">Candidato Elite</Badge>
              <p className="text-xs text-gray-500 mt-2">Visible para reclutadores NTT</p>
            </>
          ) : (
            <>
              <Badge variant="gray">Estudiante regular</Badge>
              <p className="text-xs text-gray-500 mt-2">Promedio >= 4.5 para ser elite</p>
            </>
          )}
        </Card>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Historial de calificaciones</h2>
      {calificaciones.length === 0 ? (
        <p className="text-gray-500 text-sm">Aun no completaste ningun quiz.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {calificaciones.map(c => (
            <div
              key={c.calificacion_id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{c.modulos.nombre_tema}</p>
                <p className="text-xs text-gray-400">
                  {new Date(c.fecha).toLocaleDateString('es-AR')}
                </p>
              </div>
              <span className={`text-lg font-bold ${c.nota >= 4.5 ? 'text-green-600' : c.nota >= 3 ? 'text-blue-600' : 'text-red-500'}`}>
                {c.nota.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
