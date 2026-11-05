import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-detalle', imports: [RouterLink],
  template: `
  <div class="page">
    @if (auth.esAdmin) {
      <a class="back" routerLink="/estudiantes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
        Volver al listado
      </a>
    }

    <div class="page-head">
      <div>
        <span class="eyebrow">Ficha académica</span>
        <h1>Detalle del estudiante</h1>
        <p>Información personal e historial de inscripciones del estudiante.</p>
      </div>
    </div>

    @if (error()) { <div class="err">{{error()}}</div> }

    @if (d(); as d) {
      <div class="card">
        <div class="profile">
          <div class="photo-col">
            @if (d.estudiante?.fotoUrl ?? d.fotoUrl) {
              <img class="photo" [src]="d.estudiante?.fotoUrl ?? d.fotoUrl" alt="Foto del estudiante">
            } @else {
              <div class="photo" aria-hidden="true">{{(d.estudiante?.firstName?.[0] ?? '') + (d.estudiante?.lastName?.[0] ?? '')}}</div>
            }

            @if (auth.esAdmin || auth.estudianteId === id) {
              <input #f type="file" accept="image/jpeg,image/png" hidden (change)="subir(f.files)">
              <button class="btn out sm" (click)="f.click()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V10"/><path d="m8 14 4-4 4 4"/><path d="M4 5h16"/></svg>
                Subir foto
              </button>
            }

            @if (msg()) { <div [class]="ok() ? 'ok' : 'err'" style="margin-top:12px">{{msg()}}</div> }
          </div>

          <div class="info">
            <div class="who">
              <h2>{{d.estudiante?.firstName}} {{d.estudiante?.lastName}}</h2>
              <span class="badge" [class.s-ok]="activo(d.estudiante)" [class.s-warn]="!activo(d.estudiante)">{{estadoEstudiante(d.estudiante)}}</span>
            </div>

            <div class="fields">
              <div class="field-row"><small>Documento</small><div>{{d.estudiante?.documentType}} {{d.estudiante?.documentNumber}}</div></div>
              <div class="field-row"><small>Correo</small><div>{{d.estudiante?.email}}</div></div>
              <div class="field-row"><small>Programa</small><div>{{d.estudiante?.programa}}</div></div>
              <div class="field-row"><small>Identificador</small><div class="mono">{{d.estudiante?.id ?? id}}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2>Inscripciones</h2>
          <span class="badge">{{d.inscripciones?.length ?? 0}} registros</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Curso</th>
                <th>Docente</th>
                <th>Horario</th>
                <th>Estado</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              @for (i of d.inscripciones; track i.id) {
                <tr>
                  <td class="mono nowrap">{{i.periodo}}</td>
                  <td><b>{{i.curso?.nombre}}</b></td>
                  <td>{{i.curso?.docente?.nombre ?? '—'}}</td>
                  <td class="nowrap">{{i.curso?.horario ?? '—'}}</td>
                  <td><span class="badge" [class]="'badge ' + badge(i.estado)">{{textoEstado(i.estado)}}</span></td>
                  <td>
                    @for (n of i.notas; track $index) {
                      <div class="tnum">{{n.tipo}}: <b>{{n.valor}}</b></div>
                    } @empty {
                      <span class="muted">—</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      <strong>Sin inscripciones</strong>
                      <span>El estudiante aún no tiene cursos inscritos.</span>
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
export class Detalle implements OnInit {
  private api = inject(Api); private route = inject(ActivatedRoute); auth = inject(Auth);
  id = Number(this.route.snapshot.paramMap.get('id'));
  d = signal<any>(null); error = signal(''); msg = signal(''); ok = signal(false);

  ngOnInit() { this.cargar(); }

  cargar() {
    this.api.detalle(this.id).subscribe({
      next: d => this.d.set(d),
      error: e => this.error.set(e.status === 403 ? 'No tienes permiso para ver este estudiante' : 'No se pudo cargar el detalle')
    });
  }

  badge(estado: string) {
    return estado === 'ACTIVA' ? 's-ok'
      : estado === 'FINALIZADA' ? 's-info'
      : estado === 'RETIRADA' ? 's-warn'
      : 's-danger';
  }

  textoEstado(estado: string) {
    return estado === 'ACTIVA' ? 'Matriculado'
      : estado === 'FINALIZADA' ? 'Finalizada'
      : estado === 'RETIRADA' ? 'Retirada'
      : estado === 'CANCELADA' ? 'Cancelada'
      : (String(estado ?? '').trim() || 'Sin estado');
  }

  activo(e: any) { return /^(active|activo|matriculado)$/i.test(String(e?.status ?? '')); }
  estadoEstudiante(e: any) { return this.activo(e) ? 'Matriculado' : (String(e?.status ?? '').trim() || 'Inactivo'); }

  subir(files: FileList | null) {
    const f = files?.[0]; if (!f) return;
    if (!['image/jpeg', 'image/png'].includes(f.type)) { this.ok.set(false); return this.msg.set('Solo JPG o PNG'); }
    if (f.size > 2 * 1024 * 1024) { this.ok.set(false); return this.msg.set('Máximo 2 MB'); }
    this.api.subirFoto(this.id, f).subscribe({
      next: () => { this.ok.set(true); this.msg.set('Foto actualizada'); this.cargar(); },
      error: () => { this.ok.set(false); this.msg.set('No se pudo subir la foto'); }
    });
  }
}
