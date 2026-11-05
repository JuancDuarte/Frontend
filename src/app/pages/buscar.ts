import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

const norm = (s: string) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

@Component({
  selector: 'app-buscar', imports: [FormsModule],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Inscripciones</span>
        <h1>Buscar cursos</h1>
        <p>Filtra por programa, asignatura, día y franja horaria para encontrar el curso que necesitas.</p>
      </div>
    </div>

    <div class="card">
      <div class="filters">
        <div class="f">
          <label for="programa">Programa</label>
          <select id="programa" [(ngModel)]="programa">
            <option value="">Todos los programas</option>
            @for (p of programas(); track p) { <option [value]="p">{{p}}</option> }
          </select>
        </div>

        <div class="f grow">
          <label for="texto">Asignatura</label>
          <input id="texto" type="search" [(ngModel)]="texto" placeholder="Mínimo 4 caracteres…" (keyup.enter)="buscar()">
        </div>

        <div class="f">
          <label for="dia">Día</label>
          <select id="dia" [(ngModel)]="dia">
            <option value="">Todos los días</option>
            @for (d of dias; track d) { <option [value]="d">{{d}}</option> }
          </select>
        </div>

        <div class="f range">
          <label>Franja horaria</label>
          <div class="row">
            <input type="range" min="6" max="22" [(ngModel)]="desde" (ngModelChange)="hasta = hasta < desde ? desde : hasta" aria-label="Hora inicial">
            <output>{{desde}}:00</output>
            <span class="muted">a</span>
            <input type="range" min="6" max="22" [(ngModel)]="hasta" (ngModelChange)="desde = desde > hasta ? hasta : desde" aria-label="Hora final">
            <output>{{hasta}}:00</output>
          </div>
        </div>

        <button class="btn" (click)="buscar()" [disabled]="buscando()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
          {{buscando() ? 'Buscando…' : 'Buscar'}}
        </button>
      </div>
    </div>

    @if (msg()) { <div [class]="ok() ? 'ok' : 'err'">{{msg()}}</div> }

    @if (buscado()) {
      <div class="card">
        <div class="card-head">
          <h2>Cursos encontrados</h2>
          <span class="badge">{{resultados().length}} resultados</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Asignatura</th>
                <th class="center">Créditos</th>
                <th>Docente</th>
                <th>Horario</th>
                <th>Periodo</th>
                <th class="center">Cupo</th>
                <th class="num">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (c of resultados(); track c.id) {
                <tr>
                  <td class="mono muted nowrap">{{c.materia.codigo}}</td>
                  <td><b>{{c.materia.nombre}}</b></td>
                  <td class="center tnum">{{c.materia.creditos}}</td>
                  <td>{{c.docente?.nombre ?? c.docenteNombre ?? '—'}}</td>
                  <td>
                    <span class="nowrap">{{c.horario}}</span>
                    @if (cruce(c)) {
                      <div class="warn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8v5M12 17h.01"/><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
                        Cruce de horario
                      </div>
                    }
                  </td>
                  <td class="mono nowrap">{{c.periodo}}</td>
                  <td class="center">
                    @if (c.cupo > 0) {
                      <span class="badge" [class.s-warn]="c.cupo <= 3">{{c.cupo}}</span>
                    } @else {
                      <span class="badge s-danger">Agotado</span>
                    }
                  </td>
                  <td>
                    <div class="cell-actions">
                      <button class="btn sm" [disabled]="c.cupo <= 0" (click)="inscribir(c)">{{c.cupo > 0 ? 'Inscribir' : 'Sin cupo'}}</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8">
                    <div class="empty">
                      <strong>Sin cursos</strong>
                      <span>No se encontraron cursos con esos criterios. Prueba ampliando la franja horaria o el día.</span>
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
    this.api.inscribir(c.id, c.periodo).subscribe({
      next: () => { this.ok.set(true); this.msg.set(`Inscrito en ${c.materia.nombre}`); this.recargar(); this.buscar(); },
      error: e => { this.ok.set(false); this.msg.set(e.error?.error?.message ?? e.error?.mensaje ?? e.error?.message ?? 'No se pudo inscribir'); }
    });
  }
}
