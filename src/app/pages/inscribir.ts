import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-inscribir', imports: [FormsModule],
  template: `<h1>Inscribir Asignaturas</h1>
  <div class="card" style="padding:18px"><label>Asignatura: </label>
    <select [ngModel]="sel()" (ngModelChange)="elegir($event)" style="padding:8px;min-width:320px">
      <option [ngValue]="null">— Selecciona —</option>
      @for (m of materias(); track m.id) { <option [ngValue]="m.id">{{m.codigo}} · {{m.nombre}}</option> }</select>
    @if (msg()) { <div [class]="ok() ? 'ok' : 'err'">{{msg()}}</div> }</div>
  @if (sel()) { <div class="card"><h3>Cursos disponibles</h3><table><thead><tr><th>Curso</th><th>Docente</th><th>Horario</th><th>Periodo</th><th>Cupo</th><th></th></tr></thead><tbody>
    @for (c of cursos(); track c.id) {
      <tr><td>{{c.id}}</td><td>{{c.docente?.nombre ?? c.docenteNombre}}</td>
      <td>{{c.horario}} @if (cruce(c)) { <div class="warn">⚠ Cruce con otra asignatura</div> }</td><td>{{c.periodo}}</td><td>{{c.cupo}}</td>
      <td><button class="btn sm" [disabled]="c.cupo <= 0" (click)="inscribir(c)">Inscribir</button></td></tr>
    } @empty { <tr><td colspan="6" class="muted">No hay cursos ofertados</td></tr> }</tbody></table></div> }`
})
export class Inscribir implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  materias = signal<any[]>([]); cursos = signal<any[]>([]); sel = signal<number | null>(null);
  actuales = signal<string[]>([]); msg = signal(''); ok = signal(false);
  ngOnInit() { this.api.materias().subscribe(m => this.materias.set(m)); this.recargar(); }
  recargar() {
    this.api.detalle(this.auth.estudianteId).subscribe(d =>
      this.actuales.set((d.inscripciones ?? []).filter((i: any) => i.estado === 'ACTIVA').map((i: any) => i.curso?.horario)));
  }
  elegir(id: number | null) { this.sel.set(id); this.msg.set(''); if (id) this.api.cursos(id).subscribe(c => this.cursos.set(c)); }
  cruce(c: any) { return this.actuales().includes(c.horario); }
  inscribir(c: any) {
    this.api.inscribir(this.auth.estudianteId, c.id, c.periodo).subscribe({
      next: () => { this.ok.set(true); this.msg.set('Inscripción realizada'); this.recargar(); this.elegir(this.sel()); },
      error: e => { this.ok.set(false); this.msg.set(e.error?.message ?? 'No se pudo inscribir'); }
    });
  }
}
