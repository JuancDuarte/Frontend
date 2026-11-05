import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

const norm = (s: string) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
/** Cuando una materia aparece varias veces en el mismo periodo, gana el estado más "real". */
const PRIORIDAD: Record<string, number> = { ACTIVA: 4, FINALIZADA: 3, CANCELADA: 2, RETIRADA: 1 };

@Component({
  selector: 'app-notas',
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Mi semestre</span>
        <h1>Asignaturas inscritas</h1>
        <p>{{periodo() || 'Periodo académico actual'}}. Consulta el avance y las calificaciones de cada asignatura.</p>
      </div>

      <div class="metrics">
        <div class="metric">
          <span class="label">Asignaturas</span>
          <span class="value">{{inscripciones().length}}</span>
          <span class="hint">En el periodo actual</span>
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/></svg>
          </span>
        </div>

        <div class="metric">
          <span class="label">Créditos</span>
          <span class="value">{{creditos()}}</span>
          <span class="hint">Matriculados</span>
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="m8.5 13.5-1 7 4.5-2.5 4.5 2.5-1-7"/></svg>
          </span>
        </div>

        <div class="metric">
          <span class="label">Promedio</span>
          <span class="value">{{promedio() ?? '—'}}<span> / 5.0</span></span>
          <span class="hint">Notas definitivas</span>
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 2.5 5-6"/></svg>
          </span>
        </div>
      </div>
    </div>

    @if (error()) { <div class="err">{{error()}}</div> }

    <div class="card">
      <div class="card-head">
        <h2>Notas del semestre</h2>
        @if (periodoCodigo()) { <span class="badge">{{periodoCodigo()}}</span> }
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Asignatura</th>
              <th class="center">Créditos</th>
              <th>Docente</th>
              <th class="center">Primer 50 %</th>
              <th class="center">Segundo 50 %</th>
              <th class="center">Nota final</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando()) {
              <tr>
                <td colspan="7">
                  <div class="empty loading">
                    <strong>Cargando asignaturas…</strong>
                    <span>Consultando tus notas del periodo.</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (i of inscripciones(); track i.curso?.id ?? i.id) {
                <tr>
                  <td class="mono muted nowrap">{{i.codigo}}</td>
                  <td>
                    <b>{{i.curso?.nombre}}</b>
                    @if (i.estado === 'FINALIZADA') { <span class="badge s-ok">Finalizada</span> }
                  </td>
                  <td class="center tnum">{{i.credito ?? '—'}}</td>
                  <td>{{i.curso?.docente?.nombre ?? '—'}}</td>
                  <td class="center tnum">{{nota(i.notas, 1) || '—'}}</td>
                  <td class="center tnum">{{nota(i.notas, 2) || '—'}}</td>
                  <td class="center tnum"><b>{{final(i.notas) || '—'}}</b></td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="empty">
                      <strong>Sin asignaturas inscritas</strong>
                      <span>Cuando te inscribas en cursos aparecerán aquí con sus notas.</span>
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
export class Notas implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  inscripciones = signal<any[]>([]); periodo = signal(''); periodoCodigo = signal(''); error = signal('');
  cargando = signal(true);

  ngOnInit() {
    forkJoin({ materias: this.api.materias(), detalle: this.api.detalle(this.auth.estudianteId) }).subscribe({
      next: ({ materias, detalle }) => {
        // Catálogo de materias para recuperar código y créditos (el curso solo trae el nombre).
        const porNombre = new Map<string, any>(materias.map((m: any) => [norm(m.nombre), m]));

        // Historial sin retiradas ni canceladas.
        const validas: any[] = (detalle.inscripciones ?? [])
          .filter((i: any) => i.estado !== 'RETIRADA' && i.estado !== 'CANCELADA');

        const per = validas.map(i => i.periodo).sort().pop() ?? '';
        const [anio, sem] = per.split('-');
        this.periodoCodigo.set(per);
        this.periodo.set(per ? `${sem === '1' ? 'Primer' : 'Segundo'} semestre de ${anio}` : '');

        // Una fila por asignatura: si hay varias inscripciones (ACTIVA/FINALIZADA...) se queda la de mayor prioridad.
        const unicas = new Map<string, any>();
        for (const i of validas.filter(i => i.periodo === per)) {
          const clave = norm(i.curso?.nombre) || String(i.curso?.id ?? i.id);
          const previa = unicas.get(clave);
          if (!previa || (PRIORIDAD[i.estado] ?? 0) > (PRIORIDAD[previa.estado] ?? 0)) unicas.set(clave, i);
        }

        const filas = [...unicas.values()].map(i => {
          const materia = porNombre.get(norm(i.curso?.nombre));
          return { ...i, codigo: materia?.codigo ?? '—', credito: materia?.creditos ?? null };
        }).sort((a, b) => String(a.curso?.nombre ?? '').localeCompare(String(b.curso?.nombre ?? ''), 'es'));

        this.inscripciones.set(filas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudieron cargar las asignaturas');
      }
    });
  }

  creditos() { return this.inscripciones().reduce((t, i) => t + Number(i.credito ?? 0), 0); }
  promedio() {
    const vals = this.inscripciones().map(i => this.finalNum(i.notas)).filter((v): v is number => v !== null);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  }
  /** Primer/segundo cincuenta: nota cuyo tipo contiene 1/2 (ej. "Parcial 1"). AJUSTAR a los tipos reales. */
  private v(n: any[], k: 1 | 2): number | null {
    const x = (n ?? []).find(t => (k === 1 ? /1|primer/i : /2|segund/i).test(t.tipo)); return x ? x.valor : null;
  }
  private finalNum(n: any[]): number | null {
    if (this.v(n, 1) === null && this.v(n, 2) === null) return null;
    return Math.round(((this.v(n, 1) ?? 0) + (this.v(n, 2) ?? 0)) * 5) / 10;
  }
  nota(n: any[], k: 1 | 2) { const x = this.v(n, k); return x === null ? '' : x.toFixed(1); }
  /** Igual que el portal: cada cincuenta pesa 50 %, lo no calificado cuenta 0 */
  final(n: any[]) { const f = this.finalNum(n); return f === null ? '' : f.toFixed(1); }
}
