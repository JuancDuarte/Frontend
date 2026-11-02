import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

const norm = (s: string) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

@Component({
  selector: 'app-buscar', imports: [FormsModule],
  styles: [`.p{padding:24px;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-end}select,input[type=text]{padding:10px 4px;border:0;border-bottom:1px solid #999;background:none;font-size:15px;min-width:200px}
  .or{background:#ff9800;box-shadow:0 2px 6px #0004}.rng{display:flex;flex-direction:column;font-size:17px;min-width:260px}`],
  template: `<h1>Buscar Cursos</h1>
  <div class="card"><div class="p">
    <select [(ngModel)]="programa"><option value="">todos los Programas</option>@for (p of programas(); track p) { <option [value]="p">{{p}}</option> }</select>
    <input type="text" [(ngModel)]="texto" placeholder="* Ingrese mínimo 4 caracteres." (keyup.enter)="buscar()">
    <select [(ngModel)]="dia"><option value="">todos los días</option>@for (d of dias; track d) { <option [value]="d">{{d}}</option> }</select>
    <div class="rng">Programada entre las: {{desde}}:00 y las {{hasta}}:00 horas
      <span><input type="range" min="6" max="22" [(ngModel)]="desde" (ngModelChange)="hasta = hasta < desde ? desde : hasta">
      <input type="range" min="6" max="22" [(ngModel)]="hasta" (ngModelChange)="desde = desde > hasta ? hasta : desde"></span></div>
    <button class="btn or" (click)="buscar()" [disabled]="buscando()">🔍 Buscar</button></div>
    @if (msg()) { <div [class]="ok() ? 'ok' : 'err'" style="padding:0 24px 16px">{{msg()}}</div> }</div>
  @if (buscado()) { <div class="card"><h3>Cursos encontrados</h3><div style="overflow-x:auto"><table><thead><tr><th>Código</th><th>Asignatura</th><th>Créditos</th><th>Docente</th><th>Horario</th><th>Periodo</th><th>Cupo</th><th></th></tr></thead><tbody>
    @for (c of resultados(); track c.id) {
      <tr><td>{{c.materia.codigo}}</td><td>{{c.materia.nombre}}</td><td>{{c.materia.creditos}}</td><td>{{c.docente?.nombre ?? c.docenteNombre}}</td>
      <td>{{c.horario}} @if (cruce(c)) { <div class="warn">⚠ Cruce con otra asignatura</div> }</td><td>{{c.periodo}}</td><td>{{c.cupo}}</td>
      <td><button class="btn sm" [disabled]="c.cupo <= 0" (click)="inscribir(c)">Inscribir</button></td></tr>
    } @empty { <tr><td colspan="8" class="muted">No se encontraron cursos con esos criterios</td></tr> }</tbody></table></div></div> }`
})
export class Buscar implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  programas = signal<string[]>([]); resultados = signal<any[]>([]); actuales = signal<string[]>([]);
  programa = ''; texto = ''; dia = ''; desde = 6; hasta = 22;
  buscando = signal(false); buscado = signal(false); msg = signal(''); ok = signal(false);

  ngOnInit() {
    this.api.materias().subscribe(m => this.programas.set([...new Set(m.map(x => x.programa).filter(Boolean))] as string[]));
    this.recargar();
  }
  recargar() {
    this.api.detalle(this.auth.estudianteId).subscribe(d =>
      this.actuales.set((d.inscripciones ?? []).filter((i: any) => i.estado === 'ACTIVA').map((i: any) => i.curso?.horario)));
  }
  buscar() {
    if (this.texto.trim().length < 4) { this.ok.set(false); return this.msg.set('Ingrese mínimo 4 caracteres'); }
    this.msg.set(''); this.buscando.set(true);
    this.api.buscarMaterias(this.texto.trim(), this.programa).pipe(
      switchMap(ms => ms.length
        ? forkJoin(ms.map(m => this.api.cursos(m.id).pipe(catchError(() => of([])), map(cs => cs.map(c => ({ ...c, materia: m }))))))
        : of([] as any[][])),
      map(g => g.flat().filter(c => this.pasaFiltros(c)))
    ).subscribe({
      next: r => { this.resultados.set(r); this.buscado.set(true); this.buscando.set(false); },
      error: () => { this.buscando.set(false); this.ok.set(false); this.msg.set('No se pudo realizar la búsqueda'); }
    });
  }
  /** Horario esperado como "Lunes-Miércoles 6:00-8:00" */
  private pasaFiltros(c: any) {
    const h: string = c.horario ?? '';
    if (this.dia && !norm(h).includes(norm(this.dia))) return false;
    const m = h.match(/(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}/);
    return m ? +m[1] >= this.desde && +m[2] <= this.hasta : true;
  }
  cruce(c: any) { return this.actuales().includes(c.horario); }
  inscribir(c: any) {
    this.api.inscribir(this.auth.estudianteId, c.id, c.periodo).subscribe({
      next: () => { this.ok.set(true); this.msg.set(`Inscrito en ${c.materia.nombre}`); this.recargar(); this.buscar(); },
      error: e => { this.ok.set(false); this.msg.set(e.error?.message ?? 'No se pudo inscribir'); }
    });
  }
}
