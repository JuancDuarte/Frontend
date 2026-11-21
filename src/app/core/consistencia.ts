/**
 * Ayudas para las respuestas de consistencia del backend.
 *
 * /detalle (B4) puede llegar parcial: "inscripciones" es "NO_DISPONIBLE" si el módulo
 * Inscripciones falló, y "curso" o "docente" pueden venir en null.
 */
export function inscripcionesDe(d: any): any[] {
  return Array.isArray(d?.inscripciones) ? d.inscripciones : [];
}

export function esParcial(d: any): boolean {
  return !!d?.parcial;
}

/** Cupos que quedan (Materias ahora devuelve cuposDisponibles; se cae a cupo si no viene). */
export function cuposDe(c: any): number {
  return c?.cuposDisponibles ?? c?.cupo ?? 0;
}

export function inscribible(c: any): boolean {
  return c?.estado !== 'INACTIVO' && cuposDe(c) > 0;
}

/** Una clave por intento de inscripción (A2: Idempotency-Key). */
export function nuevaClave(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Mensaje legible para un error de inscripción. Inscripciones responde
 * {status, codigo, mensaje}; el Gateway responde {error: {code, message}}.
 */
export function mensajeInscripcion(e: any): string {
  const cuerpo = e?.error;
  const codigo: string | undefined = cuerpo?.codigo ?? cuerpo?.error?.code;
  const texto: string | undefined = cuerpo?.mensaje ?? cuerpo?.error?.message ?? cuerpo?.message;
  switch (codigo) {
    case 'SIN_CUPO': return 'El curso ya no tiene cupos disponibles';
    case 'YA_INSCRITO': return 'Ya estás inscrito en este curso';
    case 'CURSO_INACTIVO': return 'El curso fue cerrado (INACTIVO)';
    case 'CURSO_NO_EXISTE': return 'El curso ya no existe';
    case 'ESTUDIANTE_INACTIVO': return 'El estudiante está INACTIVO';
    case 'ESTUDIANTE_NO_EXISTE': return 'El estudiante no existe';
  }
  if (e?.status === 503) return texto ?? 'Un módulo no está disponible, intenta en unos minutos';
  if (e?.status === 0) return 'Sin conexión con el servidor';
  return texto ?? 'No se pudo inscribir';
}
