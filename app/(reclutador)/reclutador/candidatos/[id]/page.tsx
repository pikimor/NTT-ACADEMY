import { getCandidatoById } from '@/lib/db/candidatos'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CandidatoPerfilPage({ params }: PageProps) {
  const { id } = await params
  const candidato = await getCandidatoById(id)

  if (!candidato) notFound()

  const { usuario, calificaciones, promedio_final } = candidato

  return (
    <div className="max-w-2xl">
      <Link href="/reclutador/candidatos" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        Volver a candidatos
      </Link>

      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{usuario.nombre}</h1>
            <p className="text-gray-600 mt-1">{usuario.correo}</p>
            <a
              href={`mailto:${usuario.correo}`}
              className="mt-2 inline-block text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Contactar por email
            </a>
          </div>
          <div className="text-right">
            <p className="text-4xl font-extrabold text-green-600">{promedio_final.toFixed(2)}</p>
            <p className="text-xs text-gray-400">promedio final</p>
            <Badge variant="yellow">Candidato Elite</Badge>
          </div>
        </div>
      </Card>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Calificaciones ({calificaciones.length} curso(s))
      </h2>

      {calificaciones.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin calificaciones registradas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {calificaciones.map(c => (
            <div
              key={c.calificacion_id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{c.modulo.nombre_tema}</p>
                <p className="text-xs text-gray-400">
                  {new Date(c.fecha).toLocaleDateString('es-AR')}
                </p>
              </div>
              <span className={`text-lg font-bold ${c.nota >= 4.5 ? 'text-green-600' : 'text-blue-600'}`}>
                {c.nota.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
