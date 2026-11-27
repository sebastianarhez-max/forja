import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../security/auth.service';
import { TokenService } from '../security/token.service';
import { CampoError } from '../components/campo-error/campo-error';
import { mensajeError } from '../shared/util';

/** HU01 · Inicio de sesión (POST /url/auth/login): el token trae los roles y las opciones del menú. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CampoError],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal('');
  readonly verPassword = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    login: ['', [Validators.required, Validators.maxLength(15)]],
    password: ['', Validators.required],
  });

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (resp) => {
        this.tokenService.guardarSesion(resp.token);
        if (this.tokenService.getOpciones().length === 0) {
          // La cuenta existe pero su rol no tiene ninguna opción del menú
          this.tokenService.logOut();
          this.cargando.set(false);
          this.error.set('Tu usuario no tiene un rol con opciones asignadas. Consulta con el administrador.');
          return;
        }
        // Cada rol entra a su primera opción del menú (normalmente Inicio)
        this.router.navigateByUrl(this.tokenService.primeraRuta());
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(err.status === 401 ? 'Usuario o contraseña incorrectos' : mensajeError(err));
      },
    });
  }
}
