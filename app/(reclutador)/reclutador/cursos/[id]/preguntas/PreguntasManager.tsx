'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Pregunta } from '@/types/database'

const OPCIONES = ['a', 'b', 'c', 'd'] as const

interface PreguntasManagerProps {
  preguntas: Pregunta[]
  addPregunta: (formData: FormData) => Promise<void>
  deletePregunta: (id: number) => Promise<void>
}

export function PreguntasManager({ preguntas, addPregunta, deletePregunta }: PreguntasManagerProps) {
  const [mostrarForm, setMostrarForm] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {preguntas.length > 0 && (
        <div className="flex flex-col gap-3">
          {preguntas.map((p, i) => (
            <Card key={p.pregunta_id} className="relative">
              <p className="font-medium text-gray-900 mb-2">{i + 1}. {p.enunciado}</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-2">
                {OPCIONES.map(op => (
                  <li key={op} className={p.respuesta_correcta === op ? 'text-green-700 font-semibold' : ''}>
                    {op.toUpperCase()}. {p[`opcion_${op}` as keyof Pregunta] as string}
                    {p.respuesta_correcta === op && ' (correcta)'}
                  </li>
                ))}
              </ul>
              <form action={deletePregunta.bind(null, p.pregunta_id)}>
                <button type="submit" className="text-xs text-red-500 hover:underline">
                  Eliminar pregunta
                </button>
              </form>
            </Card>
          ))}
        </div>
      )}

      {!mostrarForm ? (
        <Button variant="secondary" onClick={() => setMostrarForm(true)}>
          + Agregar pregunta
        </Button>
      ) : (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Nueva pregunta</h3>
          <form action={addPregunta} className="flex flex-col gap-3">
            <textarea
              name="enunciado"
              placeholder="Enunciado de la pregunta"
              required
              rows={2}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {OPCIONES.map(op => (
              <input
                key={op}
                name={`opcion_${op}`}
                placeholder={`Opcion ${op.toUpperCase()}`}
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Respuesta correcta</label>
              <select
                name="respuesta_correcta"
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {OPCIONES.map(op => (
                  <option key={op} value={op}>Opcion {op.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Guardar pregunta</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
