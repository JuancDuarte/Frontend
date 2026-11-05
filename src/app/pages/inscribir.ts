import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

const norm = (s: string) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-inscribir', imports: [FormsModule],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Inscripciones</span>
        <h1>Inscribir asignaturas</h1>
        <p>{{periodoTexto() || 'Periodo académico actual'}}. Solo se ofrecen materias que aún no has cursado.</p>
      </div>

      <div class="metrics">
        <div class="metric">
          <span class="label">Habilitadas</span>
          <span class="value">{{materias().length}}</span>
          <span class="hint">Materias disponibles</span>
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M8 7h8M8 10.5h6"/></svg>
          </span>
        </div>

        <div class="metric">
          <span class="label">Con cupo</span>
          <span class="value">{{conCupo()}}</span>
          <span class="hint">Cursos ofertados</span>
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 19v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V19"/><circle cx="9.5" cy="7" r="3.2"/><path d="M21 19v-1.5a4 4 0 0 0-3-3.87"/><path d="M15.5 4.2a3.2 3.2 0 0 1 0 5.6"/></svg>
          </span>
        </div>

        <div class="metric">
          <span class="label">Créditos</span>
          <span class="value">{{creditos()}}</span>
          <span class="hint">Ya inscritos</span>
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="m8.5 13.5-1 7 4.5-2.5 4.5 2.5-1-7"/></svg>
          </span>
        </div>
      </div>
    </div>

    @if (msg()) { <div [class]="ok() ? 'ok' : 'err'">{{msg()}}</div> }

    @if (cargando()) {
      <div class="card">
        <div class="empty">
          <strong>Cargando oferta académica…</strong>
          <span>Consultando las materias que puedes inscribir.</span>
        </div>
      </div>
    } @else {
      <div class="card">
        <div class="card-body tight">
          <div class="filters" style="padding:0">
            <div class="f" style="min-width:280px;flex:1 1 320px">
              <label for="materia">Filtrar por asignatura</label>
              <select id="materia" [ngModel]="sel()" (ngModelChange)="sel.set($event)">
                <option [ngValue]="null">Todas las disponibles</option>
                @for (m of materias(); track m.id) { <option [ngValue]="m.id">{{m.codigo}} · {{m.nombre}}</option> }
              </select>
            </div>
            <div class="hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>
              Las materias que ya cursaste (activas o finalizadas) no aparecen en la lista.
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2>Cursos ofertados</h2>
          <span class="badge">{{visibles().length}} {{visibles().length === 1 ? 'curso' : 'cursos'}}</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asignatura</th>
                <th class="center">Créditos</th>
                <th>Docente</th>
                <th>Horario</th>
                <th class="center">Cupo</th>
                <th class="num">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (c of visibles(); track c.id) {
                <tr>
                  <td>
                    <b>{{c.materia?.nombre}}</b>
                    <span class="sub mono">{{c.materia?.codigo}}</span>
                  </td>
                  <td class="center tnum">{{c.materia?.creditos}}</td>
                  <td>{{c.docenteNombre ?? c.docente?.nombre ?? '—'}}</td>
                  <td>
                    <span class="nowrap">{{c.horario}}</span>
                    @if (aviso(c); as texto) {
                      <div class="warn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8v5M12 17h.01"/><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
                        {{texto}}
                      </div>
                    }
                  </td>
                  <td class="center">
                    @if (c.cupo > 0) {
                      <span class="badge" [class.s-warn]="c.cupo <= 3">{{c.cupo}}</span>
                    } @else {
                      <span class="badge s-danger">Agotado</span>
                    }
                  </td>
                  <td>
                    <div class="cell-actions">
                      <button class="btn sm" [disabled]="c.cupo <= 0 || guardando() !== null" (click)="inscribir(c)">
                        {{guardando() === c.id ? 'Inscribiendo…' : (c.cupo > 0 ? 'Inscribir' : 'Sin cupo')}}
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      <strong>Sin cursos disponibles</strong>
                      <span>Ya cursaste todas las materias ofertadas en este periodo.</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  </div>`
})
export class Inscribir implements OnInit {
  private api = inject(Api); private auth = inject(Auth);

  materias = signal<any[]>([]);          // materias que aún no ha cursado y que tienen oferta
  cursos = signal<any[]>([]);            // cursos ofertados en el periodo
  ocupados = signal<{ nombre: string; horario: string }[]>([]);
  periodo = signal('');
  sel = signal<number | null>(null);
  msg = signal(''); ok = signal(false);
  cargando = signal(true); guardando = signal<number | null>(null);
  creditos = signal(0);

  ngOnInit() { this.recargar(); }

  private recargar() {
    this.cargando.set(true);
    forkJoin({ materias: this.api.materias(), detalle: this.api.detalle(this.auth.estudianteId) }).subscribe({
      next: ({ materias, detalle }) => {
        const inscripciones: any[] = detalle.inscripciones ?? [];
        const per = inscripciones.map(i => i.periodo).sort().pop() ?? '';

        // Inscripciones vigentes del periodo: sirven para detectar cruces de horario.
        const activas = inscripciones.filter(i => i.periodo === per && i.estado === 'ACTIVA');
        this.ocupados.set(activas.filter(i => i.curso?.horario).map(i => ({ nombre: i.curso?.nombre, horario: i.curso.horario })));

        // "Vistas" = materias ya cursadas (ACTIVA o FINALIZADA en cualquier periodo).
        // Retiradas y canceladas no cuentan como cursadas.
        const vistas = new Set(inscripciones
          .filter(i => i.estado === 'ACTIVA' || i.estado === 'FINALIZADA')
          .map(i => norm(i.curso?.nombre)));
        const disponibles = materias.filter((m: any) => !vistas.has(norm(m.nombre)));

        // Créditos del periodo: una sola fila por asignatura, igual que en la página de notas.
        const porNombre = new Map<string, any>(materias.map((m: any) => [norm(m.nombre), m]));
        const delPeriodo = new Map<string, any>();
        for (const i of inscripciones.filter(i => i.periodo === per && (i.estado === 'ACTIVA' || i.estado === 'FINALIZADA'))) {
          const clave = norm(i.curso?.nombre) || String(i.curso?.id ?? i.id);
          if (!delPeriodo.has(clave) || i.estado === 'ACTIVA') delPeriodo.set(clave, i);
        }
        this.creditos.set([...delPeriodo.values()]
          .reduce((t, i) => t + Number(porNombre.get(norm(i.curso?.nombre))?.creditos ?? 0), 0));

        this.api.cursosPeriodo(per || undefined).subscribe({
          next: cs => {
            // Si el estudiante no tiene historial, se toma el periodo más reciente de la oferta.
            const periodo = per || cs.map((c: any) => c.periodo).sort().pop() || '';
            this.periodo.set(periodo);

            const ofertados = cs.filter((c: any) => c.periodo === periodo);
            const ofertadas = new Set(ofertados.map((c: any) => c.materiaId));
            const lista = disponibles.filter((m: any) => ofertadas.has(m.id));
            this.materias.set(lista);
            if (this.sel() && !lista.some((m: any) => m.id === this.sel())) this.sel.set(null);

            const catalogo = new Map<number, any>(materias.map((m: any) => [m.id, m]));
            this.cursos.set(ofertados
              .filter((c: any) => lista.some((m: any) => m.id === c.materiaId))
              .map((c: any) => ({ ...c, materia: catalogo.get(c.materiaId) }))
              .sort((a, b) => String(a.materia?.nombre ?? '').localeCompare(String(b.materia?.nombre ?? ''), 'es') || a.id - b.id));
            this.cargando.set(false);
          },
          error: () => { this.cargando.set(false); this.ok.set(false); this.msg.set('No se pudo cargar la oferta de cursos'); }
        });
      },
      error: () => { this.cargando.set(false); this.ok.set(false); this.msg.set('No se pudo cargar tu información académica'); }
    });
  }

  visibles() { const s = this.sel(); return s ? this.cursos().filter(c => c.materiaId === s) : this.cursos(); }
  conCupo() { return this.cursos().filter(c => Number(c.cupo) > 0).length; }

  aviso(c: any): string | null {
    const choque = this.cruce(c);
    return choque ? `Cruce con ${choque}` : null;
  }

  periodoTexto() {
    const p = this.periodo(); const [anio, sem] = p.split('-');
    return p ? `${sem === '1' ? 'Primer' : 'Segundo'} semestre de ${anio}` : '';
  }

  inscribir(c: any) {
    if (this.guardando() !== null) return;
    this.msg.set(''); this.guardando.set(c.id);
    this.api.inscribir(c.id, c.periodo || this.periodo()).subscribe({
      next: () => {
        this.guardando.set(null); this.ok.set(true);
        this.msg.set(`Inscripción realizada en ${c.materia?.nombre ?? 'la asignatura'}.`);
        this.recargar();
      },
      error: e => {
        this.guardando.set(null); this.ok.set(false);
        this.msg.set(e.error?.error?.message ?? e.error?.mensaje ?? e.error?.message ?? 'No se pudo completar la inscripción');
      }
    });
  }

  /** "Lunes-Miércoles 6:00-8:00" → días + rango en minutos. */
  private parse(h: string) {
    const m = String(h ?? '').match(/^(.*?)\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return {
      dias: norm(m[1]).split(/[^a-z]+/).filter(d => d.length > 2),
      ini: +m[2] * 60 + +m[3],
      fin: +m[4] * 60 + +m[5]
    };
  }

  private cruce(c: any): string | null {
    const a = this.parse(c.horario); if (!a) return null;
    for (const o of this.ocupados()) {
      const b = this.parse(o.horario); if (!b) continue;
      if (a.dias.some(d => b.dias.includes(d)) && a.ini < b.fin && b.ini < a.fin) return o.nombre;
    }
    return null;
  }
}
