import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const rutasEstudiante = ['/cursos', '/dashboard']
  const rutasReclutador = ['/reclutador']

  const requiereAuth =
    rutasEstudiante.some(r => pathname.startsWith(r)) ||
    rutasReclutador.some(r => pathname.startsWith(r))

  if (!user && requiereAuth) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('usuario_id', user.id)
      .single()

    const rol = usuario?.rol

    // Estudiante intentando acceder a rutas de reclutador
    if (rol === 'estudiante' && pathname.startsWith('/reclutador')) {
      return NextResponse.redirect(new URL('/cursos', request.url))
    }

    // Reclutador intentando acceder a rutas de estudiante
    if (rol === 'reclutador' && rutasEstudiante.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/reclutador/cursos', request.url))
    }

    // Usuario autenticado intentando acceder a login/register
    if (pathname.startsWith('/auth')) {
      const redirect = rol === 'reclutador' ? '/reclutador/cursos' : '/cursos'
      return NextResponse.redirect(new URL(redirect, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
