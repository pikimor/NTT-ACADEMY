import { getCandidatosElite } from '@/lib/db/candidatos'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export default async function CandidatosPage() {
  const candidatos = await getCandidatosElite()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Candidatos Elite</h1>
      <p className="text-gray-500 mb-6">
        Estudiantes con promedio >= 4.5 — listos para ser contactados.
      </p>

      {candidatos.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Aun no hay candidatos elite.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {candidatos.map(c => (
            <Card key={c.elite_id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{c.usuario.nombre}</p>
                <p className="text-sm text-gray-500">{c.usuario.correo}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{c.promedio_final.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">promedio</p>
                </div>
                <Link
                  href={`/reclutador/candidatos/${c.usuario_id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver perfil
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
