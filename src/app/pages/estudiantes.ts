import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';

@Component({
  selector: 'app-estudiantes', imports: [FormsModule, RouterLink],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Administración</span>
        <h1>Estudiantes</h1>
        <p>Busca por nombre y abre la ficha de cada estudiante para consultar su información académica.</p>
      </div>
    </div>

    <div class="bar">
      <input [(ngModel)]="q" type="search" placeholder="Buscar por nombre…" aria-label="Buscar estudiantes" (keyup.enter)="buscar()">
      <button class="btn" (click)="buscar()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
        Buscar
      </button>
    </div>

    @if (error()) { <div class="err">{{error()}}</div> }

    <div class="grid">
      @if (cargando()) {
        <div class="empty loading">
          <strong>Cargando estudiantes…</strong>
          <span>Consultando el listado académico.</span>
        </div>
      } @else {
        @for (e of lista(); track e.id) {
          <a class="tile" [routerLink]="['/estudiantes', e.id]">
            @if (e.fotoUrl) {
              <img class="avatar" [src]="e.fotoUrl" [alt]="'Foto de ' + (e.nombre ?? e.firstName)">
            } @else {
              <div class="avatar" aria-hidden="true">{{ini(e)}}</div>
            }
            <div class="t">
              <b>{{e.nombre ?? (e.firstName + ' ' + e.lastName)}}</b>
              <div class="muted">{{e.programa}}</div>
              <span class="badge" [class.s-ok]="activo(e)" [class.s-warn]="!activo(e)">{{estado(e)}}</span>
            </div>
          </a>
        } @empty {
          <div class="empty">
            <strong>Sin resultados</strong>
            <span>Prueba con otro nombre o revisa la ortografía.</span>
          </div>
        }
      }
    </div>

    <div class="pag">
      <button class="btn out sm" [disabled]="page() <= 1" (click)="ir(-1)">Anterior</button>
      <span>Página {{page()}}</span>
      <button class="btn out sm" [disabled]="lista().length < 12" (click)="ir(1)">Siguiente</button>
    </div>
  </div>`
})
export class Estudiantes implements OnInit {
  private api = inject(Api);
  lista = signal<any[]>([]); page = signal(1); error = signal(''); q = ''; cargando = signal(true);

  ngOnInit() { this.cargar(); }
  buscar() { this.page.set(1); this.cargar(); }
  ir(d: number) { this.page.update(p => p + d); this.cargar(); }
  cargar() {
    this.cargando.set(true);
    this.api.estudiantes(this.page(), this.q).subscribe({
      next: l => { this.lista.set(l); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.error.set('No se pudo cargar el listado'); }
    });
  }
  ini(e: any) { return ((e.firstName?.[0] ?? e.nombre?.[0] ?? '') + (e.lastName?.[0] ?? '')).toUpperCase(); }
  activo(e: any) { return /^(active|activo|matriculado)$/i.test(String(e.status ?? '')); }
  estado(e: any) { return this.activo(e) ? 'Matriculado' : (String(e.status ?? '').trim() || 'Inactivo'); }
}
