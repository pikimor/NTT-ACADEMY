import { createClient } from '@/lib/supabase/server'
import { getModulosByReclutador } from '@/lib/db/modulos'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default async function MisCursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const modulos = await getModulosByReclutador(user!.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis cursos</h1>
        <Link href="/reclutador/cursos/nuevo">
          <Button>+ Crear curso</Button>
        </Link>
      </div>

      {modulos.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">Aun no creaste ningun curso.</p>
          <Link href="/reclutador/cursos/nuevo">
            <Button>Crear mi primer curso</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {modulos.map(modulo => (
            <Card key={modulo.modulo_id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{modulo.nombre_tema}</p>
                {modulo.area_ti && <Badge variant="blue">{modulo.area_ti}</Badge>}
              </div>
              <Link href={`/reclutador/cursos/${modulo.modulo_id}/preguntas`}>
                <Button variant="secondary">Gestionar quiz</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
