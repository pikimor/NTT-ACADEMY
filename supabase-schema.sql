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

-- 2. Trigger: cuando Supabase Auth crea un usuario -> insertar en usuarios
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

-- 3. Modulos (cursos)
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
  inscripcion_id    SERIAL PRIMARY KEY,
  usuario_id        UUID REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE,
  modulo_id         INTEGER REFERENCES public.modulos(modulo_id) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMPTZ DEFAULT NOW(),
  completado        BOOLEAN DEFAULT FALSE,
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
ALTER TABLE public.usuarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos_elite ENABLE ROW LEVEL SECURITY;

-- 11. Politicas RLS

-- Usuarios: todos los autenticados pueden leer (para perfil de candidatos)
CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (true);

CREATE POLICY "usuarios_update_own" ON public.usuarios
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Modulos: lectura publica; escritura solo reclutador dueno
CREATE POLICY "modulos_select" ON public.modulos
  FOR SELECT USING (true);

CREATE POLICY "modulos_insert" ON public.modulos
  FOR INSERT WITH CHECK (auth.uid() = reclutador_id);

CREATE POLICY "modulos_update" ON public.modulos
  FOR UPDATE USING (auth.uid() = reclutador_id);

-- Archivos: lectura publica; escritura solo reclutador dueno del modulo
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

-- Preguntas: lectura publica (respuesta_correcta se filtra en codigo); insert/delete solo reclutador
CREATE POLICY "preguntas_select" ON public.preguntas
  FOR SELECT USING (true);

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

-- Calificaciones: estudiante ve las suyas; reclutador ve todas
CREATE POLICY "calificaciones_select_own" ON public.calificaciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "calificaciones_insert_own" ON public.calificaciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "calificaciones_select_reclutador" ON public.calificaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuario_id = auth.uid() AND rol = 'reclutador'
    )
  );

-- Candidatos Elite: solo reclutadores pueden leer
CREATE POLICY "candidatos_elite_select" ON public.candidatos_elite
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuario_id = auth.uid() AND rol = 'reclutador'
    )
  );

-- El trigger automatizar_seleccion inserta en candidatos_elite como SECURITY DEFINER
-- No requiere policy INSERT en candidatos_elite
