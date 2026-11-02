import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-shell', imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`.w{display:flex;min-height:100vh}nav{width:250px;background:var(--g);color:#fff;flex-shrink:0;transition:transform .2s;z-index:20}
  .logo{padding:22px;font-size:22px;font-weight:700;background:#fff;color:#333;border-bottom-right-radius:40px;margin-bottom:12px}
  nav a{display:block;padding:16px 22px;color:#fff;text-decoration:none;border-bottom:1px solid #fff2}nav a.on{background:var(--y);color:#222;font-weight:500}
  .m{flex:1;min-width:0}header{background:var(--y);padding:12px 18px;display:flex;justify-content:space-between;align-items:center;gap:10px;font-weight:500;position:sticky;top:0;z-index:10}
  main{padding:0 28px}.burger{display:none;background:none;border:0;font-size:26px;cursor:pointer}.ov{display:none}
  @media(max-width:800px){nav{position:fixed;top:0;bottom:0;left:0;transform:translateX(-100%)}nav.open{transform:none}.burger{display:block}
  .ov.open{display:block;position:fixed;inset:0;background:#0006;z-index:15}header span.u{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}`],
  template: `<div class="w"><div class="ov" [class.open]="open()" (click)="open.set(false)"></div>
  <nav [class.open]="open()" (click)="open.set(false)"><div class="logo">Uptc</div>
    @if (auth.esEstudiante) {
      <a routerLink="notas" routerLinkActive="on">Asignaturas inscritas</a>
      <a routerLink="buscar" routerLinkActive="on">Buscar cursos</a>
      <a routerLink="pendientes" routerLinkActive="on">Asignaturas pendientes</a> }
    @if (auth.esAdmin) { <a routerLink="estudiantes" routerLinkActive="on">Estudiantes</a> }
    <a routerLink="materias" routerLinkActive="on">Materias</a>
    @if (!auth.esAdmin) { <a routerLink="perfil" routerLinkActive="on">Perfil</a> }</nav>
  <div class="m"><header><button class="burger" (click)="open.set(true)" aria-label="Menú">☰</button>
    <span class="u">{{auth.nombre}} <span class="pill">{{auth.rol}}</span></span><button class="btn out sm" (click)="auth.logout()">Salir</button></header>
  <main><router-outlet/></main></div></div>`
})
export class Shell { auth = inject(Auth); open = signal(false); }
