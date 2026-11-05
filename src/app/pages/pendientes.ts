import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-pendientes',
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Mi plan de estudios</span>
        <h1>Asignaturas pendientes</h1>
        <p>Materias que todavía no has cursado y su contenido temático disponible.</p>
      </div>
    </div>

    @if (msg()) { <div class="err">{{msg()}}</div> }

    <div class="card">
      <div class="card-head">
        <h2>Materias por cursar</h2>
        <span class="badge">{{cargando() ? '—' : pendientes().length + ' pendientes'}}</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Asignatura</th>
              <th class="center">Créditos</th>
              <th class="num">Contenido temático</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando()) {
              <tr>
                <td colspan="4">
                  <div class="empty loading">
                    <strong>Cargando materias…</strong>
                    <span>Revisando tu plan de estudios.</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (m of pendientes(); track m.id) {
                <tr>
                  <td class="mono muted nowrap">{{m.codigo}}</td>
                  <td><b>{{m.nombre}}</b></td>
                  <td class="center tnum">{{m.creditos}}</td>
                  <td>
                    <div class="cell-actions">
                      <button class="btn link sm" (click)="descargar(m.id)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v10"/><path d="m8 10 4 4 4-4"/><path d="M4 19h16"/></svg>
                        Descargar PDF
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4">
                    <div class="empty">
                      <strong>Vas al día</strong>
                      <span>No tienes asignaturas pendientes en tu plan de estudios.</span>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>`
})
export class Pendientes implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  pendientes = signal<any[]>([]); msg = signal(''); cargando = signal(true);

  ngOnInit() {
    forkJoin([this.api.materias(), this.api.detalle(this.auth.estudianteId)]).subscribe({
      next: ([ms, d]) => {
        // Inscripciones solo trae el nombre del curso: se compara por nombre de materia
        const vistas = new Set((d.inscripciones ?? []).filter((i: any) => i.estado !== 'RETIRADA' && i.estado !== 'CANCELADA').map((i: any) => i.curso?.nombre));
        this.pendientes.set(ms.filter(m => !vistas.has(m.nombre)));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.msg.set('No se pudieron cargar tus asignaturas pendientes');
      }
    });
  }

  descargar(materiaId: number) {
    this.msg.set('');
    this.api.archivosMateria(materiaId).subscribe({
      next: a => a.length
        ? this.api.urlArchivoMateria(materiaId, a[0].id).subscribe(r => window.open(r.url, '_blank'))
        : this.msg.set('Esta materia aún no tiene PDF cargado'),
      error: () => this.msg.set('No se pudo obtener el PDF')
    });
  }
}
