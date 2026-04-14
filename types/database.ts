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

// Version sin respuesta_correcta — se usa en el quiz del lado del cliente
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
