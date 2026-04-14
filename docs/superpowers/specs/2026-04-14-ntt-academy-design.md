# NTT Academy — Diseño del Proyecto

## Contexto

NTT Academy es una plataforma web creada por NTT (empresa de servicios TI) para capacitar personas del común en diversas áreas de tecnología. El modelo es simple y poderoso: los estudiantes toman cursos gratuitos en IT, son evaluados automáticamente, y los mejores (promedio ≥ 4.5) pasan a una lista de candidatos elite visible para los reclutadores de NTT — quienes pueden contactarlos directamente.

**Proyecto universitario CUN** — entregable requerido: código funcional.

---

## Idea Central

```
Estudiante → toma cursos → completa quizzes → nota automática
                                                     ↓
                                         promedio ≥ 4.5?
                                                     ↓ sí
                                         Candidatos Elite ← Reclutador los ve y contacta
```

---

## Roles y Capacidades

### Estudiante
- Registrarse / iniciar sesión
- Ver catálogo de cursos disponibles
- Ingresar a un curso: ver descripción + materiales (PDF / video)
- Tomar el quiz de opción múltiple (auto-corregido)
- Ver su historial de notas y progreso personal

### Reclutador
- Registrarse / iniciar sesión
- Crear cursos: título, descripción, área TI, subir archivos (PDF/video)
- Crear preguntas de opción múltiple para el quiz del curso
- Ver lista de Candidatos Elite (promedio ≥ 4.5)
- Ver perfil completo de un candidato: datos, módulos cursados, notas
- Ver el correo del candidato para contactarlo externamente

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend + Backend | Next.js 14+ (App Router, Server Actions) |
| Auth | Supabase Auth (email/password) |
| Base de datos | Supabase PostgreSQL |
| Storage | Supabase Storage (S3-compatible) |
| Estilos | Tailwind CSS |
| Lenguaje | TypeScript |

---

## Estructura de la Base de Datos

### Tablas existentes (`db.sql`)
- `Usuarios` — usuario_id, nombre, correo, rol ENUM('estudiante', 'reclutador')
- `Modulos` — modulo_id, nombre_tema
- `Calificaciones` — calificacion_id, usuario_id, modulo_id, nota DECIMAL(3,2)
- `Candidatos_Elite` — elite_id, usuario_id, promedio_final
- **Trigger** `AutomatizarSeleccion` — al insertar calificación, si promedio ≥ 4.5 → upsert en Candidatos_Elite ✅

### Tablas / columnas a agregar
```sql
-- Ampliar Modulos con más info del curso
ALTER TABLE Modulos ADD COLUMN descripcion TEXT;
ALTER TABLE Modulos ADD COLUMN area_ti VARCHAR(100);
ALTER TABLE Modulos ADD COLUMN reclutador_id INT REFERENCES Usuarios(usuario_id);
ALTER TABLE Modulos ADD COLUMN fecha_creacion TIMESTAMP DEFAULT NOW();

-- Archivos del curso (videos, PDFs)
CREATE TABLE Archivos (
    archivo_id INT AUTO_INCREMENT PRIMARY KEY,
    modulo_id INT REFERENCES Modulos(modulo_id),
    nombre VARCHAR(200) NOT NULL,
    tipo ENUM('pdf', 'video') NOT NULL,
    url_storage VARCHAR(500) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT NOW()
);

-- Preguntas del quiz (opción múltiple)
CREATE TABLE Preguntas (
    pregunta_id INT AUTO_INCREMENT PRIMARY KEY,
    modulo_id INT REFERENCES Modulos(modulo_id),
    enunciado TEXT NOT NULL,
    opcion_a VARCHAR(300) NOT NULL,
    opcion_b VARCHAR(300) NOT NULL,
    opcion_c VARCHAR(300) NOT NULL,
    opcion_d VARCHAR(300) NOT NULL,
    respuesta_correcta ENUM('a', 'b', 'c', 'd') NOT NULL
);

-- Inscripciones (relación estudiante ↔ curso)
CREATE TABLE Inscripciones (
    inscripcion_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT REFERENCES Usuarios(usuario_id),
    modulo_id INT REFERENCES Modulos(modulo_id),
    fecha_inscripcion TIMESTAMP DEFAULT NOW(),
    completado BOOLEAN DEFAULT FALSE,
    UNIQUE(usuario_id, modulo_id)
);
```

---

## Rutas de la Aplicación

### Públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page — descripción de NTT Academy, CTA para registrarse |
| `/auth/login` | Login |
| `/auth/register` | Registro (elige rol: estudiante o reclutador) |

### Estudiante (requiere auth + rol `estudiante`)
| Ruta | Descripción |
|------|-------------|
| `/cursos` | Catálogo de todos los cursos disponibles |
| `/cursos/[id]` | Detalle del curso: descripción, materiales, botón "inscribirse" |
| `/cursos/[id]/quiz` | Quiz de opción múltiple — se corrige al enviar, genera nota |
| `/dashboard` | Mi progreso: cursos inscritos, notas, promedio actual |

### Reclutador (requiere auth + rol `reclutador`)
| Ruta | Descripción |
|------|-------------|
| `/reclutador/cursos` | Lista de mis cursos creados |
| `/reclutador/cursos/nuevo` | Formulario: crear curso + subir archivos |
| `/reclutador/cursos/[id]/preguntas` | Administrar preguntas del quiz |
| `/reclutador/candidatos` | Lista de Candidatos Elite (promedio ≥ 4.5) |
| `/reclutador/candidatos/[id]` | Perfil completo del candidato + correo de contacto |

---

## Flujos Clave

### Flujo estudiante (happy path)
1. Se registra como `estudiante`
2. Ve el catálogo de cursos en `/cursos`
3. Ingresa a un curso — ve descripción + descarga/visualiza materiales
4. Hace el quiz → se corrige automáticamente → nota insertada en `Calificaciones`
5. El trigger `AutomatizarSeleccion` calcula promedio → si ≥ 4.5 → aparece en `Candidatos_Elite`
6. Ve su progreso en `/dashboard`

### Flujo reclutador (happy path)
1. Se registra como `reclutador`
2. Crea un curso con descripción + sube archivos a Supabase Storage
3. Agrega preguntas de opción múltiple al quiz del curso
4. Entra a `/reclutador/candidatos` — ve lista de elite
5. Hace clic en un candidato — ve perfil, notas y correo — contacta externamente

---

## Arquitectura Next.js

```
/app
  /(public)
    page.tsx                          -- Landing
    /auth/login/page.tsx
    /auth/register/page.tsx
  /(estudiante)
    /cursos/page.tsx
    /cursos/[id]/page.tsx
    /cursos/[id]/quiz/page.tsx
    /dashboard/page.tsx
  /(reclutador)
    /reclutador/cursos/page.tsx
    /reclutador/cursos/nuevo/page.tsx
    /reclutador/cursos/[id]/preguntas/page.tsx
    /reclutador/candidatos/page.tsx
    /reclutador/candidatos/[id]/page.tsx
/lib
  /supabase/
    client.ts                         -- Supabase browser client
    server.ts                         -- Supabase server client
  /db/
    usuarios.ts
    modulos.ts
    calificaciones.ts
    candidatos.ts
/components
  /ui/                                -- botones, cards, inputs reutilizables
  /cursos/                            -- CourseCard, CourseList, MaterialViewer
  /quiz/                              -- QuizForm, QuizResult
```

---

## Scope Fuera del MVP

- ❌ Chat o mensajería interna
- ❌ Notificaciones push o emails automáticos
- ❌ Panel de admin
- ❌ Pagos o suscripciones
- ❌ Certificados automáticos
- ❌ Progreso por lecciones dentro de un módulo
- ❌ Búsqueda avanzada / filtros complejos

---

## Verificación / Demo

1. Registrar reclutador → crear curso con archivo + 5 preguntas
2. Registrar estudiante → inscribirse → ver materiales → tomar quiz
3. Verificar nota en `Calificaciones`
4. Si nota ≥ 4.5 → verificar trigger insertó en `Candidatos_Elite`
5. Loguearse como reclutador → ver candidato en lista elite
6. Ver perfil del candidato con todas sus notas
