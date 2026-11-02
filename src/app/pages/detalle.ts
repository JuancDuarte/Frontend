import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-detalle', imports: [RouterLink],
  styles: [`.top{display:flex;gap:24px;flex-wrap:wrap;padding:20px}.foto{width:200px;height:240px;border:5px solid #ffc926;object-fit:cover;background:#ddd;display:block;max-width:100%}
  dl{display:grid;grid-template-columns:130px 1fr;gap:8px 12px;margin:0;flex:1;min-width:240px}dt{font-weight:700}dd{margin:0;word-break:break-word}`],
  template: `@if (auth.esAdmin) { <p><a routerLink="/estudiantes">← Volver al listado</a></p> }
  <h1>Detalle del estudiante</h1>
  @if (error()) { <div class="err">{{error()}}</div> }
  @if (d(); as d) {
   <div class="card"><h3>Información</h3><div class="top"><div>
     @if (d.estudiante?.fotoUrl ?? d.fotoUrl) { <img class="foto" [src]="d.estudiante?.fotoUrl ?? d.fotoUrl" alt="Foto"> } @else { <div class="foto"></div> }
     @if (auth.esAdmin || auth.estudianteId === id) {
       <input #f type="file" accept="image/jpeg,image/png" hidden (change)="subir(f.files)"><button class="btn sm" style="margin-top:10px" (click)="f.click()">Subir foto</button>
       @if (msg()) { <div [class]="ok() ? 'ok' : 'err'">{{msg()}}</div> } }</div>
     <dl><dt>Nombre</dt><dd>{{d.estudiante?.firstName}} {{d.estudiante?.lastName}}</dd><dt>Documento</dt><dd>{{d.estudiante?.documentType}} {{d.estudiante?.documentNumber}}</dd>
      <dt>Correo</dt><dd>{{d.estudiante?.email}}</dd><dt>Programa</dt><dd>{{d.estudiante?.programa}}</dd><dt>Estado</dt><dd>{{d.estudiante?.status}}</dd></dl></div></div>
   <div class="card"><h3>Inscripciones</h3><table><thead><tr><th>Periodo</th><th>Curso</th><th>Docente</th><th>Horario</th><th>Estado</th><th>Notas</th></tr></thead><tbody>
    @for (i of d.inscripciones; track i.id) {
     <tr><td>{{i.periodo}}</td><td>{{i.curso?.nombre}}</td><td>{{i.curso?.docente?.nombre}}</td><td>{{i.curso?.horario}}</td><td>{{i.estado}}</td>
     <td>@for (n of i.notas; track $index) { <div>{{n.tipo}}: {{n.valor}}</div> } @empty { — }</td></tr>
    } @empty { <tr><td colspan="6" class="muted">Sin inscripciones</td></tr> }</tbody></table></div> }`
})
export class Detalle implements OnInit {
  private api = inject(Api); private route = inject(ActivatedRoute); auth = inject(Auth);
  id = Number(this.route.snapshot.paramMap.get('id'));
  d = signal<any>(null); error = signal(''); msg = signal(''); ok = signal(false);
  ngOnInit() { this.cargar(); }
  cargar() {
    this.api.detalle(this.id).subscribe({ next: d => this.d.set(d),
      error: e => this.error.set(e.status === 403 ? 'No tienes permiso para ver este estudiante' : 'No se pudo cargar el detalle') });
  }
  subir(files: FileList | null) {
    const f = files?.[0]; if (!f) return;
    if (!['image/jpeg', 'image/png'].includes(f.type)) { this.ok.set(false); return this.msg.set('Solo JPG o PNG'); }
    if (f.size > 2 * 1024 * 1024) { this.ok.set(false); return this.msg.set('Máximo 2 MB'); }
    this.api.subirFoto(this.id, f).subscribe({ next: () => { this.ok.set(true); this.msg.set('Foto actualizada'); this.cargar(); },
      error: () => { this.ok.set(false); this.msg.set('No se pudo subir la foto'); } });
  }
}
