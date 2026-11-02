import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-notas',
  template: `<h1>Asignaturas Inscritas {{periodo()}}</h1>
  @if (error()) { <div class="err">{{error()}}</div> }
  <div class="card"><h3>Asignaturas Inscritas</h3><div style="overflow-x:auto"><table><thead><tr>
    <th>Código<br>Asignatura</th><th>Nombre Asignatura</th><th>Nro<br>Créditos</th><th>Grupo</th><th>Profesor</th><th>Primer<br>Cincuenta</th><th>Segundo<br>Cincuenta</th><th>Nota<br>Final</th></tr></thead><tbody>
  @for (i of inscripciones(); track i.id) {
    <tr><td>{{i.curso?.materiaCodigo ?? i.curso?.codigo ?? i.curso?.id}}</td><td>{{i.curso?.nombre?.toUpperCase()}}</td><td>{{i.curso?.creditos ?? '—'}}</td><td>{{i.curso?.grupo ?? '—'}}</td>
    <td>{{i.curso?.docente?.nombre?.toUpperCase()}}</td><td>{{nota(i.notas, 1)}}</td><td>{{nota(i.notas, 2)}}</td><td>{{final(i.notas)}}</td></tr>
  } @empty { <tr><td colspan="8" class="muted">Sin asignaturas inscritas</td></tr> }</tbody></table></div></div>`
})
export class Notas implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  inscripciones = signal<any[]>([]); periodo = signal(''); error = signal('');
  ngOnInit() {
    this.api.detalle(this.auth.estudianteId).subscribe({
      next: d => {
        const all: any[] = (d.inscripciones ?? []).filter((i: any) => i.estado !== 'RETIRADA');
        const per = all.map(i => i.periodo).sort().pop() ?? '';
        const [anio, sem] = per.split('-');
        this.periodo.set(per ? `${sem === '1' ? 'PRIMER' : 'SEGUNDO'} SEMESTRE DE ${anio}` : '');
        this.inscripciones.set(all.filter(i => i.periodo === per));
      }, error: () => this.error.set('No se pudieron cargar las asignaturas')
    });
  }
  /** Primer/segundo cincuenta: nota cuyo tipo contiene 1/2 (ej. "Parcial 1"). AJUSTAR a los tipos reales. */
  private v(n: any[], k: 1 | 2): number | null {
    const x = (n ?? []).find(t => (k === 1 ? /1|primer/i : /2|segund/i).test(t.tipo)); return x ? x.valor : null;
  }
  nota(n: any[], k: 1 | 2) { const x = this.v(n, k); return x === null ? '' : x.toFixed(1); }
  /** Igual que el portal: cada cincuenta pesa 50 %, lo no calificado cuenta 0 */
  final(n: any[]) {
    if (this.v(n, 1) === null && this.v(n, 2) === null) return '';
    return (Math.round(((this.v(n, 1) ?? 0) + (this.v(n, 2) ?? 0)) * 5) / 10).toFixed(1);
  }
}
