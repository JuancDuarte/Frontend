import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

const B = environment.gatewayUrl;

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  detalle(id: number) { return this.http.get<any>(`${B}/api/estudiantes/${id}/detalle`); }
  /** Ficha básica del estudiante (incluye nombre, apellidos y programa). */
  estudiante(id: number) { return this.http.get<any>(`${B}/api/estudiantes/${id}`); }
  materias(programaCodigo?: string) {
    const params: any = { pageNumber: 0, pageSize: 400, sortBy: 'semestre', sortDirection: 'asc' };
    if (programaCodigo) params.programaCodigo = programaCodigo;
    return this.http.get<any>(`${B}/api/materias`, { params })
      .pipe(map(r => (r.content ?? r) as any[]));
  }
  cursos(materiaId: number, periodo?: string) {
    const params: any = { pageNumber: 0, pageSize: 100, materiaId };
    if (periodo) params.periodo = periodo;
    return this.http.get<any>(`${B}/api/materias/cursos`, { params }).pipe(map(r => (r.content ?? r) as any[]));
  }
  /** Oferta de un periodo, opcionalmente limitada al programa del estudiante. */
  cursosPeriodo(periodo?: string, programaCodigo?: string) {
    // Sin periodo se necesitan todos los cursos para descubrir el periodo más reciente.
    const params: any = { pageNumber: 0, pageSize: periodo ? 500 : 3000 };
    if (periodo) params.periodo = periodo;
    if (programaCodigo) params.programaCodigo = programaCodigo;
    return this.http.get<any>(`${B}/api/materias/cursos`, { params }).pipe(map(r => (r.content ?? r) as any[]));
  }
  /**
   * Inscripción del estudiante autenticado: el gateway toma el id del token.
   * idempotencyKey: una por intento (crypto.randomUUID()); si la petición se repite,
   * el backend devuelve la inscripción anterior y no crea otra (consistencia A2).
   */
  inscribir(cursoId: number, periodo: string, idempotencyKey: string) {
    return this.http.post<any>(`${B}/api/inscripciones/mias`, { cursoId, periodo },
      { headers: { 'Idempotency-Key': idempotencyKey } });
  }
  /** Interruptor global de inscripción de materias. */
  configuracionInscripcion() { return this.http.get<{ habilitada: boolean }>(`${B}/api/inscripciones/configuracion`); }
  cambiarConfiguracionInscripcion(habilitada: boolean) {
    return this.http.put<{ habilitada: boolean }>(`${B}/api/inscripciones/configuracion`, { habilitada });
  }
  /** Catálogo de programas académicos (código y nombre). */
  programas() {
    return this.http.get<any>(`${B}/api/programas`).pipe(map(r => (r.data ?? r) as any[]));
  }

  // ---- Archivos (ajustar rutas cuando el grupo publique estos endpoints) ----
  archivosMateria(materiaId: number) { return this.http.get<any[]>(`${B}/api/materias/${materiaId}/archivos`); }
  urlArchivoMateria(materiaId: number, archivoId: number) {
    return this.http.get<{ url: string }>(`${B}/api/materias/${materiaId}/archivos/${archivoId}/url`);
  }
  subirFoto(estudianteId: number, file: File) {
    const fd = new FormData(); fd.append('file', file);
    return this.http.put<any>(`${B}/api/estudiantes/${estudianteId}/foto`, fd);
  }

  buscarMaterias(search: string, programa?: string, programaCodigo?: string) {
    const params: any = { pageNumber: 0, pageSize: 50, search };
    if (programa) params.programa = programa;
    if (programaCodigo) params.programaCodigo = programaCodigo;
    return this.http.get<any>(`${B}/api/materias`, { params }).pipe(map(r => (r.content ?? r) as any[]));
  }
  contacto(estudianteId: number) { return this.http.get<any>(`${B}/api/estudiantes/${estudianteId}/contacto`); }
  docente(id: number) { return this.http.get<any>(`${B}/api/materias/docentes/${id}`); }
  cursosDocente(docenteId: number) {
    return this.http.get<any>(`${B}/api/materias/cursos`, { params: { pageNumber: 0, pageSize: 100, docenteId } })
      .pipe(map(r => (r.content ?? r) as any[]));
  }

  estudiantes(page: number, name: string, size = 12) {
    const params: any = { pageNumber: page, pageSize: size, sortBy: 'id', sortDirection: 'asc' };
    if (name) params.name = name;
    return this.http.get<any>(`${B}/api/estudiantes`, { params }).pipe(map(r => (r.content ?? r.data ?? r.items ?? r) as any[]));
  }
  materiasPag(page: number, search: string, size = 12) {
    const params: any = { pageNumber: page, pageSize: size, sortBy: 'id', sortDirection: 'asc' };
    if (search) params.search = search;
    return this.http.get<any>(`${B}/api/materias`, { params }).pipe(map(r => (r.content ?? r) as any[]));
  }
  pdfUrl(materiaId: number) {
    return this.archivosMateria(materiaId).pipe(switchMap(a => a?.length ? this.urlArchivoMateria(materiaId, a[0].id).pipe(map(r => r.url)) : of(null)));
  }
  subirPdf(materiaId: number, file: File) {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<any>(`${B}/api/materias/${materiaId}/archivos`, fd);
  }
}
