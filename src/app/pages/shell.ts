import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

/** Nombre legible a partir de la ficha del estudiante o, en su defecto, de los claims. */
const nombreCompleto = (e: any): string => {
  const directo = `${e?.nombre ?? ''}`.trim();
  if (directo) return directo;
  return `${e?.firstName ?? ''} ${e?.lastName ?? ''}`.replace(/\s+/g, ' ').trim();
};

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  host: { '[class.menu-open]': 'open()' },
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; background: var(--bg); }
    :host(.menu-open) { overflow: hidden; }
    main { flex: 1 0 auto; }

    /* ---------- Barra superior ---------- */
    .top {
      position: sticky; top: 0; z-index: 60;
      background: #0b0b0c;
      color: #fff;
      border-bottom: 1px solid rgba(242, 183, 5, .38);
      box-shadow: 0 18px 40px -32px rgba(0, 0, 0, .95);
    }

    .top::before {
      content: "";
      display: block;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--gold) 16%, var(--gold) 84%, transparent);
    }

    .in {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 18px;
      width: 100%;
      max-width: 1280px;
      height: 68px;
      margin: 0 auto;
      padding: 0 28px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 13px;
      justify-self: start;
      min-width: 0;
      text-decoration: none;
    }
    .brand:hover { text-decoration: none; }

    .brand img {
      display: block;
      width: 110px;
      height: auto;
      flex: 0 0 auto;
    }

    .brand .name {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      padding-left: 13px;
      border-left: 1px solid rgba(255, 255, 255, .16);
      line-height: 1.1;
    }
    .brand .name b {
      color: #fff;
      font-family: var(--font-display);
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: -.01em;
      white-space: nowrap;
    }
    .brand .name em {
      color: var(--gold);
      font-style: normal;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: .18em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* Bloque de usuario: centrado en la barra */
    .me {
      justify-self: center;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    /* Nombre del titular: misma altura de línea que el avatar para centrarse con la inicial */
    .user-name {
      display: flex;
      align-items: center;
      height: 32px;
      max-width: 200px;
      margin: 0;
      overflow: hidden;
      color: rgba(255, 255, 255, .72);
      font-size: 12.5px;
      line-height: 1;
      letter-spacing: -.005em;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .avatar {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      flex: 0 0 auto;
      border: 1px solid rgba(242, 183, 5, .48);
      border-radius: 50%;
      background: rgba(242, 183, 5, .14);
      color: var(--gold);
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: .05em;
    }

    .logout {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      flex: 0 0 auto;
      padding: 0;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: rgba(255, 255, 255, .66);
      cursor: pointer;
      transition: background .18s var(--ease), color .18s var(--ease);
    }
    .logout:hover { background: rgba(242, 183, 5, .15); color: var(--gold); }
    .logout:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; box-shadow: none; }
    .logout svg { width: 16px; height: 16px; }

    .side {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-self: end;
    }

    .role {
      color: rgba(255, 255, 255, .46);
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: .16em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .menu-btn {
      display: none;
      place-items: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: 1px solid rgba(255, 255, 255, .18);
      border-radius: 9px;
      background: transparent;
      color: #fff;
      cursor: pointer;
    }
    .menu-btn:hover { border-color: rgba(242, 183, 5, .55); color: var(--gold); }
    .menu-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; box-shadow: none; }
    .menu-btn svg { width: 18px; height: 18px; }

    /* ---------- Navegación centrada ---------- */
    .links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      height: 46px;
      margin: 0 auto;
      padding: 0 28px;
      border-top: 1px solid rgba(255, 255, 255, .07);
    }

    .links a {
      position: relative;
      padding: 7px 14px;
      border-radius: 8px;
      color: rgba(255, 255, 255, .66);
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: .13em;
      text-transform: uppercase;
      white-space: nowrap;
      text-decoration: none;
      transition: color .18s var(--ease), background .18s var(--ease);
    }
    .links a:hover {
      color: #fff;
      background: rgba(255, 255, 255, .055);
      text-decoration: none;
    }
    .links a.on { color: #fff; }
    .links a.on::after {
      content: "";
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 2px;
      height: 2px;
      border-radius: 2px;
      background: var(--gold);
    }
    .links a:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; box-shadow: none; }

    /* ---------- Menú móvil ---------- */
    .sheet {
      position: fixed;
      inset: 116px 0 0;
      z-index: 55;
      overflow-y: auto;
      padding: 10px 24px 40px;
      background: #0b0b0c;
      animation: sheet .34s var(--ease) both;
    }

    @keyframes sheet {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: none; }
    }

    .sheet-in { max-width: 640px; margin: 0 auto; }

    .sheet a.sheet-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 17px 2px;
      border-bottom: 1px solid rgba(255, 255, 255, .09);
      color: #fff;
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -.03em;
      text-decoration: none;
    }
    .sheet a.sheet-link:hover { color: var(--gold); text-decoration: none; }
    .sheet a.sheet-link.on { color: var(--gold); }
    .sheet a.sheet-link svg { width: 17px; height: 17px; color: rgba(255, 255, 255, .38); flex: 0 0 17px; }
    .sheet a.sheet-link:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; box-shadow: none; }

    .sheet-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-top: 26px;
      padding-top: 20px;
      border-top: 1px solid rgba(242, 183, 5, .3);
    }
    .sheet-foot .id { color: rgba(255, 255, 255, .5); font-size: 12px; }
    .sheet-foot .id b { display: block; color: #fff; font-size: 14px; font-weight: 500; }
    .sheet-foot .id em {
      display: block;
      margin-top: 4px;
      color: var(--gold);
      font-style: normal;
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    .sheet-out {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 38px;
      padding: 0 18px;
      border: 1px solid rgba(242, 183, 5, .5);
      border-radius: var(--pill);
      background: transparent;
      color: var(--gold);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background .18s var(--ease);
    }
    .sheet-out:hover { background: rgba(242, 183, 5, .13); }
    .sheet-out:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; box-shadow: none; }
    .sheet-out svg { width: 15px; height: 15px; }

    /* ---------- Pie ---------- */
    .foot {
      margin-top: 56px;
      border-top: 1px solid rgba(242, 183, 5, .35);
      padding: 26px 28px 30px;
      background: #0b0b0c;
    }
    .foot .fin {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px 24px;
      flex-wrap: wrap;
      max-width: 1120px;
      margin: 0 auto;
      color: rgba(255, 255, 255, .5);
      font-size: 12px;
      letter-spacing: -.005em;
    }
    .foot .fin b { color: #fff; font-weight: 500; }
    .foot .fin .dot { margin: 0 6px; color: var(--gold); }

    @media (max-width: 1120px) {
      .brand .name { display: none; }
    }

    @media (max-width: 900px) {
      .links { display: none; }
      .menu-btn { display: grid; }
      .role { display: none; }
      .in { height: 64px; padding: 0 20px; }
      .brand img { width: 96px; }
      .sheet { inset: 66px 0 0; }
    }

    @media (max-width: 620px) {
      .in { gap: 10px; padding: 0 16px; }
      .brand img { width: 88px; }
      .user-name { display: none; }
      .sheet { padding: 6px 18px 32px; }
      .sheet a.sheet-link { font-size: 21px; padding: 15px 2px; }
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
        <img src="uptc-logo-claro.png" alt="Universidad Pedagógica y Tecnológica de Colombia">
        <span class="name">
          <b>Portal Académico</b>
          <em>UPTC</em>
        </span>
      </a>

      <div class="me">
        <span class="user-name" [title]="nombre()">{{ nombre() }}</span>
        <span class="avatar" aria-hidden="true">{{ ini() }}</span>
        <button class="logout" type="button" (click)="auth.logout()" aria-label="Cerrar sesión" title="Cerrar sesión">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
        </button>
      </div>

      <div class="side">
        <span class="role">{{ auth.esAdmin ? 'Administrador' : 'Estudiante' }}</span>
        <button class="menu-btn" type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="menu-movil"
                [attr.aria-label]="open() ? 'Cerrar menú' : 'Abrir menú'">
          @if (open()) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          }
        </button>
      </div>
    </div>

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
          <b>{{ nombre() }}</b>
          <em>{{ auth.esAdmin ? 'Administrador' : 'Estudiante' }}</em>
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
      <span><b>Portal Académico UPTC</b><span class="dot">·</span>Universidad Pedagógica y Tecnológica de Colombia</span>
      <span>Sistemas Distribuidos<span class="dot">·</span>Laboratorio 4<span class="dot">·</span>2026</span>
    </div>
  </footer>
  `
})
export class Shell implements OnInit {
  private api = inject(Api);
  auth = inject(Auth);
  open = signal(false);
  /** Nombre visible del titular de la cuenta (el JWT solo trae el usuario, no el nombre). */
  nombre = signal((this.auth.nombre || 'Usuario').trim() || 'Usuario');

  ngOnInit() {
    // El token identifica al usuario (p. ej. "estudiante1"), no a la persona:
    // para estudiantes se consulta la ficha y se muestra el nombre completo.
    if (!this.auth.esEstudiante) return;
    const id = this.auth.estudianteId;
    if (isNaN(id)) return;

    this.api.estudiante(id).subscribe({
      next: (e) => {
        const visible = nombreCompleto(e);
        if (visible) this.nombre.set(visible);
      },
      error: () => { /* se conserva el nombre de respaldo del token */ }
    });
  }

  @HostListener('document:keydown.escape')
  cerrar() { this.open.set(false); }

  ini() {
    const n = this.nombre().trim();
    if (!n) return 'U';
    const parts = n.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
  }
}
