import { Component, inject, signal, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

type Campo = { l: string; v: any };
type Grupo = { titulo: string; campos: Campo[] };
const TIPO: any = { CC: 'Cédula de Ciudadanía', TI: 'Tarjeta de Identidad', CE: 'Cédula de Extranjería' };
const GEN: any = { male: 'Masculino', female: 'Femenino', other: 'Otro' };
const EST: any = { active: 'MATRICULADO', inactive: 'INACTIVO' };

@Component({
  selector: 'app-perfil',
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Cuenta</span>
        <h1>Datos personales</h1>
        <p>Información registrada en el sistema académico de la universidad.</p>
      </div>
    </div>

    @if (error()) { <div class="err">{{error()}}</div> }

    <div class="card">
      <div class="profile">
        <div class="photo-col">
          @if (foto()) {
            <img class="photo" [src]="foto()" alt="Foto de perfil">
          } @else {
            <div class="photo" aria-hidden="true">{{ini()}}</div>
          }

          @if (!auth.esDocente) {
            <input #f type="file" accept="image/jpeg,image/png" hidden (change)="subir(f.files)">
            <button class="btn out sm" (click)="f.click()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V10"/><path d="m8 14 4-4 4 4"/><path d="M4 5h16"/></svg>
              Cambiar foto
            </button>
          }

          @if (msg()) { <div [class]="ok() ? 'ok' : 'err'" style="margin-top:12px">{{msg()}}</div> }
        </div>

        <div class="info">
          <div class="who">
            <h2>{{auth.nombre || 'Usuario'}}</h2>
            <span class="badge s-brand">{{auth.rol || 'USUARIO'}}</span>
          </div>

          @if (grupos().length) {
            <div class="fields">
              @for (c of grupos()[0].campos; track c.l) {
                <div class="field-row"><small>{{c.l}}</small><div>{{c.v ?? '—'}}</div></div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <div class="stack">
      @for (g of grupos().slice(1); track g.titulo) {
        <div class="card">
          <div class="card-head">
            <h2>{{g.titulo}}</h2>
          </div>
          <div class="card-body">
            <div class="fields">
              @for (c of g.campos; track c.l) {
                <div class="field-row"><small>{{c.l}}</small><div>{{c.v ?? '—'}}</div></div>
              }
            </div>
          </div>
        </div>
      }
    </div>

    @if (auth.esDocente) {
      <div class="card">
        <div class="card-head">
          <h2>Mis cursos</h2>
          <span class="badge">{{cursos().length}} cursos</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Curso</th><th>Materia</th><th>Horario</th><th>Periodo</th><th class="center">Cupo</th></tr>
            </thead>
            <tbody>
              @for (c of cursos(); track c.id) {
                <tr><td class="mono">{{c.id}}</td><td><b>{{c.nombre ?? c.materia?.nombre}}</b></td><td>{{c.horario}}</td><td class="mono">{{c.periodo}}</td><td class="center tnum">{{c.cupo}}</td></tr>
              } @empty {
                <tr>
                  <td colspan="5">
                    <div class="empty">
                      <strong>Sin cursos asignados</strong>
                      <span>No tienes cursos en el periodo actual.</span>
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
export class Perfil implements OnInit {
  private api = inject(Api); auth = inject(Auth);
  grupos = signal<Grupo[]>([]); cursos = signal<any[]>([]); foto = signal(''); error = signal(''); msg = signal(''); ok = signal(false);

  ngOnInit() { this.auth.esDocente ? this.cargarDocente() : this.cargarEstudiante(); }

  ini() {
    const n = (this.auth.nombre || '').trim();
    const p = n.split(/\s+/).filter(Boolean);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'U';
  }

  cargarEstudiante() {
    const id = this.auth.estudianteId;
    forkJoin([this.api.detalle(id), this.api.contacto(id).pipe(catchError(() => of({})))]).subscribe({
      next: ([d, c]) => {
        const e = d.estudiante ?? {}; this.foto.set(e.fotoUrl ?? d.fotoUrl ?? '');
        this.grupos.set([
          { titulo: 'Datos personales', campos: [
            { l: 'Nombres', v: e.firstName?.toUpperCase() }, { l: 'Apellidos', v: e.lastName?.toUpperCase() },
            { l: 'Código', v: e.codigo ?? e.id }, { l: 'Estado académico', v: EST[e.status] ?? e.status },
            { l: 'Género', v: GEN[e.gender] ?? e.gender }, { l: 'Tipo documento', v: TIPO[e.documentType] ?? e.documentType },
            { l: 'Documento', v: e.documentNumber }, { l: 'Fecha de nacimiento', v: e.birthDate }] },
          { titulo: 'Datos del programa', campos: [
            { l: 'Nombre programa', v: e.programa?.toUpperCase() }, { l: 'Código', v: e.programId },
            { l: 'Sede', v: e.sede }, { l: 'Jornada', v: e.jornada }] },
          { titulo: 'Datos de contacto', campos: [
            { l: 'Dirección', v: c.direccion ?? c.address }, { l: 'Teléfono', v: c.telefono ?? c.phone },
            { l: 'Contacto de emergencia', v: c.contactoEmergencia ?? c.emergencyContact }, { l: 'Correo', v: e.email }] }
        ]);
      }, error: () => this.error.set('No se pudo cargar el perfil')
    });
  }

  cargarDocente() {
    const id = this.auth.docenteId;
    this.api.docente(id).subscribe({
      next: d => this.grupos.set([{ titulo: 'Datos personales', campos: [
        { l: 'Nombre', v: (d.nombre ?? this.auth.nombre)?.toUpperCase() }, { l: 'Código', v: d.id },
        { l: 'Correo', v: d.email ?? d.correo }, { l: 'Departamento', v: d.departamento }] }]),
      error: () => this.error.set('No se pudo cargar el perfil')
    });
    this.api.cursosDocente(id).pipe(catchError(() => of([]))).subscribe(c => this.cursos.set(c));
  }

  subir(files: FileList | null) {
    const f = files?.[0]; if (!f) return;
    if (!['image/jpeg', 'image/png'].includes(f.type)) { this.ok.set(false); return this.msg.set('Solo JPG o PNG'); }
    if (f.size > 2 * 1024 * 1024) { this.ok.set(false); return this.msg.set('Máximo 2 MB'); }
    this.api.subirFoto(this.auth.estudianteId, f).subscribe({
      next: () => { this.ok.set(true); this.msg.set('Foto actualizada'); this.cargarEstudiante(); },
      error: () => { this.ok.set(false); this.msg.set('No se pudo subir la foto'); }
    });
  }
}
