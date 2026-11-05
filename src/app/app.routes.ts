import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, Auth } from './core/auth';
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login').then(m => m.Login) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./pages/shell').then(m => m.Shell), children: [
    { path: '', pathMatch: 'full', redirectTo: () => { const a = inject(Auth); return a.esAdmin ? 'estudiantes' : a.esDocente ? 'perfil' : 'notas'; } },
    { path: 'notas', loadComponent: () => import('./pages/notas').then(m => m.Notas) },
    { path: 'estudiantes', loadComponent: () => import('./pages/estudiantes').then(m => m.Estudiantes) },
    { path: 'estudiantes/:id', loadComponent: () => import('./pages/detalle').then(m => m.Detalle) },
    { path: 'materias', loadComponent: () => import('./pages/materias').then(m => m.Materias) },
    { path: 'perfil', loadComponent: () => import('./pages/perfil').then(m => m.Perfil) },
    { path: 'pendientes', loadComponent: () => import('./pages/pendientes').then(m => m.Pendientes) },
    { path: 'buscar', loadComponent: () => import('./pages/buscar').then(m => m.Buscar) },
    { path: 'inscribir', loadComponent: () => import('./pages/inscribir').then(m => m.Inscribir) },
  ]},
  { path: '**', redirectTo: '' }
];
