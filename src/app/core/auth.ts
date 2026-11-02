
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
 
@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  get token() { return sessionStorage.getItem('token'); }
  get claims(): any {
    try { return JSON.parse(atob(this.token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { return {}; }
  }
  /** El Gateway pide un id numérico de estudiante. Se toma del token (claim estudianteId) o, si no viene, de la búsqueda por correo/documento hecha al iniciar sesión. */
  get estudianteId(): number {
    const c = this.claims; const v = c.estudianteId ?? c.studentId ?? c.idEstudiante;
    if (v !== undefined && !isNaN(Number(v))) return Number(v);
    const s = sessionStorage.getItem('estId'); return s ? Number(s) : NaN;
  }
  get esAdmin(): boolean { return /ADMIN/i.test(this.rol); }
  get esEstudiante(): boolean { return !this.esAdmin && !this.esDocente; }
  resolverId(usuario?: string): Observable<boolean> {
    const c = this.claims;
    const vals = [...new Set([usuario, c.email, c.sub, c.username, c.preferred_username].filter(Boolean) as string[])];
    const tries: Record<string, string>[] = vals.map(v => ({
      name: v.replace(/[._-]+/g, ' ')
    }));
    const buscar = (i: number): Observable<boolean> => i >= tries.length ? of(false) :
      this.http.get<any>(`${environment.gatewayUrl}/api/estudiantes`, { params: { ...tries[i], pageNumber: 1, pageSize: 2 } as Record<string, string | number> }).pipe(
        map((r: any) => { const l = r.content ?? r.data ?? r.items ?? r; return Array.isArray(l) && l.length === 1 ? l[0].id : undefined; }), catchError(() => of(undefined)),
        switchMap(id => id ? (sessionStorage.setItem('estId', String(id)), of(true)) : buscar(i + 1)));
    return buscar(0);
  }
  get nombre(): string { return this.claims.nombre ?? this.claims.name ?? this.claims.sub ?? ''; }
  get rol(): string { const c = this.claims; return c.rol ?? c.role ?? (c.roles?.[0] ?? ''); }
  get esDocente(): boolean { return /DOCENTE|PROFESOR|TEACHER/i.test(this.rol); }
  get docenteId(): number { const c = this.claims; return Number(c.docenteId ?? c.teacherId ?? c.sub); }
  get autenticado() {
    const exp = this.claims.exp; return !!this.token && (!exp || exp * 1000 > Date.now());
  }
  login(username: string, password: string) {
    return this.http.post<any>(`${environment.gatewayUrl}/api/auth/login`, { username, password })
      .pipe(tap(r => { sessionStorage.removeItem('estId'); sessionStorage.setItem('token', r.token ?? r.accessToken); }),
        switchMap(() => this.esEstudiante && isNaN(this.estudianteId) ? this.resolverId(username) : of(true)));
  }
  logout() { sessionStorage.removeItem('token'); sessionStorage.removeItem('estId'); this.router.navigate(['/login']); }
}
 
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const r = auth.token ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } }) : req;
  return next(r);
};
export const authGuard: CanActivateFn = () => {
  const a = inject(Auth), r = inject(Router), login = r.createUrlTree(['/login']);
  if (!a.autenticado) return login;
  if (!a.esEstudiante || !isNaN(a.estudianteId)) return true;
  return a.resolverId().pipe(map(ok => ok ? true : login));
};