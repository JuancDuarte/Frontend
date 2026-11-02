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
  styles: [`fieldset{border:1px solid #d8d8d8;border-radius:6px;margin:0 0 14px;padding:12px 24px 8px;background:#fff}
  legend{color:#777;padding:0 8px;font-size:16px}.top{display:flex;gap:40px;flex-wrap:wrap}.col{flex:1;min-width:320px}
  .foto{width:340px;max-width:100%;height:340px;border:5px solid #ffc926;object-fit:cover;background:#ddd;display:block}
  .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px 40px;padding:14px 0}.g b{margin-right:4px}`],
  template: `<h1>Datos Personales</h1>
  @if (error()) { <div class="err">{{error()}}</div> }
  <fieldset><legend>Información del {{auth.esDocente ? 'Docente' : 'Estudiante'}}</legend>
   <div class="top" style="padding:14px 0">
    <div>@if (foto()) { <img class="foto" [src]="foto()" alt="Foto"> } @else { <div class="foto"></div> }
     @if (!auth.esDocente) {
      <input #f type="file" accept="image/jpeg,image/png" hidden (change)="subir(f.files)">
      <button class="btn sm" style="margin-top:10px" (click)="f.click()">Cambiar foto</button>
      @if (msg()) { <div [class]="ok() ? 'ok' : 'err'">{{msg()}}</div> } }</div>
    <div class="col">@for (g of grupos().slice(0, 2); track g.titulo) {
      <fieldset><legend>{{g.titulo}}</legend><div class="g">@for (c of g.campos; track c.l) { <div><b>{{c.l}}:</b>{{c.v ?? '—'}}</div> }</div></fieldset> }</div>
   </div>
   @for (g of grupos().slice(2); track g.titulo) {
    <fieldset><legend>{{g.titulo}}</legend><div class="g">@for (c of g.campos; track c.l) { <div><b>{{c.l}}:</b>{{c.v ?? '—'}}</div> }</div></fieldset> }
  </fieldset>
  @if (auth.esDocente) {
   <div class="card"><h3>Mis cursos</h3><table><thead><tr><th>Curso</th><th>Materia</th><th>Horario</th><th>Periodo</th><th>Cupo</th></tr></thead><tbody>
    @for (c of cursos(); track c.id) { <tr><td>{{c.id}}</td><td>{{c.nombre ?? c.materia?.nombre}}</td><td>{{c.horario}}</td><td>{{c.periodo}}</td><td>{{c.cupo}}</td></tr> }
    @empty { <tr><td colspan="5" class="muted">Sin cursos asignados</td></tr> }</tbody></table></div> }`
})
export class Perfil implements OnInit {
  private api = inject(Api); auth = inject(Auth);
  grupos = signal<Grupo[]>([]); cursos = signal<any[]>([]); foto = signal(''); error = signal(''); msg = signal(''); ok = signal(false);
  ngOnInit() { this.auth.esDocente ? this.cargarDocente() : this.cargarEstudiante(); }

  cargarEstudiante() {
    const id = this.auth.estudianteId;
    forkJoin([this.api.detalle(id), this.api.contacto(id).pipe(catchError(() => of({})))]).subscribe({
      next: ([d, c]) => {
        const e = d.estudiante ?? {}; this.foto.set(e.fotoUrl ?? d.fotoUrl ?? '');
        this.grupos.set([
          { titulo: 'Datos Personales', campos: [
            { l: 'Nombres', v: e.firstName?.toUpperCase() }, { l: 'Apellidos', v: e.lastName?.toUpperCase() },
            { l: 'Código', v: e.codigo ?? e.id }, { l: 'Estado Académico', v: EST[e.status] ?? e.status },
            { l: 'Género', v: GEN[e.gender] ?? e.gender }, { l: 'Tipo Documento', v: TIPO[e.documentType] ?? e.documentType },
            { l: 'Documento', v: e.documentNumber }, { l: 'Fecha de nacimiento', v: e.birthDate }] },
          { titulo: 'Datos del Programa', campos: [
            { l: 'Nombre Programa', v: e.programa?.toUpperCase() }, { l: 'Código', v: e.programId },
            { l: 'Sede', v: e.sede }, { l: 'Jornada', v: e.jornada }] },
          { titulo: 'Datos de Contacto', campos: [
            { l: 'Dirección', v: c.direccion ?? c.address }, { l: 'Teléfono', v: c.telefono ?? c.phone },
            { l: 'Contacto de emergencia', v: c.contactoEmergencia ?? c.emergencyContact }, { l: 'Correo', v: e.email }] }
        ]);
      }, error: () => this.error.set('No se pudo cargar el perfil')
    });
  }

  cargarDocente() {
    const id = this.auth.docenteId;
    this.api.docente(id).subscribe({
      next: d => this.grupos.set([{ titulo: 'Datos Personales', campos: [
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
