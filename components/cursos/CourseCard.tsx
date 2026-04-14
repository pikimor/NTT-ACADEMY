import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Modulo } from '@/types/database'

interface CourseCardProps {
  modulo: Modulo
  inscrito?: boolean
}

export function CourseCard({ modulo, inscrito = false }: CourseCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{modulo.nombre_tema}</h3>
        {inscrito && <Badge variant="green">Inscripto</Badge>}
      </div>
      {modulo.area_ti && (
        <Badge variant="blue">{modulo.area_ti}</Badge>
      )}
      {modulo.descripcion && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{modulo.descripcion}</p>
      )}
      <Link
        href={`/cursos/${modulo.modulo_id}`}
        className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        Ver curso →
      </Link>
    </Card>
  )
}
