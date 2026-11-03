import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { map, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  get token() { return sessionStorage.getItem('token'); }
  get claims(): any {
    try { return JSON.parse(atob(this.token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { return {}; }
  }
  /** Id del estudiante: viene SIEMPRE del token (claim estudianteId, que emite auth-service). NaN si el usuario no está vinculado. */
  get estudianteId(): number {
    const v = this.claims.estudianteId;
    return v !== undefined && v !== null && !isNaN(Number(v)) ? Number(v) : NaN;
  }
  get esAdmin(): boolean { return /ADMIN/i.test(this.rol); }
  get esEstudiante(): boolean { return !this.esAdmin && !this.esDocente; }
  /** Un estudiante sin estudianteId en el token no puede usar el portal: hay que vincularlo en auth-service. */
  get sinVinculo(): boolean { return this.esEstudiante && isNaN(this.estudianteId); }
  get nombre(): string { return this.claims.nombre ?? this.claims.name ?? this.claims.sub ?? ''; }
  get rol(): string { const c = this.claims; return c.rol ?? c.role ?? (c.roles?.[0] ?? ''); }
  get esDocente(): boolean { return /DOCENTE|PROFESOR|TEACHER/i.test(this.rol); }
  get docenteId(): number { const c = this.claims; return Number(c.docenteId ?? c.teacherId ?? c.sub); }
  get autenticado() {
    const exp = this.claims.exp; return !!this.token && (!exp || exp * 1000 > Date.now());
  }
  /** Emite true si se puede entrar; false si el login fue correcto pero el usuario es estudiante sin estudianteId. */
  login(username: string, password: string) {
    return this.http.post<any>(`${environment.gatewayUrl}/api/auth/login`, { username, password })
      .pipe(tap(r => sessionStorage.setItem('token', r.token ?? r.accessToken)),
        map(() => {
          if (this.sinVinculo) { sessionStorage.removeItem('token'); return false; }
          return true;
        }));
  }
  logout() { sessionStorage.removeItem('token'); this.router.navigate(['/login']); }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const r = auth.token ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } }) : req;
  return next(r);
};
export const authGuard: CanActivateFn = () => {
  const a = inject(Auth), r = inject(Router);
  return a.autenticado && !a.sinVinculo ? true : r.createUrlTree(['/login']);
};
