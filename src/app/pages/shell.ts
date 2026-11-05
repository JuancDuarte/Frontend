import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  host: { '[class.menu-open]': 'open()' },
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    :host(.menu-open) { overflow: hidden; }
    main { flex: 1 0 auto; }

    /* ---------- Pie ---------- */
    .foot {
      margin-top: 40px;
      border-top: 1px solid var(--line-soft);
      padding: 22px 24px 28px;
    }
    .foot .fin {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px 24px; flex-wrap: wrap;
      max-width: 1120px; margin: 0 auto;
      color: var(--muted-2);
      font-size: 12px;
      letter-spacing: -.005em;
    }
    .foot .fin b { color: var(--muted); font-weight: 500; }

    /* ---------- Barra superior ---------- */
    .top {
      position: sticky; top: 0; z-index: 60;
      background: rgba(251, 251, 253, .82);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid rgba(0, 0, 0, .08);
    }

    .in {
      display: flex; align-items: center; gap: 26px;
      max-width: 1120px; height: 50px;
      margin: 0 auto; padding: 0 24px;
    }

    .brand {
      display: flex; align-items: center; gap: 9px;
      flex: 0 0 auto;
      color: var(--ink);
      text-decoration: none;
    }
    .brand:hover { text-decoration: none; }

    .crest {
      display: grid; place-items: center;
      width: 26px; height: 26px;
      padding-bottom: 1px;
      border-radius: 7px;
      background: var(--ink);
      color: #fff;
      font-family: var(--font-display);
      font-size: 16px; font-weight: 500; line-height: 1;
    }

    .brand .name {
      font-size: 13px; font-weight: 600; letter-spacing: -.015em;
      white-space: nowrap;
    }
    .brand .name em {
      margin-left: 8px;
      color: var(--muted-2);
      font-style: normal;
      font-size: 10px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
    }

    .links {
      display: flex; align-items: center; gap: 2px;
      flex: 1; min-width: 0;
    }

    .links a {
      position: relative;
      padding: 7px 11px;
      border-radius: 8px;
      color: rgba(29, 29, 31, .7);
      font-size: 12.5px; font-weight: 400; letter-spacing: -.005em;
      white-space: nowrap;
      text-decoration: none;
      transition: color .18s var(--ease), background .18s var(--ease);
    }
    .links a:hover { color: var(--ink); background: rgba(0, 0, 0, .045); text-decoration: none; }
    .links a.on { color: var(--ink); font-weight: 500; }
    .links a.on::after {
      content: "";
      position: absolute; left: 11px; right: 11px; bottom: 1px;
      height: 1px;
      background: currentColor;
    }

    .me {
      display: flex; align-items: center; gap: 10px;
      flex: 0 0 auto;
    }

    .who {
      max-width: 150px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--muted);
      font-size: 12.5px;
    }

    .avatar {
      display: grid; place-items: center;
      width: 27px; height: 27px;
      border-radius: 50%;
      background: var(--surface-3);
      color: var(--ink-2);
      font-size: 10px; font-weight: 600; letter-spacing: .03em;
    }

    .logout {
      display: grid; place-items: center;
      width: 30px; height: 30px; padding: 0;
      border: 0; border-radius: 8px;
      background: transparent; color: var(--muted);
      cursor: pointer;
      transition: background .18s var(--ease), color .18s var(--ease);
    }
    .logout:hover { background: rgba(0, 0, 0, .05); color: var(--ink); }
    .logout svg { width: 15px; height: 15px; }

    .menu-btn {
      display: none;
      place-items: center;
      width: 34px; height: 34px; padding: 0;
      border: 0; border-radius: 8px;
      background: transparent; color: var(--ink);
      cursor: pointer;
    }
    .menu-btn svg { width: 18px; height: 18px; }

    /* ---------- Menú móvil ---------- */
    .sheet {
      position: fixed; inset: 52px 0 0; z-index: 55;
      overflow-y: auto;
      padding: 6px 24px 40px;
      background: rgba(251, 251, 253, .97);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      animation: sheet .34s var(--ease) both;
    }

    @keyframes sheet {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: none; }
    }

    .sheet-in { max-width: 640px; margin: 0 auto; }

    .sheet a.sheet-link {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 16px 2px;
      border-bottom: 1px solid var(--line-soft);
      color: var(--ink);
      font-family: var(--font-display);
      font-size: 26px; font-weight: 600; letter-spacing: -.03em;
      text-decoration: none;
    }
    .sheet a.sheet-link:hover { text-decoration: none; color: var(--blue); }
    .sheet a.sheet-link.on { color: var(--blue); }
    .sheet a.sheet-link svg { width: 17px; height: 17px; color: var(--muted-2); flex: 0 0 17px; }

    .sheet-foot {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      margin-top: 26px; padding-top: 18px;
      border-top: 1px solid var(--line-soft);
    }
    .sheet-foot .id { color: var(--muted); font-size: 13px; }
    .sheet-foot .id b { display: block; color: var(--ink); font-size: 14px; font-weight: 500; }

    .sheet-out {
      display: inline-flex; align-items: center; gap: 8px;
      min-height: 38px; padding: 0 18px;
      border: 1px solid var(--line);
      border-radius: var(--pill);
      background: transparent; color: var(--ink);
      font-family: inherit; font-size: 13px;
      cursor: pointer;
    }
    .sheet-out:hover { background: var(--surface-3); }
    .sheet-out svg { width: 15px; height: 15px; }

    @media (max-width: 1000px) {
      .who { display: none; }
    }

    @media (max-width: 900px) {
      .links, .me { display: none; }
      .menu-btn { display: grid; margin-left: auto; }
      .in { gap: 16px; padding: 0 20px; }
      .sheet { inset: 50px 0 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .sheet { animation: none; }
    }
  `],
  template: `
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

  <header class="top">
    <div class="in">
      <a class="brand" routerLink="/" aria-label="Inicio del Portal Académico UPTC">
        <span class="crest" aria-hidden="true">U</span>
        <span class="name">Portal Académico<em>UPTC</em></span>
      </a>

      <nav class="links" aria-label="Navegación principal">
        @if (auth.esEstudiante) {
          <a routerLink="notas" routerLinkActive="on" ariaCurrentWhenActive="page">Asignaturas</a>
          <a routerLink="inscribir" routerLinkActive="on" ariaCurrentWhenActive="page">Inscribir</a>
          <a routerLink="buscar" routerLinkActive="on" ariaCurrentWhenActive="page">Buscar cursos</a>
          <a routerLink="pendientes" routerLinkActive="on" ariaCurrentWhenActive="page">Pendientes</a>
        }

        @if (auth.esAdmin) {
          <a routerLink="estudiantes" routerLinkActive="on" ariaCurrentWhenActive="page">Estudiantes</a>
        }

        <a routerLink="materias" routerLinkActive="on" ariaCurrentWhenActive="page">Materias</a>

        @if (!auth.esAdmin) {
          <a routerLink="perfil" routerLinkActive="on" ariaCurrentWhenActive="page">Perfil</a>
        }
      </nav>

      <div class="me">
        <span class="who">{{ auth.nombre || 'Usuario' }}</span>
        <span class="avatar" aria-hidden="true">{{ ini() }}</span>
        <button class="logout" type="button" (click)="auth.logout()" aria-label="Cerrar sesión" title="Cerrar sesión">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
        </button>
      </div>

      <button class="menu-btn" type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="menu-movil"
              [attr.aria-label]="open() ? 'Cerrar menú' : 'Abrir menú'">
        @if (open()) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        }
      </button>
    </div>
  </header>

  @if (open()) {
    <div class="sheet" id="menu-movil" role="dialog" aria-label="Menú de navegación">
      <div class="sheet-in" (click)="open.set(false)">
        @if (auth.esEstudiante) {
          <a class="sheet-link" routerLink="notas" routerLinkActive="on" ariaCurrentWhenActive="page">
            Asignaturas inscritas
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
          </a>
          <a class="sheet-link" routerLink="inscribir" routerLinkActive="on" ariaCurrentWhenActive="page">
            Inscribir asignaturas
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
          </a>
          <a class="sheet-link" routerLink="buscar" routerLinkActive="on" ariaCurrentWhenActive="page">
            Buscar cursos
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
          </a>
          <a class="sheet-link" routerLink="pendientes" routerLinkActive="on" ariaCurrentWhenActive="page">
            Asignaturas pendientes
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
          </a>
        }

        @if (auth.esAdmin) {
          <a class="sheet-link" routerLink="estudiantes" routerLinkActive="on" ariaCurrentWhenActive="page">
            Estudiantes
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
          </a>
        }

        <a class="sheet-link" routerLink="materias" routerLinkActive="on" ariaCurrentWhenActive="page">
          Materias
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
        </a>

        @if (!auth.esAdmin) {
          <a class="sheet-link" routerLink="perfil" routerLinkActive="on" ariaCurrentWhenActive="page">
            Perfil
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
          </a>
        }
      </div>

      <div class="sheet-in sheet-foot">
        <div class="id">
          <b>{{ auth.nombre || 'Usuario' }}</b>
          {{ auth.rol || 'USUARIO' }}
        </div>
        <button class="sheet-out" type="button" (click)="auth.logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  }

  <main id="contenido"><router-outlet/></main>

  <footer class="foot">
    <div class="fin">
      <span><b>Portal Académico UPTC</b> · Universidad Pedagógica y Tecnológica de Colombia</span>
      <span>Sistemas Distribuidos · Laboratorio 4 · 2026</span>
    </div>
  </footer>
  `
})
export class Shell {
  auth = inject(Auth);
  open = signal(false);

  @HostListener('document:keydown.escape')
  cerrar() { this.open.set(false); }

  ini() {
    const n = (this.auth.nombre || '').trim();
    if (!n) return 'U';
    const parts = n.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
  }
}
