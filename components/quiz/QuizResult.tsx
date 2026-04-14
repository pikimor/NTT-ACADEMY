import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface QuizResultProps {
  nota: number
  correctas: number
  total: number
  moduloId: number
}

export function QuizResult({ nota, correctas, total, moduloId }: QuizResultProps) {
  const esElite = nota >= 4.5
  return (
    <div className="text-center py-8">
      <p className="text-5xl font-extrabold text-gray-900 mb-2">{nota.toFixed(2)}</p>
      <p className="text-gray-500 mb-4">{correctas} de {total} respuestas correctas</p>
      {esElite && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-semibold">
            Excelencia! Tu promedio te posiciona como candidato elite.
          </p>
        </div>
      )}
      <Badge variant={nota >= 3 ? 'green' : 'gray'}>
        {nota >= 4.5 ? 'Excelente' : nota >= 3 ? 'Aprobado' : 'Reprobado'}
      </Badge>
      <div className="mt-6">
        <Link href={`/cursos/${moduloId}`} className="text-blue-600 hover:underline text-sm">
          Volver al curso
        </Link>
      </div>
    </div>
  )
}
