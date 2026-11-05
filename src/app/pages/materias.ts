import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-materias', imports: [FormsModule],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Catálogo</span>
        <h1>Materias</h1>
        <p>Explora las asignaturas disponibles y descarga el contenido temático en PDF.</p>
      </div>
    </div>

    <div class="bar">
      <input [(ngModel)]="q" type="search" placeholder="Buscar por nombre o código…" aria-label="Buscar materias" (keyup.enter)="buscar()">
      <button class="btn" (click)="buscar()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
        Buscar
      </button>
    </div>

    @if (msg()) { <div [class]="ok() ? 'ok' : 'err'">{{msg()}}</div> }

    <div class="card">
      <div class="card-head">
        <h2>Catálogo de materias</h2>
        <span class="badge">{{cargando() ? '—' : lista().length + ' en esta página'}}</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th class="center">Créditos</th>
              <th>Programa</th>
              <th class="num">Contenido</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando()) {
              <tr>
                <td colspan="5">
                  <div class="empty loading">
                    <strong>Cargando materias…</strong>
                    <span>Consultando el catálogo académico.</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (m of lista(); track m.id) {
                <tr>
                  <td class="mono muted nowrap">{{m.codigo}}</td>
                  <td><b>{{m.nombre}}</b></td>
                  <td class="center tnum">{{m.creditos}}</td>
                  <td>{{m.programa}}</td>
                  <td>
                    <div class="cell-actions">
                      <button class="btn link sm" (click)="descargar(m.id)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v10"/><path d="m8 10 4 4 4-4"/><path d="M4 19h16"/></svg>
                        Descargar
                      </button>

                      @if (auth.esAdmin) {
                        <input #f type="file" accept="application/pdf" hidden (change)="subir(m.id, f.files)">
                        <button class="btn sm" (click)="f.click()">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V10"/><path d="m8 14 4-4 4 4"/><path d="M4 5h16"/></svg>
                          Subir PDF
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">
                    <div class="empty">
                      <strong>Sin materias</strong>
                      <span>No hay resultados para esa búsqueda. Prueba con otro nombre o código.</span>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="pag">
      <button class="btn out sm" [disabled]="page() === 0" (click)="ir(-1)">Anterior</button>
      <span>Página {{page() + 1}}</span>
      <button class="btn out sm" [disabled]="lista().length < 12" (click)="ir(1)">Siguiente</button>
    </div>
  </div>`
})
export class Materias implements OnInit {
  private api = inject(Api); auth = inject(Auth);
  lista = signal<any[]>([]); page = signal(0); q = ''; msg = signal(''); ok = signal(false); cargando = signal(true);

  ngOnInit() { this.cargar(); }
  buscar() { this.page.set(0); this.cargar(); }
  ir(d: number) { this.page.update(p => p + d); this.cargar(); }
  cargar() {
    this.cargando.set(true);
    this.api.materiasPag(this.page(), this.q).subscribe({
      next: l => { this.lista.set(l); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.ok.set(false); this.msg.set('No se pudo cargar el catálogo'); }
    });
  }

  descargar(id: number) {
    this.msg.set('');
    this.api.pdfUrl(id).subscribe({
      next: u => u ? window.open(u, '_blank') : (this.ok.set(false), this.msg.set('Esta materia aún no tiene PDF')),
      error: () => { this.ok.set(false); this.msg.set('No se pudo obtener el PDF'); }
    });
  }

  subir(id: number, files: FileList | null) {
    const f = files?.[0]; if (!f) return;
    if (f.type !== 'application/pdf') { this.ok.set(false); return this.msg.set('Solo PDF'); }
    if (f.size > 10 * 1024 * 1024) { this.ok.set(false); return this.msg.set('Máximo 10 MB'); }
    this.api.subirPdf(id, f).subscribe({
      next: () => { this.ok.set(true); this.msg.set('PDF cargado'); },
      error: () => { this.ok.set(false); this.msg.set('No se pudo subir el PDF'); }
    });
  }
}
