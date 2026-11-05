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
  materias() {
    return this.http.get<any>(`${B}/api/materias`, { params: { pageNumber: 0, pageSize: 200, sortBy: 'id', sortDirection: 'asc' } })
      .pipe(map(r => (r.content ?? r) as any[]));
  }
  cursos(materiaId: number, periodo?: string) {
    const params: any = { pageNumber: 0, pageSize: 100, materiaId };
    if (periodo) params.periodo = periodo;
    return this.http.get<any>(`${B}/api/materias/cursos`, { params }).pipe(map(r => (r.content ?? r) as any[]));
  }
  /** Oferta completa de un periodo (sin filtrar por materia). */
  cursosPeriodo(periodo?: string) {
    const params: any = { pageNumber: 0, pageSize: 500 };
    if (periodo) params.periodo = periodo;
    return this.http.get<any>(`${B}/api/materias/cursos`, { params }).pipe(map(r => (r.content ?? r) as any[]));
  }
  /** Inscripción del estudiante autenticado: el gateway toma el id del token. */
  inscribir(cursoId: number, periodo: string) {
    return this.http.post<any>(`${B}/api/inscripciones/mias`, { cursoId, periodo });
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

  buscarMaterias(search: string, programa?: string) {
    const params: any = { pageNumber: 0, pageSize: 50, search };
    if (programa) params.programa = programa;
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
