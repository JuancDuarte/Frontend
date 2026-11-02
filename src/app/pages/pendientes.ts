import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-pendientes',
  template: `<h1>Asignaturas Pendientes</h1>
  @if (msg()) { <div class="err">{{msg()}}</div> }
  <div class="card"><h3>Asignaturas Pendientes</h3><table><thead><tr><th>Código</th><th>Asignatura</th><th>Créditos</th><th>Contenido temático</th></tr></thead><tbody>
  @for (m of pendientes(); track m.id) {
    <tr><td>{{m.codigo}}</td><td>{{m.nombre}}</td><td>{{m.creditos}}</td>
    <td><button class="btn sm" (click)="descargar(m.id)">Descargar PDF</button></td></tr>
  } @empty { <tr><td colspan="4" class="muted">No tienes asignaturas pendientes</td></tr> }</tbody></table></div>`
})
export class Pendientes implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  pendientes = signal<any[]>([]); msg = signal('');
  ngOnInit() {
    forkJoin([this.api.materias(), this.api.detalle(this.auth.estudianteId)]).subscribe(([ms, d]) => {
      // Inscripciones solo trae el nombre del curso: se compara por nombre de materia
      const vistas = new Set((d.inscripciones ?? []).filter((i: any) => i.estado !== 'RETIRADA').map((i: any) => i.curso?.nombre));
      this.pendientes.set(ms.filter(m => !vistas.has(m.nombre)));
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
