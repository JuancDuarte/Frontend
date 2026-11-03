import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-login', imports: [FormsModule],
  styles: [`.w{display:flex;min-height:100vh}.l{flex:1;background:linear-gradient(#000a,#000a),#2b3a2b;color:#fff;padding:80px 12%;display:flex;flex-direction:column;justify-content:center}
  .l h2{font-size:40px;margin:0}.l h3{border-top:1px solid #fff5;padding-top:20px}.l p{text-align:justify;font-weight:700;line-height:1.3;max-width:560px}
  .r{width:460px;background:#fdf9e8;padding:60px 45px;display:flex;flex-direction:column;justify-content:center}.r h1{text-align:center;font-size:34px}
  label{font-weight:700;margin-top:14px;display:block}input[type=text],input[type=password]{width:100%;padding:12px;border:1px solid #ccc;border-radius:10px;margin-top:6px;font-size:15px}
  .btn{width:100%;margin-top:24px}@media(max-width:800px){.l{display:none}.r{width:100%}}`],
  template: `
  <div class="w"><div class="l"><h2>UPTC</h2><h3>Universidad Pedagógica y Tecnológica de Colombia</h3>
    <p>La finalidad de la Universidad es la de buscar la verdad, investigar la realidad en todos los campos, cuestionar y controvertir el conocimiento ya adquirido, formular nuevas hipótesis, construir nuevo conocimiento y transmitirlo a las nuevas generaciones.</p></div>
  <form class="r" (ngSubmit)="entrar()"><h1>Iniciar sesión</h1><p style="text-align:center">Ingresa tus credenciales institucionales</p>
    <label>Usuario</label><input type="text" name="u" [(ngModel)]="u" placeholder="usuario@uptc.edu.co" required>
    <label>Contraseña</label><input type="password" name="p" [(ngModel)]="p" required>
    @if (error()) { <div class="err">{{error()}}</div> }
    <button class="btn" [disabled]="cargando()">{{cargando() ? 'INGRESANDO…' : 'INICIAR SESIÓN'}}</button></form></div>`
})
export class Login {
  private auth = inject(Auth); private router = inject(Router);
  u = ''; p = ''; error = signal(''); cargando = signal(false);
  entrar() {
    this.cargando.set(true); this.error.set('');
    this.auth.login(this.u, this.p).subscribe({
      next: ok => ok ? this.router.navigate(['/']) : (this.cargando.set(false), this.error.set('Tu usuario no está vinculado a un estudiante. Pide al administrador que lo asocie (estudianteId).')),
      error: e => { this.cargando.set(false); this.error.set(e.status === 401 ? 'Usuario o contraseña incorrectos' : 'No se pudo conectar con el servidor'); }
    });
  }
}
