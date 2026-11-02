import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';

@Component({
  selector: 'app-estudiantes', imports: [FormsModule, RouterLink],
  template: `<h1>Estudiantes</h1>
  <div class="bar"><input [(ngModel)]="q" placeholder="Buscar por nombre…" (keyup.enter)="buscar()"><button class="btn" (click)="buscar()">Buscar</button></div>
  @if (error()) { <div class="err">{{error()}}</div> }
  <div class="grid">@for (e of lista(); track e.id) {
    <a class="tile" [routerLink]="['/estudiantes', e.id]">
      @if (e.fotoUrl) { <img class="avatar" [src]="e.fotoUrl" [alt]="e.firstName"> } @else { <div class="avatar">{{ini(e)}}</div> }
      <div class="t"><b>{{e.nombre ?? (e.firstName + ' ' + e.lastName)}}</b><div class="muted">{{e.programa}}</div><span class="pill">{{e.status}}</span></div></a>
  } @empty { <p class="muted">Sin resultados</p> }</div>
  <div class="pag"><button class="btn out sm" [disabled]="page() <= 1" (click)="ir(-1)">← Anterior</button><span>Página {{page()}}</span>
    <button class="btn out sm" [disabled]="lista().length < 12" (click)="ir(1)">Siguiente →</button></div>`
})
export class Estudiantes implements OnInit {
  private api = inject(Api);
  lista = signal<any[]>([]); page = signal(1); error = signal(''); q = '';
  ngOnInit() { this.cargar(); }
  buscar() { this.page.set(1); this.cargar(); }
  ir(d: number) { this.page.update(p => p + d); this.cargar(); }
  cargar() { this.api.estudiantes(this.page(), this.q).subscribe({ next: l => this.lista.set(l), error: () => this.error.set('No se pudo cargar el listado') }); }
  ini(e: any) { return ((e.firstName?.[0] ?? e.nombre?.[0] ?? '') + (e.lastName?.[0] ?? '')).toUpperCase(); }
}
