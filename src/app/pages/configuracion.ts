import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../core/api';

@Component({
  selector: 'app-configuracion',
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Administración</span>
        <h1>Configuración de inscripciones</h1>
        <p>Controla si los estudiantes pueden inscribir materias en este momento.</p>
      </div>
    </div>

    @if (msg()) { <div [class]="ok() ? 'ok' : 'err'">{{msg()}}</div> }

    <div class="card">
      <div class="card-head">
        <h2>Inscripción de materias</h2>
        <span class="badge" [class.s-ok]="habilitada()" [class.s-danger]="!habilitada()">
          {{habilitada() ? 'Habilitada' : 'Cerrada'}}
        </span>
      </div>

      <div class="card-body">
        @if (cargando()) {
          <div class="empty loading">
            <strong>Cargando…</strong>
            <span>Consultando el estado actual de la ventana de inscripción.</span>
          </div>
        } @else {
          <label class="switch-row">
            <input type="checkbox" [checked]="habilitada()" [disabled]="guardando()" (change)="cambiar($event)">
            <span class="track" aria-hidden="true"><span class="thumb"></span></span>
            <span class="text">
              <b>Permitir que los estudiantes inscriban materias</b>
              <small>
                @if (habilitada()) {
                  Los estudiantes pueden inscribir materias mientras el interruptor esté activo.
                } @else {
                  Los estudiantes pueden consultar la oferta, pero no inscribir: verán el aviso de que no está en fecha disponible.
                }
              </small>
            </span>
          </label>
          @if (guardando()) { <p class="muted" style="margin:14px 0 0">Guardando…</p> }
        }
      </div>
    </div>
  </div>`,
  styles: [`
    .switch-row { display: flex; align-items: flex-start; gap: 16px; cursor: pointer; }
    .switch-row input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    .track {
      position: relative;
      flex: 0 0 52px;
      width: 52px;
      height: 30px;
      margin-top: 2px;
      border-radius: 999px;
      background: #c9c9c9;
      transition: background .18s ease;
    }
    .thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
      transition: transform .18s ease;
    }
    .switch-row input:checked + .track { background: var(--gold); }
    .switch-row input:checked + .track .thumb { transform: translateX(22px); }
    .switch-row input:focus-visible + .track { outline: 2px solid var(--gold); outline-offset: 2px; }
    .switch-row input:disabled + .track { opacity: .6; }
    .text b { display: block; }
    .text small { display: block; margin-top: 4px; color: #666; }
  `]
})
export class Configuracion implements OnInit {
  private api = inject(Api);

  habilitada = signal(true);
  cargando = signal(true);
  guardando = signal(false);
  msg = signal('');
  ok = signal(false);

  ngOnInit() { this.cargar(); }

  private cargar() {
    this.cargando.set(true);
    this.api.configuracionInscripcion().subscribe({
      next: c => { this.habilitada.set(c.habilitada !== false); this.cargando.set(false); },
      error: () => {
        this.cargando.set(false); this.ok.set(false);
        this.msg.set('No se pudo consultar el estado de la inscripción');
      }
    });
  }

  cambiar(event: Event) {
    const habilitada = (event.target as HTMLInputElement).checked;
    this.guardando.set(true); this.msg.set('');
    this.api.cambiarConfiguracionInscripcion(habilitada).subscribe({
      next: c => {
        this.habilitada.set(c.habilitada !== false);
        this.guardando.set(false); this.ok.set(true);
        this.msg.set(c.habilitada
          ? 'Inscripción de materias habilitada.'
          : 'Inscripción de materias cerrada.');
      },
      error: e => {
        this.guardando.set(false); this.ok.set(false);
        this.habilitada.set(!habilitada);
        this.msg.set(e.error?.error?.message ?? e.error?.mensaje ?? 'No se pudo cambiar el estado');
      }
    });
  }
}
