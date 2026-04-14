# NTT Academy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir NTT Academy — plataforma de capacitación IT donde estudiantes toman cursos, son evaluados con quizzes automáticos, y los de mayor promedio (≥ 4.5) quedan visibles para reclutadores.

**Architecture:** Next.js 14 App Router con Server Actions para mutaciones. Route groups `/(public)`, `/(estudiante)`, `/(reclutador)` con middleware de protección. DB layer en `lib/db/` como funciones async puras. Supabase maneja auth, PostgreSQL y Storage.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL + Storage)

---

## ⚠️ Nota Crítica: MySQL → PostgreSQL

El `db.sql` original usa sintaxis MySQL (`AUTO_INCREMENT`, `DELIMITER //`, triggers MySQL). **Supabase usa PostgreSQL**. El schema completo se reescribe en este plan (Task 3). El `db.sql` original queda como referencia histórica — no se aplica directamente a Supabase.

---

## Mapa de Archivos

```
ntt-academy/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                              -- Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx                    -- Login
│   │   │   └── register/page.tsx                 -- Registro con rol
│   │   └── layout.tsx                            -- Layout público (navbar simple)
│   ├── (estudiante)/
│   │   ├── cursos/
│   │   │   ├── page.tsx                          -- Catálogo de cursos
│   │   │   └── [id]/
│   │   │       ├── page.tsx                      -- Detalle del curso
│   │   │       └── quiz/page.tsx                 -- Quiz del curso
│   │   ├── dashboard/page.tsx                    -- Progreso del estudiante
│   │   └── layout.tsx                            -- Layout estudiante (navbar con links)
│   ├── (reclutador)/
│   │   ├── reclutador/
│   │   │   ├── cursos/
│   │   │   │   ├── page.tsx                      -- Mis cursos
│   │   │   │   ├── nuevo/page.tsx                -- Crear curso + subir archivos
│   │   │   │   └── [id]/preguntas/page.tsx       -- Gestionar quiz
│   │   │   └── candidatos/
│   │   │       ├── page.tsx                      -- Lista de candidatos elite
│   │   │       └── [id]/page.tsx                 -- Perfil del candidato
│   │   └── layout.tsx                            -- Layout reclutador
│   └── layout.tsx                                -- Root layout
├── lib/
│   ├── supabase/
│   │   ├── client.ts                             -- Browser client (singleton)
│   │   └── server.ts                             -- Server client (cookies)
│   └── db/
│       ├── modulos.ts                            -- Queries de cursos/módulos
│       ├── calificaciones.ts                     -- Queries de notas
│       ├── candidatos.ts                         -- Queries de candidatos elite
│       ├── archivos.ts                           -- Queries de archivos del curso
│       └── preguntas.ts                          -- Queries de preguntas del quiz
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── cursos/
│   │   ├── CourseCard.tsx
│   │   └── MaterialViewer.tsx
│   └── quiz/
│       ├── QuizForm.tsx
│       └── QuizResult.tsx
├── types/
│   └── database.ts                              -- Tipos TypeScript del schema
├── middleware.ts                                 -- Protección de rutas por rol
├── supabase-schema.sql                          -- Schema PostgreSQL completo para Supabase
└── .env.local                                   -- Variables de entorno (no commitear)
```

---

## Task 1: Scaffold del proyecto Next.js

**Files:**
- Create: `ntt-academy/` (directorio raíz del proyecto)
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`

- [ ] **Step 1: Crear el proyecto Next.js**

```bash
npx create-next-app@latest ntt-academy \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=no \
  --import-alias="@/*"
cd ntt-academy
```

- [ ] **Step 2: Instalar dependencias de Supabase**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Crear archivo `.env.local` con placeholders**

```bash
# .env.local — reemplazar con valores reales de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://TUPROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> Estos valores se obtienen en Supabase Dashboard → Settings → API.

- [ ] **Step 4: Agregar `.env.local` al `.gitignore`**

Verificar que `.gitignore` incluya:
```
.env.local
```

- [ ] **Step 5: Verificar que el proyecto corre**

```bash
npm run dev
```

Abrir `http://localhost:3000` — debe mostrar la página default de Next.js.

- [ ] **Step 6: Commit inicial**

```bash
git add .
git commit -m "chore: scaffold Next.js project with Supabase dependencies"
```

---

## Task 2: Clientes Supabase

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Crear el cliente browser**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Crear el cliente server**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies read-only, OK ignorar
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase browser and server clients"
```

---

## Task 3: Schema PostgreSQL para Supabase

**Files:**
- Create: `supabase-schema.sql`

> Este archivo se ejecuta en Supabase Dashboard → SQL Editor. Reemplaza la lógica del `db.sql` original (que era MySQL).

- [ ] **Step 1: Escribir el schema completo**

```sql
-- supabase-schema.sql
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Tabla de usuarios (vinculada a auth.users de Supabase)
CREATE TABLE public.usuarios (
  usuario_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre       VARCHAR(100) NOT NULL,
  correo       VARCHAR(100) UNIQUE NOT NULL,
  rol          TEXT NOT NULL DEFAULT 'estudiante'
                CHECK (rol IN ('estudiante', 'reclutador')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger: cuando Supabase Auth crea un usuario → insertar en usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (usuario_id, nombre, correo, rol)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'nombre',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'rol', 'estudiante')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Módulos (cursos)
CREATE TABLE public.modulos (
  modulo_id      SERIAL PRIMARY KEY,
  nombre_tema    VARCHAR(100) NOT NULL,
  descripcion    TEXT,
  area_ti        VARCHAR(100),
  reclutador_id  UUID REFERENCES public.usuarios(usuario_id),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Archivos del curso
CREATE TABLE public.archivos (
  archivo_id   SERIAL PRIMARY KEY,
  modulo_id    INTEGER REFERENCES public.modulos(modulo_id) ON DELETE CASCADE,
  nombre       VARCHAR(200) NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('pdf', 'video')),
  url_storage  VARCHAR(500) NOT NULL,
  fecha_subida TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Preguntas del quiz
CREATE TABLE public.preguntas (
  pregunta_id        SERIAL PRIMARY KEY,
  modulo_id          INTEGER REFERENCES public.modulos(modulo_id) ON DELETE CASCADE,
  enunciado          TEXT NOT NULL,
  opcion_a           VARCHAR(300) NOT NULL,
  opcion_b           VARCHAR(300) NOT NULL,
  opcion_c           VARCHAR(300) NOT NULL,
  opcion_d           VARCHAR(300) NOT NULL,
  respuesta_correcta TEXT NOT NULL CHECK (respuesta_correcta IN ('a', 'b', 'c', 'd'))
);

-- 6. Inscripciones
CREATE TABLE public.inscripciones (
  inscripcion_id   SERIAL PRIMARY KEY,
  usuario_id       UUID REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE,
  modulo_id        INTEGER REFERENCES public.modulos(modulo_id) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMPTZ DEFAULT NOW(),
  completado       BOOLEAN DEFAULT FALSE,
  UNIQUE(usuario_id, modulo_id)
);

-- 7. Calificaciones
CREATE TABLE public.calificaciones (
  calificacion_id SERIAL PRIMARY KEY,
  usuario_id      UUID REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE,
  modulo_id       INTEGER REFERENCES public.modulos(modulo_id) ON DELETE CASCADE,
  nota            DECIMAL(3,2),
  fecha           TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Candidatos Elite
CREATE TABLE public.candidatos_elite (
  elite_id       SERIAL PRIMARY KEY,
  usuario_id     UUID UNIQUE REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE,
  promedio_final DECIMAL(3,2)
);

-- 9. Trigger AutomatizarSeleccion (equivalente PostgreSQL al trigger del db.sql original)
CREATE OR REPLACE FUNCTION public.automatizar_seleccion()
RETURNS TRIGGER AS $$
DECLARE
  promedio_actual DECIMAL(3,2);
BEGIN
  SELECT AVG(nota) INTO promedio_actual
  FROM public.calificaciones
  WHERE usuario_id = NEW.usuario_id;

  IF promedio_actual >= 4.5 THEN
    INSERT INTO public.candidatos_elite (usuario_id, promedio_final)
    VALUES (NEW.usuario_id, promedio_actual)
    ON CONFLICT (usuario_id) DO UPDATE SET promedio_final = promedio_actual;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automatizar_seleccion_trigger
  AFTER INSERT ON public.calificaciones
  FOR EACH ROW EXECUTE FUNCTION public.automatizar_seleccion();

-- 10. Row Level Security (RLS) — habilitar en todas las tablas
ALTER TABLE public.usuarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos_elite ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS

-- Usuarios: cada usuario ve su propio perfil; reclutadores ven todos
CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (true); -- todos los autenticados pueden leer (para perfil de candidatos)

CREATE POLICY "usuarios_update_own" ON public.usuarios
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Módulos: todos los autenticados pueden leer; solo reclutador dueño puede modificar
CREATE POLICY "modulos_select" ON public.modulos
  FOR SELECT USING (true);

CREATE POLICY "modulos_insert" ON public.modulos
  FOR INSERT WITH CHECK (auth.uid() = reclutador_id);

CREATE POLICY "modulos_update" ON public.modulos
  FOR UPDATE USING (auth.uid() = reclutador_id);

-- Archivos: lectura pública; escritura solo el reclutador dueño del módulo
CREATE POLICY "archivos_select" ON public.archivos
  FOR SELECT USING (true);

CREATE POLICY "archivos_insert" ON public.archivos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modulos
      WHERE modulo_id = archivos.modulo_id
        AND reclutador_id = auth.uid()
    )
  );

-- Preguntas: lectura solo campos sin respuesta_correcta (via función), insert solo reclutador
CREATE POLICY "preguntas_select" ON public.preguntas
  FOR SELECT USING (true); -- respuesta_correcta se filtra en código

CREATE POLICY "preguntas_insert" ON public.preguntas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modulos
      WHERE modulo_id = preguntas.modulo_id
        AND reclutador_id = auth.uid()
    )
  );

CREATE POLICY "preguntas_delete" ON public.preguntas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.modulos
      WHERE modulo_id = preguntas.modulo_id
        AND reclutador_id = auth.uid()
    )
  );

-- Inscripciones: estudiante ve/gestiona las suyas
CREATE POLICY "inscripciones_select" ON public.inscripciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "inscripciones_insert" ON public.inscripciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "inscripciones_update" ON public.inscripciones
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Calificaciones: estudiante ve las suyas; reclutador ve todas (para candidatos)
CREATE POLICY "calificaciones_select_own" ON public.calificaciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "calificaciones_insert_own" ON public.calificaciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Reclutadores ven calificaciones de candidatos elite
CREATE POLICY "calificaciones_select_reclutador" ON public.calificaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuario_id = auth.uid() AND rol = 'reclutador'
    )
  );

-- Candidatos Elite: reclutadores pueden leer
CREATE POLICY "candidatos_elite_select" ON public.candidatos_elite
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuario_id = auth.uid() AND rol = 'reclutador'
    )
  );

-- El trigger inserta en candidatos_elite con SECURITY DEFINER, sin necesidad de policy insert
```

- [ ] **Step 2: Aplicar el schema en Supabase**

1. Ir a `https://supabase.com/dashboard` → tu proyecto → **SQL Editor**
2. Pegar el contenido completo del archivo `supabase-schema.sql`
3. Hacer clic en **Run**
4. Verificar en **Table Editor** que aparecen todas las tablas: `usuarios`, `modulos`, `archivos`, `preguntas`, `inscripciones`, `calificaciones`, `candidatos_elite`

- [ ] **Step 3: Crear el bucket de Storage para archivos de cursos**

En Supabase Dashboard → **Storage** → **New bucket**:
- Name: `course-materials`
- Public bucket: ✅ (para que los archivos sean accesibles por URL)

- [ ] **Step 4: Commit**

```bash
git add supabase-schema.sql
git commit -m "feat: add PostgreSQL schema for Supabase with RLS policies and triggers"
```

---

## Task 4: Tipos TypeScript del schema

**Files:**
- Create: `types/database.ts`

- [ ] **Step 1: Definir los tipos**

```typescript
// types/database.ts

export type Rol = 'estudiante' | 'reclutador'
export type TipoArchivo = 'pdf' | 'video'
export type OpcionQuiz = 'a' | 'b' | 'c' | 'd'

export interface Usuario {
  usuario_id: string  // UUID
  nombre: string
  correo: string
  rol: Rol
  created_at: string
}

export interface Modulo {
  modulo_id: number
  nombre_tema: string
  descripcion: string | null
  area_ti: string | null
  reclutador_id: string | null  // UUID
  fecha_creacion: string
}

export interface Archivo {
  archivo_id: number
  modulo_id: number
  nombre: string
  tipo: TipoArchivo
  url_storage: string
  fecha_subida: string
}

export interface Pregunta {
  pregunta_id: number
  modulo_id: number
  enunciado: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: OpcionQuiz  // NUNCA exponer al cliente
}

// Versión sin respuesta_correcta — se usa en el quiz del lado del cliente
export type PreguntaPublica = Omit<Pregunta, 'respuesta_correcta'>

export interface Inscripcion {
  inscripcion_id: number
  usuario_id: string  // UUID
  modulo_id: number
  fecha_inscripcion: string
  completado: boolean
}

export interface Calificacion {
  calificacion_id: number
  usuario_id: string  // UUID
  modulo_id: number
  nota: number
  fecha: string
}

export interface CandidatoElite {
  elite_id: number
  usuario_id: string  // UUID
  promedio_final: number
}

// Tipos compuestos para queries con joins
export interface ModuloConArchivos extends Modulo {
  archivos: Archivo[]
}

export interface CandidatoConPerfil extends CandidatoElite {
  usuario: Usuario
  calificaciones: (Calificacion & { modulo: Pick<Modulo, 'modulo_id' | 'nombre_tema'> })[]
}
```

- [ ] **Step 2: Commit**

```bash
git add types/
git commit -m "feat: add TypeScript types for database schema"
```

---

## Task 5: Middleware de protección de rutas

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Escribir el middleware**

```typescript
// middleware.ts
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

  // Rutas que requieren auth
  const rutasEstudiante = ['/cursos', '/dashboard']
  const rutasReclutador = ['/reclutador']

  const requiereAuth =
    rutasEstudiante.some(r => pathname.startsWith(r)) ||
    rutasReclutador.some(r => pathname.startsWith(r))

  if (!user && requiereAuth) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user) {
    // Obtener rol del usuario
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
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add route protection middleware with role-based redirects"
```

---

## Task 6: DB Layer — Módulos, Archivos, Preguntas, Calificaciones, Candidatos

**Files:**
- Create: `lib/db/modulos.ts`
- Create: `lib/db/archivos.ts`
- Create: `lib/db/preguntas.ts`
- Create: `lib/db/calificaciones.ts`
- Create: `lib/db/candidatos.ts`

- [ ] **Step 1: `lib/db/modulos.ts`**

```typescript
// lib/db/modulos.ts
import { createClient } from '@/lib/supabase/server'
import type { Modulo, ModuloConArchivos } from '@/types/database'

export async function getModulos(): Promise<Modulo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .order('fecha_creacion', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getModuloById(id: number): Promise<ModuloConArchivos | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modulos')
    .select('*, archivos(*)')
    .eq('modulo_id', id)
    .single()

  if (error) return null
  return data as ModuloConArchivos
}

export async function getModulosByReclutador(reclutadorId: string): Promise<Modulo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .eq('reclutador_id', reclutadorId)
    .order('fecha_creacion', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createModulo(
  modulo: Pick<Modulo, 'nombre_tema' | 'descripcion' | 'area_ti' | 'reclutador_id'>
): Promise<Modulo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modulos')
    .insert(modulo)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

- [ ] **Step 2: `lib/db/archivos.ts`**

```typescript
// lib/db/archivos.ts
import { createClient } from '@/lib/supabase/server'
import type { Archivo, TipoArchivo } from '@/types/database'

export async function createArchivo(archivo: Omit<Archivo, 'archivo_id' | 'fecha_subida'>): Promise<Archivo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('archivos')
    .insert(archivo)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function uploadArchivoToStorage(
  file: File,
  moduloId: number
): Promise<string> {
  const supabase = await createClient()
  const extension = file.name.split('.').pop()
  const path = `modulo-${moduloId}/${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from('course-materials')
    .upload(path, file)

  if (error) throw new Error(error.message)

  const { data } = supabase.storage
    .from('course-materials')
    .getPublicUrl(path)

  return data.publicUrl
}

export function inferirTipoArchivo(file: File): TipoArchivo {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('video/')) return 'video'
  throw new Error('Tipo de archivo no soportado. Solo PDF o video.')
}
```

- [ ] **Step 3: `lib/db/preguntas.ts`**

```typescript
// lib/db/preguntas.ts
import { createClient } from '@/lib/supabase/server'
import type { Pregunta, PreguntaPublica } from '@/types/database'

// Solo para el reclutador (incluye respuesta_correcta)
export async function getPreguntasByModulo(moduloId: number): Promise<Pregunta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preguntas')
    .select('*')
    .eq('modulo_id', moduloId)

  if (error) throw new Error(error.message)
  return data ?? []
}

// Para el estudiante — SIN respuesta_correcta
export async function getPreguntasPublicasByModulo(moduloId: number): Promise<PreguntaPublica[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preguntas')
    .select('pregunta_id, modulo_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d')
    .eq('modulo_id', moduloId)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createPregunta(
  pregunta: Omit<Pregunta, 'pregunta_id'>
): Promise<Pregunta> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preguntas')
    .insert(pregunta)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deletePregunta(preguntaId: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('preguntas')
    .delete()
    .eq('pregunta_id', preguntaId)

  if (error) throw new Error(error.message)
}
```

- [ ] **Step 4: `lib/db/calificaciones.ts`**

```typescript
// lib/db/calificaciones.ts
import { createClient } from '@/lib/supabase/server'
import type { Calificacion } from '@/types/database'

export async function getCalificacionesByUsuario(usuarioId: string): Promise<
  (Calificacion & { modulos: { nombre_tema: string } })[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('calificaciones')
    .select('*, modulos(nombre_tema)')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as (Calificacion & { modulos: { nombre_tema: string } })[]
}

export async function getCalificacionesByUsuarioParaReclutador(
  usuarioId: string
): Promise<(Calificacion & { modulos: { nombre_tema: string } })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('calificaciones')
    .select('*, modulos(nombre_tema)')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as (Calificacion & { modulos: { nombre_tema: string } })[]
}

export async function insertCalificacion(
  usuarioId: string,
  moduloId: number,
  nota: number
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('calificaciones')
    .insert({ usuario_id: usuarioId, modulo_id: moduloId, nota })

  if (error) throw new Error(error.message)
}
```

- [ ] **Step 5: `lib/db/candidatos.ts`**

```typescript
// lib/db/candidatos.ts
import { createClient } from '@/lib/supabase/server'
import type { CandidatoConPerfil } from '@/types/database'

export async function getCandidatosElite(): Promise<CandidatoConPerfil[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('candidatos_elite')
    .select(`
      *,
      usuario:usuarios(usuario_id, nombre, correo, rol),
      calificaciones(*, modulo:modulos(modulo_id, nombre_tema))
    `)
    .order('promedio_final', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as CandidatoConPerfil[]
}

export async function getCandidatoById(usuarioId: string): Promise<CandidatoConPerfil | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('candidatos_elite')
    .select(`
      *,
      usuario:usuarios(usuario_id, nombre, correo, rol),
      calificaciones(*, modulo:modulos(modulo_id, nombre_tema))
    `)
    .eq('usuario_id', usuarioId)
    .single()

  if (error) return null
  return data as CandidatoConPerfil
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/db/
git commit -m "feat: add DB layer functions for all entities"
```

---

## Task 7: Componentes UI base

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Badge.tsx`

- [ ] **Step 1: `components/ui/Button.tsx`**

```typescript
// components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
}
```

- [ ] **Step 2: `components/ui/Card.tsx`**

```typescript
// components/ui/Card.tsx
import { HTMLAttributes } from 'react'

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: `components/ui/Input.tsx`**

```typescript
// components/ui/Input.tsx
import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 4: `components/ui/Badge.tsx`**

```typescript
// components/ui/Badge.tsx
interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'yellow' | 'gray'
}

export function Badge({ children, variant = 'blue' }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-700',
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/
git commit -m "feat: add base UI components (Button, Card, Input, Badge)"
```

---

## Task 8: Auth — Registro y Login

**Files:**
- Create: `app/(public)/auth/register/page.tsx`
- Create: `app/(public)/auth/login/page.tsx`
- Create: `app/(public)/layout.tsx`
- Create: `app/layout.tsx`

- [ ] **Step 1: Root layout**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NTT Academy',
  description: 'Capacitación en servicios TI — NTT',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Layout público (sin navbar)**

```typescript
// app/(public)/layout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 3: Página de registro**

```typescript
// app/(public)/auth/register/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Rol } from '@/types/database'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'estudiante' as Rol })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.correo,
      password: form.password,
      options: {
        data: { nombre: form.nombre, rol: form.rol },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push(form.rol === 'reclutador' ? '/reclutador/cursos' : '/cursos')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear cuenta</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="nombre"
            label="Nombre completo"
            value={form.nombre}
            onChange={handleChange('nombre')}
            required
          />
          <Input
            id="correo"
            label="Correo electrónico"
            type="email"
            value={form.correo}
            onChange={handleChange('correo')}
            required
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required
            minLength={6}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="rol" className="text-sm font-medium text-gray-700">
              Registrarse como
            </label>
            <select
              id="rol"
              value={form.rol}
              onChange={handleChange('rol')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="estudiante">Estudiante</option>
              <option value="reclutador">Reclutador</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading}>
            Crear cuenta
          </Button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          ¿Ya tenés cuenta?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Página de login**

```typescript
// app/(public)/auth/login/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ correo: '', password: '' })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.correo,
      password: form.password,
    })

    if (signInError) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // El middleware redirige según el rol
    router.refresh()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Iniciar sesión</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="correo"
            label="Correo electrónico"
            type="email"
            value={form.correo}
            onChange={handleChange('correo')}
            required
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading}>
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          ¿No tenés cuenta?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Probar auth en browser**

1. `npm run dev`
2. Ir a `http://localhost:3000/auth/register`
3. Crear un usuario `estudiante` con correo y password
4. Verificar en Supabase Dashboard → Authentication → Users que aparece el usuario
5. Verificar en Table Editor → `usuarios` que se creó la fila por el trigger

- [ ] **Step 6: Commit**

```bash
git add app/
git commit -m "feat: add auth pages (register with role selection, login)"
```

---

## Task 9: Landing Page

**Files:**
- Create: `app/(public)/page.tsx`

- [ ] **Step 1: Escribir la landing**

```typescript
// app/(public)/page.tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <span className="text-xl font-bold text-blue-700">NTT Academy</span>
        <div className="flex gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Capacitación IT de calidad, <br />
          <span className="text-blue-600">oportunidades reales</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mb-8">
          Aprendé redes, ciberseguridad, cloud y más desde cero.
          Los estudiantes con mejor desempeño ingresan directamente a NTT.
        </p>
        <Link
          href="/auth/register"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-lg"
        >
          Empezar ahora — es gratis
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-24 max-w-5xl mx-auto">
        {[
          { title: 'Cursos desde cero', desc: 'Contenido práctico en todas las áreas de servicios TI.' },
          { title: 'Evaluación automática', desc: 'Quizzes con corrección inmediata. Tu nota siempre actualizada.' },
          { title: 'Talento reconocido', desc: 'Promedio ≥ 4.5 → quedás visible para los reclutadores de NTT.' },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verificar en browser**

`http://localhost:3000` — debe mostrar la landing con navbar, hero y 3 features.

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/page.tsx
git commit -m "feat: add landing page"
```

---

## Task 10: Layout + Navbar para Estudiante y Reclutador

**Files:**
- Create: `components/ui/Navbar.tsx`
- Create: `app/(estudiante)/layout.tsx`
- Create: `app/(reclutador)/layout.tsx`

- [ ] **Step 1: `components/ui/Navbar.tsx`**

```typescript
// components/ui/Navbar.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Rol } from '@/types/database'

interface NavbarProps {
  rol: Rol
}

export function Navbar({ rol }: NavbarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const links = rol === 'estudiante'
    ? [
        { href: '/cursos', label: 'Cursos' },
        { href: '/dashboard', label: 'Mi progreso' },
      ]
    : [
        { href: '/reclutador/cursos', label: 'Mis cursos' },
        { href: '/reclutador/candidatos', label: 'Candidatos Elite' },
      ]

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-blue-700">NTT Academy</span>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-red-600"
      >
        Cerrar sesión
      </button>
    </nav>
  )
}
```

- [ ] **Step 2: `app/(estudiante)/layout.tsx`**

```typescript
// app/(estudiante)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'

export default async function EstudianteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <>
      <Navbar rol="estudiante" />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  )
}
```

- [ ] **Step 3: `app/(reclutador)/layout.tsx`**

```typescript
// app/(reclutador)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'

export default async function ReclutadorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <>
      <Navbar rol="reclutador" />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/Navbar.tsx app/\(estudiante\)/layout.tsx app/\(reclutador\)/layout.tsx
git commit -m "feat: add shared Navbar and authenticated layouts"
```

---

## Task 11: Catálogo de Cursos (Estudiante)

**Files:**
- Create: `components/cursos/CourseCard.tsx`
- Create: `app/(estudiante)/cursos/page.tsx`

- [ ] **Step 1: `components/cursos/CourseCard.tsx`**

```typescript
// components/cursos/CourseCard.tsx
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
        <Badge variant="blue" >{modulo.area_ti}</Badge>
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
```

- [ ] **Step 2: `app/(estudiante)/cursos/page.tsx`**

```typescript
// app/(estudiante)/cursos/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getModulos } from '@/lib/db/modulos'
import { CourseCard } from '@/components/cursos/CourseCard'

export default async function CursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [modulos, inscripcionesRes] = await Promise.all([
    getModulos(),
    supabase
      .from('inscripciones')
      .select('modulo_id')
      .eq('usuario_id', user!.id),
  ])

  const modulosInscritos = new Set(
    (inscripcionesRes.data ?? []).map(i => i.modulo_id)
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cursos disponibles</h1>

      {modulos.length === 0 ? (
        <p className="text-gray-500">Aún no hay cursos disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map(modulo => (
            <CourseCard
              key={modulo.modulo_id}
              modulo={modulo}
              inscrito={modulosInscritos.has(modulo.modulo_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar en browser**

Loguearse como estudiante → ir a `http://localhost:3000/cursos` → debe mostrar la grilla de cursos.

- [ ] **Step 4: Commit**

```bash
git add components/cursos/CourseCard.tsx app/\(estudiante\)/cursos/page.tsx
git commit -m "feat: add course catalog for students"
```

---

## Task 12: Detalle del Curso + Inscripción (Estudiante)

**Files:**
- Create: `components/cursos/MaterialViewer.tsx`
- Create: `app/(estudiante)/cursos/[id]/page.tsx`

- [ ] **Step 1: `components/cursos/MaterialViewer.tsx`**

```typescript
// components/cursos/MaterialViewer.tsx
import type { Archivo } from '@/types/database'

interface MaterialViewerProps {
  archivos: Archivo[]
}

export function MaterialViewer({ archivos }: MaterialViewerProps) {
  if (archivos.length === 0) {
    return <p className="text-gray-500 text-sm">Este curso aún no tiene materiales.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {archivos.map(archivo => (
        <li key={archivo.archivo_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-2xl">{archivo.tipo === 'pdf' ? '📄' : '🎥'}</span>
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
```

- [ ] **Step 2: `app/(estudiante)/cursos/[id]/page.tsx`**

```typescript
// app/(estudiante)/cursos/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getModuloById } from '@/lib/db/modulos'
import { MaterialViewer } from '@/components/cursos/MaterialViewer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

async function inscribirse(moduloId: number, usuarioId: string) {
  'use server'
  const supabase = await createClient()
  await supabase
    .from('inscripciones')
    .upsert({ usuario_id: usuarioId, modulo_id: moduloId }, { onConflict: 'usuario_id,modulo_id' })
  redirect(`/cursos/${moduloId}`)
}

export default async function CursoDetailPage({ params }: PageProps) {
  const { id } = await params
  const moduloId = parseInt(id)

  if (isNaN(moduloId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [modulo, inscripcionRes, calificacionRes] = await Promise.all([
    getModuloById(moduloId),
    supabase
      .from('inscripciones')
      .select('completado')
      .eq('usuario_id', user!.id)
      .eq('modulo_id', moduloId)
      .maybeSingle(),
    supabase
      .from('calificaciones')
      .select('nota')
      .eq('usuario_id', user!.id)
      .eq('modulo_id', moduloId)
      .maybeSingle(),
  ])

  if (!modulo) notFound()

  const inscrito = !!inscripcionRes.data
  const nota = calificacionRes.data?.nota

  const inscribirseAction = inscribirse.bind(null, moduloId, user!.id)

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{modulo.nombre_tema}</h1>
        {modulo.area_ti && <Badge variant="blue">{modulo.area_ti}</Badge>}
      </div>

      {modulo.descripcion && (
        <p className="text-gray-600 mb-6">{modulo.descripcion}</p>
      )}

      {nota !== undefined && nota !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            Tu nota en este curso: <span className="text-xl">{nota.toFixed(2)}</span> / 5.00
          </p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Materiales del curso</h2>
        <MaterialViewer archivos={modulo.archivos} />
      </section>

      <div className="flex gap-3">
        {!inscrito ? (
          <form action={inscribirseAction}>
            <Button type="submit">Inscribirse al curso</Button>
          </form>
        ) : nota === null || nota === undefined ? (
          <Link href={`/cursos/${moduloId}/quiz`}>
            <Button>Tomar el quiz</Button>
          </Link>
        ) : (
          <Badge variant="green">Quiz completado</Badge>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Probar en browser**

Ir a `/cursos/[id]` → debe mostrar título, materiales, y botón de inscripción.

- [ ] **Step 4: Commit**

```bash
git add components/cursos/MaterialViewer.tsx app/\(estudiante\)/cursos/
git commit -m "feat: add course detail page with enrollment and materials"
```

---

## Task 13: Quiz del Curso (Estudiante)

> ⚠️ La `respuesta_correcta` se obtiene **solo en Server Action** — nunca se envía al cliente.

**Files:**
- Create: `components/quiz/QuizForm.tsx`
- Create: `components/quiz/QuizResult.tsx`
- Create: `app/(estudiante)/cursos/[id]/quiz/page.tsx`

- [ ] **Step 1: `components/quiz/QuizResult.tsx`**

```typescript
// components/quiz/QuizResult.tsx
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
            🏆 ¡Excelencia! Tu promedio te posiciona como candidato elite.
          </p>
        </div>
      )}
      <Badge variant={nota >= 3 ? 'green' : 'gray'}>
        {nota >= 4.5 ? 'Excelente' : nota >= 3 ? 'Aprobado' : 'Reprobado'}
      </Badge>
      <div className="mt-6">
        <Link href={`/cursos/${moduloId}`} className="text-blue-600 hover:underline text-sm">
          ← Volver al curso
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `components/quiz/QuizForm.tsx`**

```typescript
// components/quiz/QuizForm.tsx
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
      setError('Debés responder todas las preguntas antes de enviar.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await submitQuiz(respuestas)
      setResultado(res)
    } catch (e) {
      setError('Error al enviar el quiz. Intentá de nuevo.')
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
```

- [ ] **Step 3: `app/(estudiante)/cursos/[id]/quiz/page.tsx`**

```typescript
// app/(estudiante)/cursos/[id]/quiz/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getPreguntasPublicasByModulo, getPreguntasByModulo } from '@/lib/db/preguntas'
import { insertCalificacion } from '@/lib/db/calificaciones'
import { QuizForm } from '@/components/quiz/QuizForm'
import { notFound, redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuizPage({ params }: PageProps) {
  const { id } = await params
  const moduloId = parseInt(id)

  if (isNaN(moduloId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar que el estudiante está inscripto
  const { data: inscripcion } = await supabase
    .from('inscripciones')
    .select('inscripcion_id, completado')
    .eq('usuario_id', user!.id)
    .eq('modulo_id', moduloId)
    .maybeSingle()

  if (!inscripcion) {
    redirect(`/cursos/${moduloId}`)
  }

  // Verificar que no haya completado el quiz ya
  const { data: calificacionExistente } = await supabase
    .from('calificaciones')
    .select('nota')
    .eq('usuario_id', user!.id)
    .eq('modulo_id', moduloId)
    .maybeSingle()

  if (calificacionExistente) {
    redirect(`/cursos/${moduloId}`)
  }

  const preguntas = await getPreguntasPublicasByModulo(moduloId)

  if (preguntas.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Quiz del curso</h1>
        <p className="text-gray-500">Este curso aún no tiene preguntas. Volvé más tarde.</p>
      </div>
    )
  }

  // Server Action: corrige el quiz server-side (nunca expone respuesta_correcta al cliente)
  async function submitQuiz(respuestas: Record<number, string>): Promise<{ nota: number; correctas: number }> {
    'use server'

    const preguntasConRespuesta = await getPreguntasByModulo(moduloId)
    let correctas = 0

    for (const pregunta of preguntasConRespuesta) {
      if (respuestas[pregunta.pregunta_id] === pregunta.respuesta_correcta) {
        correctas++
      }
    }

    const nota = parseFloat(((correctas / preguntasConRespuesta.length) * 5).toFixed(2))

    await insertCalificacion(user!.id, moduloId, nota)

    // Marcar inscripción como completada
    const supabase = await createClient()
    await supabase
      .from('inscripciones')
      .update({ completado: true })
      .eq('usuario_id', user!.id)
      .eq('modulo_id', moduloId)

    return { nota, correctas }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz del curso</h1>
      <p className="text-gray-500 mb-6">{preguntas.length} preguntas — respondé todas antes de enviar.</p>
      <QuizForm
        preguntas={preguntas}
        moduloId={moduloId}
        submitQuiz={submitQuiz}
      />
    </div>
  )
}
```

- [ ] **Step 4: Probar el flujo completo**

1. Loguearse como estudiante
2. Ir a un curso → inscribirse
3. Ir al quiz → responder todas las preguntas → enviar
4. Verificar en Supabase → Table Editor → `calificaciones` que se insertó la nota
5. Verificar en `candidatos_elite` si la nota fue ≥ 4.5

- [ ] **Step 5: Commit**

```bash
git add components/quiz/ app/\(estudiante\)/cursos/\[id\]/quiz/
git commit -m "feat: add quiz flow with server-side scoring and auto-trigger for elite candidates"
```

---

## Task 14: Dashboard del Estudiante

**Files:**
- Create: `app/(estudiante)/dashboard/page.tsx`

- [ ] **Step 1: Escribir el dashboard**

```typescript
// app/(estudiante)/dashboard/page.tsx
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

      {/* Stats cards */}
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
              <Badge variant="yellow">Candidato Elite 🏆</Badge>
              <p className="text-xs text-gray-500 mt-2">Visible para reclutadores NTT</p>
            </>
          ) : (
            <>
              <Badge variant="gray">Estudiante regular</Badge>
              <p className="text-xs text-gray-500 mt-2">Promedio ≥ 4.5 para ser elite</p>
            </>
          )}
        </Card>
      </div>

      {/* Historial de notas */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Historial de calificaciones</h2>
      {calificaciones.length === 0 ? (
        <p className="text-gray-500 text-sm">Aún no completaste ningún quiz.</p>
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
```

- [ ] **Step 2: Verificar en browser**

Loguearse como estudiante → `http://localhost:3000/dashboard` → ver promedio, estado elite, historial de notas.

- [ ] **Step 3: Commit**

```bash
git add app/\(estudiante\)/dashboard/
git commit -m "feat: add student dashboard with grades history and elite status"
```

---

## Task 15: Mis Cursos (Reclutador)

**Files:**
- Create: `app/(reclutador)/reclutador/cursos/page.tsx`

- [ ] **Step 1: Escribir la página**

```typescript
// app/(reclutador)/reclutador/cursos/page.tsx
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
          <p className="text-gray-500 mb-4">Aún no creaste ningún curso.</p>
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
```

- [ ] **Step 2: Commit**

```bash
git add app/\(reclutador\)/reclutador/cursos/page.tsx
git commit -m "feat: add recruiter course list page"
```

---

## Task 16: Crear Curso + Subir Archivos (Reclutador)

**Files:**
- Create: `app/(reclutador)/reclutador/cursos/nuevo/page.tsx`

- [ ] **Step 1: Escribir la página de creación de curso**

```typescript
// app/(reclutador)/reclutador/cursos/nuevo/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const AREAS_TI = ['Redes', 'Ciberseguridad', 'Cloud', 'Bases de datos', 'Programación', 'Soporte TI', 'DevOps', 'Data Analytics']

export default function NuevoCursoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre_tema: '', descripcion: '', area_ti: '' })
  const [archivos, setArchivos] = useState<File[]>([])

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const invalidos = files.filter(f => !f.type.startsWith('video/') && f.type !== 'application/pdf')
    if (invalidos.length > 0) {
      setError('Solo se permiten archivos PDF o video.')
      return
    }
    setError(null)
    setArchivos(files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre_tema.trim()) {
      setError('El nombre del curso es obligatorio.')
      return
    }
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Crear el módulo
    const { data: modulo, error: moduloError } = await supabase
      .from('modulos')
      .insert({
        nombre_tema: form.nombre_tema,
        descripcion: form.descripcion || null,
        area_ti: form.area_ti || null,
        reclutador_id: user!.id,
      })
      .select()
      .single()

    if (moduloError || !modulo) {
      setError('Error al crear el curso.')
      setLoading(false)
      return
    }

    // 2. Subir cada archivo a Supabase Storage + registrar en DB
    for (const file of archivos) {
      const extension = file.name.split('.').pop()
      const path = `modulo-${modulo.modulo_id}/${Date.now()}-${file.name}`
      const tipo = file.type === 'application/pdf' ? 'pdf' : 'video'

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(path, file)

      if (uploadError) {
        setError(`Error subiendo ${file.name}`)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(path)

      await supabase.from('archivos').insert({
        modulo_id: modulo.modulo_id,
        nombre: file.name,
        tipo,
        url_storage: urlData.publicUrl,
      })
    }

    router.push(`/reclutador/cursos/${modulo.modulo_id}/preguntas`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear nuevo curso</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          id="nombre_tema"
          label="Nombre del curso"
          value={form.nombre_tema}
          onChange={handleChange('nombre_tema')}
          placeholder="Ej: Introducción a Ciberseguridad"
          required
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="descripcion"
            value={form.descripcion}
            onChange={handleChange('descripcion')}
            rows={3}
            placeholder="¿Qué aprenderán los estudiantes?"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="area_ti" className="text-sm font-medium text-gray-700">
            Área TI
          </label>
          <select
            id="area_ti"
            value={form.area_ti}
            onChange={handleChange('area_ti')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar área...</option>
            {AREAS_TI.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Materiales del curso (PDF o video)
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,video/*"
            onChange={handleFileChange}
            className="text-sm text-gray-600"
          />
          {archivos.length > 0 && (
            <ul className="text-sm text-gray-500">
              {archivos.map(f => <li key={f.name}>• {f.name}</li>)}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" loading={loading}>
          Crear curso y configurar quiz →
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Probar en browser**

Loguearse como reclutador → `/reclutador/cursos/nuevo` → crear un curso con un PDF → verificar en Supabase Storage y en tabla `modulos`.

- [ ] **Step 3: Commit**

```bash
git add app/\(reclutador\)/reclutador/cursos/nuevo/
git commit -m "feat: add create course page with file upload to Supabase Storage"
```

---

## Task 17: Gestionar Quiz del Curso (Reclutador)

**Files:**
- Create: `app/(reclutador)/reclutador/cursos/[id]/preguntas/page.tsx`

- [ ] **Step 1: Escribir la página de gestión de preguntas**

```typescript
// app/(reclutador)/reclutador/cursos/[id]/preguntas/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getPreguntasByModulo } from '@/lib/db/preguntas'
import { getModuloById } from '@/lib/db/modulos'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { notFound, redirect } from 'next/navigation'
import { PreguntasManager } from './PreguntasManager'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PreguntasPage({ params }: PageProps) {
  const { id } = await params
  const moduloId = parseInt(id)

  if (isNaN(moduloId)) notFound()

  const [modulo, preguntas] = await Promise.all([
    getModuloById(moduloId),
    getPreguntasByModulo(moduloId),
  ])

  if (!modulo) notFound()

  async function addPregunta(formData: FormData) {
    'use server'
    const supabase = await createClient()
    await supabase.from('preguntas').insert({
      modulo_id: moduloId,
      enunciado: formData.get('enunciado') as string,
      opcion_a: formData.get('opcion_a') as string,
      opcion_b: formData.get('opcion_b') as string,
      opcion_c: formData.get('opcion_c') as string,
      opcion_d: formData.get('opcion_d') as string,
      respuesta_correcta: formData.get('respuesta_correcta') as string,
    })
    redirect(`/reclutador/cursos/${moduloId}/preguntas`)
  }

  async function deletePregunta(preguntaId: number) {
    'use server'
    const supabase = await createClient()
    await supabase.from('preguntas').delete().eq('pregunta_id', preguntaId)
    redirect(`/reclutador/cursos/${moduloId}/preguntas`)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{modulo.nombre_tema}</h1>
        {modulo.area_ti && <Badge variant="blue">{modulo.area_ti}</Badge>}
      </div>
      <p className="text-gray-500 mb-6">{preguntas.length} pregunta(s) en el quiz</p>

      <PreguntasManager
        preguntas={preguntas}
        addPregunta={addPregunta}
        deletePregunta={deletePregunta}
      />
    </div>
  )
}
```

- [ ] **Step 2: Crear el client component para el formulario**

```typescript
// app/(reclutador)/reclutador/cursos/[id]/preguntas/PreguntasManager.tsx
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
      {/* Lista de preguntas existentes */}
      {preguntas.length > 0 && (
        <div className="flex flex-col gap-3">
          {preguntas.map((p, i) => (
            <Card key={p.pregunta_id} className="relative">
              <p className="font-medium text-gray-900 mb-2">{i + 1}. {p.enunciado}</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-2">
                {OPCIONES.map(op => (
                  <li key={op} className={p.respuesta_correcta === op ? 'text-green-700 font-semibold' : ''}>
                    {op.toUpperCase()}. {p[`opcion_${op}` as keyof Pregunta] as string}
                    {p.respuesta_correcta === op && ' ✓'}
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

      {/* Botón para mostrar/ocultar form */}
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
                placeholder={`Opción ${op.toUpperCase()}`}
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
                  <option key={op} value={op}>Opción {op.toUpperCase()}</option>
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
```

- [ ] **Step 3: Probar en browser**

Ir a `/reclutador/cursos/[id]/preguntas` → agregar 5 preguntas → verificar en tabla `preguntas` de Supabase.

- [ ] **Step 4: Commit**

```bash
git add app/\(reclutador\)/reclutador/cursos/
git commit -m "feat: add quiz management page for recruiters"
```

---

## Task 18: Lista de Candidatos Elite (Reclutador)

**Files:**
- Create: `app/(reclutador)/reclutador/candidatos/page.tsx`

- [ ] **Step 1: Escribir la página**

```typescript
// app/(reclutador)/reclutador/candidatos/page.tsx
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
        Estudiantes con promedio ≥ 4.5 — listos para ser contactados.
      </p>

      {candidatos.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Aún no hay candidatos elite.</p>
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
                  Ver perfil →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(reclutador\)/reclutador/candidatos/page.tsx
git commit -m "feat: add elite candidates list for recruiters"
```

---

## Task 19: Perfil del Candidato (Reclutador)

**Files:**
- Create: `app/(reclutador)/reclutador/candidatos/[id]/page.tsx`

- [ ] **Step 1: Escribir la página**

```typescript
// app/(reclutador)/reclutador/candidatos/[id]/page.tsx
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
        ← Volver a candidatos
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
            <Badge variant="yellow">Candidato Elite 🏆</Badge>
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
```

- [ ] **Step 2: Commit**

```bash
git add app/\(reclutador\)/reclutador/candidatos/\[id\]/
git commit -m "feat: add candidate profile page for recruiters"
```

---

## Task 20: Demo Final — Verificación End-to-End

- [ ] **Step 1: Registrar un reclutador**

Ir a `http://localhost:3000/auth/register` → crear cuenta con rol `reclutador`.

- [ ] **Step 2: Crear un curso con archivos y preguntas**

1. Ir a `/reclutador/cursos/nuevo` → crear un curso "Introducción a Redes" con área "Redes" y subir un PDF
2. Verificar en Supabase → tabla `modulos` y Storage → bucket `course-materials`
3. Ir a `/reclutador/cursos/[id]/preguntas` → agregar 5 preguntas con opciones y respuestas correctas

- [ ] **Step 3: Registrar un estudiante**

Ir a `http://localhost:3000/auth/register` → crear cuenta con rol `estudiante`.

- [ ] **Step 4: Inscribirse y tomar el quiz**

1. Ir a `/cursos` → ver el curso de redes → hacer clic en "Ver curso"
2. Hacer clic en "Inscribirse" → verificar en tabla `inscripciones`
3. Hacer clic en "Tomar el quiz" → responder todas las preguntas respondiendo correctamente ≥ 90%
4. Enviar → verificar que muestra la nota

- [ ] **Step 5: Verificar el trigger automático**

En Supabase → SQL Editor → ejecutar:
```sql
SELECT u.nombre, c.nota, ce.promedio_final
FROM calificaciones c
JOIN usuarios u ON u.usuario_id = c.usuario_id
LEFT JOIN candidatos_elite ce ON ce.usuario_id = c.usuario_id;
```
Si la nota fue ≥ 4.5, debe aparecer una fila en `candidatos_elite`.

- [ ] **Step 6: Verificar como reclutador**

1. Cerrar sesión → loguearse como reclutador
2. Ir a `/reclutador/candidatos` → debe aparecer el estudiante si fue elite
3. Hacer clic en "Ver perfil" → ver nombre, correo y notas del candidato
4. Verificar que el botón "Contactar por email" abre el cliente de correo

- [ ] **Step 7: Commit final**

```bash
git add .
git commit -m "chore: complete NTT Academy MVP"
```

---

## Resumen de Tareas

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Scaffold Next.js | ⬜ |
| 2 | Clientes Supabase | ⬜ |
| 3 | Schema PostgreSQL | ⬜ |
| 4 | Tipos TypeScript | ⬜ |
| 5 | Middleware protección de rutas | ⬜ |
| 6 | DB Layer (modulos, archivos, preguntas, calificaciones, candidatos) | ⬜ |
| 7 | Componentes UI base | ⬜ |
| 8 | Auth: Register + Login | ⬜ |
| 9 | Landing page | ⬜ |
| 10 | Layouts + Navbar | ⬜ |
| 11 | Catálogo de cursos (Estudiante) | ⬜ |
| 12 | Detalle del curso + inscripción | ⬜ |
| 13 | Quiz del curso | ⬜ |
| 14 | Dashboard del estudiante | ⬜ |
| 15 | Mis cursos (Reclutador) | ⬜ |
| 16 | Crear curso + subir archivos | ⬜ |
| 17 | Gestionar quiz del curso | ⬜ |
| 18 | Lista candidatos elite | ⬜ |
| 19 | Perfil del candidato | ⬜ |
| 20 | Demo final end-to-end | ⬜ |
