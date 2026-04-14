'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { QuizResult } from './QuizResult'
import type { PreguntaPublica } from '@/types/database'

interface QuizFormProps {
  preguntas: PreguntaPublica[]
  moduloId: number
  submitQuiz: (respuestas: Record<number, string>) => Promise<{ nota: number; correctas: number }>
}

export function QuizForm({ preguntas, moduloId, submitQuiz }: QuizFormProps) {
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [resultado, setResultado] = useState<{ nota: number; correctas: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const opciones: { key: 'a' | 'b' | 'c' | 'd'; label: string }[] = [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
    { key: 'c', label: 'C' },
    { key: 'd', label: 'D' },
  ]

  const handleSubmit = async () => {
    if (Object.keys(respuestas).length < preguntas.length) {
      setError('Debes responder todas las preguntas antes de enviar.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await submitQuiz(respuestas)
      setResultado(res)
    } catch {
      setError('Error al enviar el quiz. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (resultado) {
    return (
      <QuizResult
        nota={resultado.nota}
        correctas={resultado.correctas}
        total={preguntas.length}
        moduloId={moduloId}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {preguntas.map((pregunta, index) => (
        <div key={pregunta.pregunta_id} className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="font-semibold text-gray-900 mb-4">
            {index + 1}. {pregunta.enunciado}
          </p>
          <div className="flex flex-col gap-2">
            {opciones.map(({ key, label }) => {
              const valor = pregunta[`opcion_${key}` as keyof PreguntaPublica] as string
              const seleccionada = respuestas[pregunta.pregunta_id] === key
              return (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    seleccionada
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`pregunta-${pregunta.pregunta_id}`}
                    value={key}
                    checked={seleccionada}
                    onChange={() =>
                      setRespuestas(prev => ({ ...prev, [pregunta.pregunta_id]: key }))
                    }
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-gray-700">{label}.</span>
                  <span className="text-gray-700">{valor}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Button onClick={handleSubmit} loading={loading}>
        Enviar respuestas
      </Button>
    </div>
  )
}
