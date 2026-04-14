import type { Archivo } from '@/types/database'

interface MaterialViewerProps {
  archivos: Archivo[]
}

export function MaterialViewer({ archivos }: MaterialViewerProps) {
  if (archivos.length === 0) {
    return <p className="text-gray-500 text-sm">Este curso aun no tiene materiales.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {archivos.map(archivo => (
        <li key={archivo.archivo_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-2xl">{archivo.tipo === 'pdf' ? 'PDF' : 'VIDEO'}</span>
          <div className="flex-1">
            <p className="font-medium text-sm text-gray-900">{archivo.nombre}</p>
            <span className="text-xs text-gray-500 uppercase">{archivo.tipo}</span>
          </div>
          <a
            href={archivo.url_storage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {archivo.tipo === 'pdf' ? 'Descargar' : 'Ver video'}
          </a>
        </li>
      ))}
    </ul>
  )
}
