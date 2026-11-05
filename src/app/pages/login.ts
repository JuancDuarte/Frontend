import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  styles: [`
    :host {
      --g: #f2b705;
      --g-2: #ffca1f;
      --g-ink: #b07d00;
      --g-deep: #8f6900;
      --ink: #161616;
      --muted: #6f6f74;
      --line: #e4e4e7;
      --card: #ffffff;
      display: block;
    }

    .host {
      position: relative;
      min-height: 100vh;
      background: #0b0b0c;
      overflow: hidden;
    }

    .bg {
      position: absolute;
      inset: 0;
      background: url("/uptc-fondo.jpg") center / cover no-repeat;
    }

    .bg::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(0, 0, 0, .86) 0%, rgba(0, 0, 0, .6) 38%, rgba(0, 0, 0, .34) 68%, rgba(0, 0, 0, .52) 100%),
        linear-gradient(180deg, rgba(0, 0, 0, .55) 0%, transparent 30%, transparent 68%, rgba(0, 0, 0, .5) 100%);
    }

    .wrap {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.16fr) minmax(0, .84fr);
      gap: clamp(24px, 4vw, 64px);
      width: min(1600px, 100%);
      min-height: 100vh;
      margin: 0 auto;
      padding: clamp(28px, 4.6vh, 54px) clamp(24px, 4.6vw, 78px) clamp(26px, 4vh, 46px);
    }

    /* ---------- Escena ---------- */
    .stage {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: clamp(28px, 5vh, 56px);
      min-width: 0;
      padding: 2px 0;
    }

    .brand img {
      display: block;
      width: clamp(210px, 21vw, 292px);
      height: auto;
    }

    .claim { max-width: 760px; }

    .claim h1 {
      margin: 0;
      color: #f7f7f8;
      font-family: var(--font-display);
      font-size: clamp(46px, 5.7vw, 82px);
      font-weight: 600;
      line-height: .98;
      letter-spacing: -.045em;
    }

    .slash {
      margin-right: .05em;
      color: var(--g);
      font-weight: 500;
    }

    .up {
      margin-top: clamp(10px, 1.6vh, 16px);
      color: var(--g);
      font-family: var(--font-display);
      font-size: clamp(16px, 1.5vw, 22px);
      font-weight: 600;
      letter-spacing: .34em;
      line-height: 1;
    }

    .system {
      margin-top: clamp(10px, 1.4vh, 14px);
      color: rgba(255, 255, 255, .68);
      font-size: clamp(11px, .95vw, 13px);
      letter-spacing: .17em;
      line-height: 1.5;
      text-transform: uppercase;
    }

    .tag {
      margin-top: clamp(34px, 5.6vh, 62px);
      color: #fff;
      font-size: clamp(22px, 2.35vw, 34px);
      font-weight: 400;
      line-height: 1.32;
      letter-spacing: -.026em;
    }

    .tag b { color: var(--g); font-weight: 600; }

    .feats {
      display: flex;
      align-items: center;
      gap: clamp(18px, 2.6vw, 38px);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .feats li {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgba(255, 255, 255, .9);
      font-size: 13.5px;
      letter-spacing: -.005em;
      white-space: nowrap;
    }

    .feats li + li {
      padding-left: clamp(18px, 2.6vw, 38px);
      border-left: 1px solid rgba(255, 255, 255, .26);
    }

    .feats svg {
      width: 20px;
      height: 20px;
      flex: 0 0 20px;
      color: rgba(255, 255, 255, .82);
    }

    /* ---------- Acceso ---------- */
    .access {
      display: grid;
      place-items: center;
      min-width: 0;
    }

    .card {
      position: relative;
      width: min(468px, 100%);
      padding: clamp(28px, 3.2vw, 42px) clamp(24px, 3vw, 40px) clamp(24px, 2.6vw, 32px);
      border-radius: 20px;
      background: var(--card);
      box-shadow: 0 40px 90px -34px rgba(0, 0, 0, .65), 0 2px 0 rgba(255, 255, 255, .35) inset;
      overflow: hidden;
      animation: rise .65s var(--ease) both;
    }

    .mark {
      position: absolute;
      top: -58px;
      right: -58px;
      width: clamp(210px, 21vw, 278px);
      height: auto;
      opacity: .05;
      filter: grayscale(1);
      pointer-events: none;
      user-select: none;
    }

    @keyframes rise {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: none; }
    }

    /* Selector de rol */
    .roles {
      position: relative;
      display: flex;
      align-items: center;
      gap: 26px;
      margin-bottom: clamp(22px, 3vh, 30px);
      border-bottom: 1px solid var(--line);
    }

    .roles button {
      position: relative;
      padding: 0 0 11px;
      border: 0;
      background: none;
      color: #737379;
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 500;
      letter-spacing: .14em;
      line-height: 1;
      text-transform: uppercase;
      cursor: pointer;
      transition: color .2s var(--ease);
    }

    .roles button:hover { color: var(--ink); }

    .roles button.on { color: var(--ink); }

    .roles button.on::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 2px;
      border-radius: 2px;
      background: var(--g);
    }

    .roles button:focus-visible {
      outline: 2px solid var(--g);
      outline-offset: 4px;
      border-radius: 4px;
    }

    .card h2 {
      max-width: 20ch;
      margin: 0;
      color: var(--ink);
      font-family: var(--font-display);
      font-size: clamp(27px, 2.5vw, 33px);
      font-weight: 600;
      line-height: 1.12;
      letter-spacing: -.035em;
    }

    .card h2 em {
      display: block;
      color: var(--g-ink);
      font-style: normal;
    }

    .sub {
      max-width: 40ch;
      margin: 11px 0 0;
      color: var(--muted);
      font-size: 13.5px;
      line-height: 1.55;
      letter-spacing: -.006em;
    }

    .rule {
      display: block;
      width: 34px;
      height: 3px;
      margin: clamp(17px, 2.4vh, 22px) 0 clamp(20px, 2.6vh, 26px);
      border-radius: 2px;
      background: var(--g);
    }

    /* Campos */
    .field {
      position: relative;
      margin-bottom: 12px;
    }

    .field > svg {
      position: absolute;
      top: 50%;
      left: 16px;
      width: 18px;
      height: 18px;
      color: #9a9aa0;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .field input {
      width: 100%;
      height: 56px;
      min-height: 56px;
      padding: 0 16px 0 46px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fff;
      color: var(--ink);
      font-size: 15px;
      letter-spacing: -.01em;
      outline: none;
      transition: border-color .18s var(--ease), box-shadow .18s var(--ease);
    }

    .field input::placeholder { color: #9a9aa0; opacity: 1; }
    .field input:hover { border-color: #cfcfd4; }

    .field input:focus {
      border-color: var(--g);
      box-shadow: 0 0 0 4px rgba(242, 183, 5, .18);
    }

    .field input[aria-invalid="true"] {
      border-color: #c7251b;
      box-shadow: 0 0 0 4px rgba(199, 37, 27, .1);
    }

    .field input.with-btn { padding-right: 48px; }

    .eye {
      position: absolute;
      top: 50%;
      right: 7px;
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      padding: 0;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: #8a8a90;
      cursor: pointer;
      transform: translateY(-50%);
      transition: background .18s var(--ease), color .18s var(--ease);
    }

    .eye:hover { background: #f2f2f4; color: var(--ink); }
    .eye svg { width: 17px; height: 17px; }
    .eye:focus-visible { outline: 2px solid var(--g); outline-offset: 1px; }

    .card .err {
      margin: 12px 0 0;
      font-size: 12.5px;
      border-radius: 10px;
    }

    /* Botón */
    .submit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      height: 56px;
      margin-top: 20px;
      padding: 0 20px;
      border: 0;
      border-radius: 12px;
      background: var(--g);
      color: #171717;
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -.012em;
      cursor: pointer;
      transition: background .2s var(--ease), transform .2s var(--ease), box-shadow .2s var(--ease);
      box-shadow: 0 12px 26px -14px rgba(242, 183, 5, .95);
    }

    .submit:hover:not(:disabled) {
      background: var(--g-2);
      transform: translateY(-1px);
      box-shadow: 0 16px 32px -14px rgba(242, 183, 5, .95);
    }

    .submit:active:not(:disabled) { transform: none; }
    .submit:disabled { opacity: .62; cursor: not-allowed; box-shadow: none; }
    .submit svg { width: 18px; height: 18px; }

    .submit:focus-visible {
      outline: 2px solid var(--ink);
      outline-offset: 3px;
    }

    /* Recuperación y aviso */
    .forgot {
      display: flex;
      align-items: center;
      gap: 13px;
      margin-top: 21px;
      color: #8a8a90;
    }

    .forgot::before,
    .forgot::after {
      content: "";
      flex: 1;
      height: 1px;
      background: var(--line);
    }

    .forgot button {
      padding: 0;
      border: 0;
      background: none;
      color: #6e6e73;
      font-family: inherit;
      font-size: 12px;
      letter-spacing: -.005em;
      white-space: nowrap;
      cursor: pointer;
      transition: color .18s var(--ease);
    }

    .forgot button:hover { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
    .forgot button:focus-visible { outline: 2px solid var(--g); outline-offset: 3px; border-radius: 4px; }

    .help {
      margin: 10px 0 0;
      color: #6e6e73;
      font-size: 12px;
      line-height: 1.5;
      text-align: center;
      animation: rise .3s var(--ease) both;
    }

    .secure {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      margin: clamp(20px, 2.6vh, 26px) 0 0;
      color: #6e6e73;
      font-size: 11.5px;
      letter-spacing: -.005em;
    }

    .secure svg {
      width: 14px;
      height: 14px;
      color: #a2a2a8;
    }

    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    /* ---------- Adaptación ---------- */
    @media (max-width: 1080px) {
      .host { overflow: visible; }

      .wrap {
        grid-template-columns: minmax(0, 1fr);
        gap: clamp(22px, 3.5vh, 34px);
        min-height: 100vh;
        padding: clamp(24px, 4vh, 40px) clamp(18px, 4vw, 36px) clamp(24px, 4vh, 40px);
      }

      .stage {
        gap: clamp(20px, 3.5vh, 32px);
      }

      .brand img { width: clamp(180px, 32vw, 230px); }

      .claim { max-width: 620px; }

      .claim h1 { font-size: clamp(40px, 7.4vw, 58px); }

      .tag {
        margin-top: clamp(16px, 2.6vh, 24px);
        font-size: clamp(18px, 2.4vw, 22px);
      }

      .feats { display: none; }
    }

    @media (max-width: 560px) {
      .wrap { padding: 20px 16px 28px; }

      .brand img { width: 176px; }

      .claim h1 { font-size: clamp(34px, 10.4vw, 44px); }

      .up { font-size: 13px; letter-spacing: .3em; }

      .system { font-size: 10px; letter-spacing: .14em; }

      .tag {
        margin-top: 18px;
        font-size: 17px;
        line-height: 1.35;
      }

      .card {
        padding: 24px 20px 22px;
        border-radius: 16px;
      }

      .mark { width: 208px; top: -44px; right: -52px; opacity: .04; }

      .roles { gap: 20px; margin-bottom: 20px; }
      .roles button { font-size: 10.5px; }

      .card h2 { font-size: 25px; }
      .sub { font-size: 12.5px; }

      .field input, .submit { height: 52px; min-height: 52px; }
      .submit { font-size: 14px; }

      .forgot { margin-top: 18px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .card, .help { animation: none; }
    }
  `],
  template: `
  <div class="host">
    <div class="bg" aria-hidden="true"></div>

    <div class="wrap">
      <section class="stage">
        <header class="brand">
          <img src="uptc-logo-claro.png" alt="Universidad Pedagógica y Tecnológica de Colombia">
        </header>

        <div class="claim">
          <h1><span class="slash" aria-hidden="true">/</span> Portal Académico</h1>
          <p class="up">UPTC</p>
          <p class="system">Sistema de Información Académica</p>
          <p class="tag">Tu gestión académica,<br><b>más cerca</b> de ti.</p>
        </div>

        <ul class="feats" aria-label="Servicios del portal">
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11v4.3c0 1.5 2.5 2.9 5.5 2.9s5.5-1.4 5.5-2.9V11"/><path d="M21.5 9v5"/></svg>
            Academia
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M9 20h6M12 16.5V20"/></svg>
            Gestión
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-6"/><path d="M2 21h20"/></svg>
            Innovación
          </li>
        </ul>
      </section>

      <section class="access">
        <form class="card" (ngSubmit)="entrar()" novalidate>
          <img class="mark" src="uptc-aguila.png" alt="" aria-hidden="true">

          <div class="roles" role="group" aria-label="Tipo de acceso">
            <button type="button" [class.on]="rol() === 'estudiante'" [attr.aria-pressed]="rol() === 'estudiante'" (click)="setRol('estudiante')">Estudiante</button>
            <button type="button" [class.on]="rol() === 'admin'" [attr.aria-pressed]="rol() === 'admin'" (click)="setRol('admin')">Administrador</button>
          </div>

          <h2>Bienvenido al <em>Portal Académico UPTC</em></h2>
          <p class="sub">{{ rol() === 'admin'
            ? 'Gestiona estudiantes, materias e inscripciones desde un solo lugar.'
            : 'Consulta tus notas, inscríbete en cursos y descarga el material de tus materias.' }}</p>
          <span class="rule" aria-hidden="true"></span>

          <div class="field">
            <label class="sr" for="usuario">Usuario</label>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>
            <input id="usuario" type="text" name="u" [(ngModel)]="u" placeholder="Usuario" autocomplete="username" required [attr.aria-invalid]="invalido() ? 'true' : null">
          </div>

          <div class="field">
            <label class="sr" for="clave">Contraseña</label>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>
            <input id="clave" class="with-btn" [type]="ver() ? 'text' : 'password'" name="p" [(ngModel)]="p" placeholder="Contraseña" autocomplete="current-password" required [attr.aria-invalid]="invalido() ? 'true' : null">
            <button type="button" class="eye" (click)="ver.set(!ver())" [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              @if (ver()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c5 0 9 4.5 9 7a11.6 11.6 0 0 1-2.2 3.3"/><path d="M6.6 6.9A11.7 11.7 0 0 0 3 12c0 2.5 4 7 9 7a10.6 10.6 0 0 0 4.4-1"/></svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="2.6"/></svg>
              }
            </button>
          </div>

          @if (error()) { <div class="err" role="alert">{{error()}}</div> }

          <button class="submit" type="submit" [disabled]="cargando()">
            {{ cargando() ? 'Ingresando…' : 'Iniciar sesión' }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>
          </button>

          <div class="forgot">
            <button type="button" (click)="ayuda.set(!ayuda())" [attr.aria-expanded]="ayuda()">¿Olvidaste tu contraseña?</button>
          </div>

          @if (ayuda()) {
            <p class="help">Comunícate con la oficina de Sistemas para restablecer tu acceso.</p>
          }

          <p class="secure">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-2.5Z"/><path d="m9 12 2 2 4-4"/></svg>
            Sistema seguro y confiable
          </p>
        </form>
      </section>
    </div>
  </div>
  `
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);
  u = '';
  p = '';
  ver = signal(false);
  error = signal('');
  invalido = signal(false);
  cargando = signal(false);
  ayuda = signal(false);
  rol = signal<'estudiante' | 'admin'>('estudiante');

  setRol(r: 'estudiante' | 'admin') {
    this.rol.set(r);
    this.error.set('');
    this.invalido.set(false);
    this.ayuda.set(false);
  }

  entrar() {
    this.cargando.set(true);
    this.error.set('');
    this.invalido.set(false);
    this.ayuda.set(false);

    this.auth.login(this.u, this.p).subscribe({
      next: ok => ok
        ? this.router.navigate(['/'])
        : (this.cargando.set(false), this.error.set('Tu usuario no está vinculado a un estudiante. Pide al administrador que lo asocie (estudianteId).')),
      error: e => {
        this.cargando.set(false);
        this.invalido.set(e.status === 401);
        const mensaje = e?.error?.error?.message;
        this.error.set(
          e.status === 401 ? 'Usuario o contraseña incorrectos' :
          e.status === 503 ? 'El módulo de autenticación no está disponible en el servidor' :
          e.status === 0 ? 'No se pudo conectar con el Gateway (revisa la URL del entorno)' :
          mensaje || 'No se pudo conectar con el servidor'
        );
      }
    });
  }
}
