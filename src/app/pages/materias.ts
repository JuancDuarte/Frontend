import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-materias', imports: [FormsModule],
  template: `<h1>Materias</h1>
  <div class="bar"><input [(ngModel)]="q" placeholder="Buscar por nombre o código…" (keyup.enter)="buscar()"><button class="btn" (click)="buscar()">Buscar</button></div>
  @if (msg()) { <div [class]="ok() ? 'ok' : 'err'">{{msg()}}</div> }
  <div class="card"><h3>Catálogo de materias</h3><table><thead><tr><th>Código</th><th>Nombre</th><th>Créditos</th><th>Programa</th><th>Contenido (PDF)</th></tr></thead><tbody>
  @for (m of lista(); track m.id) {
    <tr><td>{{m.codigo}}</td><td>{{m.nombre}}</td><td>{{m.creditos}}</td><td>{{m.programa}}</td>
    <td style="white-space:nowrap"><button class="btn sm" (click)="descargar(m.id)">Descargar</button>
     @if (auth.esAdmin) { <input #f type="file" accept="application/pdf" hidden (change)="subir(m.id, f.files)"> <button class="btn out sm" (click)="f.click()">Subir PDF</button> }</td></tr>
  } @empty { <tr><td colspan="5" class="muted">Sin resultados</td></tr> }</tbody></table></div>
  <div class="pag"><button class="btn out sm" [disabled]="page() === 0" (click)="ir(-1)">← Anterior</button><span>Página {{page() + 1}}</span>
    <button class="btn out sm" [disabled]="lista().length < 12" (click)="ir(1)">Siguiente →</button></div>`
})
export class Materias implements OnInit {
  private api = inject(Api); auth = inject(Auth);
  lista = signal<any[]>([]); page = signal(0); q = ''; msg = signal(''); ok = signal(false);
  ngOnInit() { this.cargar(); }
  buscar() { this.page.set(0); this.cargar(); }
  ir(d: number) { this.page.update(p => p + d); this.cargar(); }
  cargar() { this.api.materiasPag(this.page(), this.q).subscribe({ next: l => this.lista.set(l), error: () => { this.ok.set(false); this.msg.set('No se pudo cargar el catálogo'); } }); }
  descargar(id: number) {
    this.msg.set('');
    this.api.pdfUrl(id).subscribe({ next: u => u ? window.open(u, '_blank') : (this.ok.set(false), this.msg.set('Esta materia aún no tiene PDF')),
      error: () => { this.ok.set(false); this.msg.set('No se pudo obtener el PDF'); } });
  }
  subir(id: number, files: FileList | null) {
    const f = files?.[0]; if (!f) return;
    if (f.type !== 'application/pdf') { this.ok.set(false); return this.msg.set('Solo PDF'); }
    if (f.size > 10 * 1024 * 1024) { this.ok.set(false); return this.msg.set('Máximo 10 MB'); }
    this.api.subirPdf(id, f).subscribe({ next: () => { this.ok.set(true); this.msg.set('PDF cargado'); }, error: () => { this.ok.set(false); this.msg.set('No se pudo subir el PDF'); } });
  }
}
