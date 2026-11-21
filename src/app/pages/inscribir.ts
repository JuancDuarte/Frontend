import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { cuposDe, inscribible, inscripcionesDe, mensajeInscripcion, nuevaClave } from '../core/consistencia';

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
      <td>{{c.horario}} @if (cruce(c)) { <div class="warn">⚠ Cruce con otra asignatura</div> }</td><td>{{c.periodo}}</td><td>{{cupos(c)}} / {{c.cupo}}</td>
      <td><button class="btn sm" [disabled]="enviando() !== null || !puede(c)" (click)="inscribir(c)">{{enviando() === c.id ? 'Inscribiendo…' : 'Inscribir'}}</button></td></tr>
    } @empty { <tr><td colspan="6" class="muted">No hay cursos ofertados</td></tr> }</tbody></table></div> }`
})
export class Inscribir implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  materias = signal<any[]>([]); cursos = signal<any[]>([]); sel = signal<number | null>(null);
  actuales = signal<string[]>([]); msg = signal(''); ok = signal(false); enviando = signal<number | null>(null);
  ngOnInit() { this.api.materias().subscribe(m => this.materias.set(m)); this.recargar(); }
  recargar() {
    this.api.detalle(this.auth.estudianteId).subscribe(d =>
      this.actuales.set(inscripcionesDe(d).filter((i: any) => i.estado === 'ACTIVA').map((i: any) => i.curso?.horario)));
  }
  elegir(id: number | null) { this.sel.set(id); this.msg.set(''); if (id) this.api.cursos(id).subscribe(c => this.cursos.set(c)); }
  cruce(c: any) { return this.actuales().includes(c.horario); }
  cupos(c: any) { return cuposDe(c); }
  puede(c: any) { return inscribible(c); }
  inscribir(c: any) {
    if (this.enviando() !== null) return;
    this.enviando.set(c.id);
    this.api.inscribir(this.auth.estudianteId, c.id, c.periodo, nuevaClave()).subscribe({
      next: () => { this.enviando.set(null); this.ok.set(true); this.msg.set('Inscripción realizada'); this.recargar(); this.elegir(this.sel()); },
      error: e => { this.enviando.set(null); this.ok.set(false); this.msg.set(mensajeInscripcion(e)); }
    });
  }
}
