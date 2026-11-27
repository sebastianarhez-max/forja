import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rol } from '../../models/rol';
import { Usuario } from '../../models/usuario';
import { RolService } from '../../services/rol-service';
import { TokenService } from '../../security/token.service';
import { UsuarioService } from '../../services/usuario-service';
import { CampoError } from '../campo-error/campo-error';
import { FechaPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, alertaExito, confirmar } from '../../shared/util';

/**
 * Cuentas que pueden ingresar al sistema. Cada usuario tiene uno o más roles
 * (Administrador, Control de ingreso, Vendedor...) que definen su menú.
 */
@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, CampoError, FechaPipe],
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private readonly service = inject(UsuarioService);
  private readonly rolService = inject(RolService);
  readonly miId = inject(TokenService).getUserId();

  /** Roles activos para asignar y los ids marcados en el formulario. */
  readonly roles = signal<Rol[]>([]);
  readonly rolesMarcados = signal<Set<number>>(new Set());

  readonly lista = signal<Usuario[]>([]);
  readonly editando = signal<Usuario | null>(null);
  readonly guardando = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    dni: ['', Validators.pattern(/^\d{8}$/)],
    login: ['', [Validators.required, Validators.maxLength(15), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
    password: ['', [Validators.minLength(6), Validators.maxLength(60)]],
    correo: ['', [Validators.email, Validators.maxLength(45)]],
    telefono: ['', Validators.pattern(/^\d{9}$/)],
    estado: [true],
  });

  ngOnInit(): void {
    this.rolService.lista().subscribe({
      next: (d) => this.roles.set(d.filter((r) => r.estado)),
      error: (e) => alertaError(e, 'No se pudo cargar los roles'),
    });
    this.cargar();
  }

  /** Nombres de los roles de un usuario para la tabla. */
  nombresRoles(u: Usuario): string {
    return (u.roles ?? []).map((r) => r.nombre).join(', ') || 'Sin rol';
  }

  alternarRol(idRol: number): void {
    const s = new Set(this.rolesMarcados());
    if (s.has(idRol)) {
      s.delete(idRol);
    } else {
      s.add(idRol);
    }
    this.rolesMarcados.set(s);
  }

  cargar(): void {
    this.service.lista().subscribe({
      next: (d) => this.lista.set(d.sort((a, b) => Number(b.estado) - Number(a.estado) || a.nombres.localeCompare(b.nombres))),
      error: (e) => alertaError(e, 'No se pudo cargar los usuarios'),
    });
  }

  guardar(): void {
    const previo = this.editando();
    if (!previo && !this.form.controls.password.value) {
      this.form.controls.password.setErrors({ required: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const login = v.login.trim();
    if (this.lista().some((u) => u.login.toLowerCase() === login.toLowerCase() && u.idUsuario !== previo?.idUsuario)) {
      alertaAviso(`El usuario "${login}" ya existe`);
      return;
    }
    if (previo && previo.idUsuario === this.miId && !v.estado) {
      alertaAviso('No puedes desactivar tu propia cuenta');
      return;
    }
    if (this.rolesMarcados().size === 0) {
      alertaAviso('Asigna al menos un rol al usuario');
      return;
    }
    const obj: Usuario = {
      ...v,
      login,
      nombres: v.nombres.trim(),
      apellidos: v.apellidos.trim(),
      roles: [...this.rolesMarcados()].map((idRol) => ({ idRol })),
    };
    if (!v.password) delete obj.password; // al editar, sin contraseña se conserva la actual
    this.guardando.set(true);
    const id = previo?.idUsuario;
    (id ? this.service.actualizar(id, { ...obj, idUsuario: id }) : this.service.registrar(obj)).subscribe({
      next: () => {
        alertaExito(id ? 'Usuario actualizado' : `Usuario ${login} creado`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }

  editar(u: Usuario): void {
    this.editando.set(u);
    this.form.setValue({
      nombres: u.nombres,
      apellidos: u.apellidos,
      dni: u.dni ?? '',
      login: u.login,
      password: '',
      correo: u.correo ?? '',
      telefono: u.telefono ?? '',
      estado: u.estado,
    });
    this.rolesMarcados.set(new Set((u.roles ?? []).map((r) => r.idRol!)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editando.set(null);
    this.guardando.set(false);
    this.form.reset({ nombres: '', apellidos: '', dni: '', login: '', password: '', correo: '', telefono: '', estado: true });
    this.rolesMarcados.set(new Set());
  }

  async cambiarEstado(u: Usuario): Promise<void> {
    if (u.estado) {
      if (u.idUsuario === this.miId) {
        alertaAviso('No puedes desactivar tu propia cuenta');
        return;
      }
      if (!(await confirmar('Desactivar usuario', `${u.nombres} ya no podrá ingresar al sistema.`, 'Sí, desactivar'))) return;
      this.service.eliminar(u.idUsuario!).subscribe({
        next: () => { alertaExito('Usuario desactivado'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.service.actualizar(u.idUsuario!, { ...u, estado: true }).subscribe({
        next: () => { alertaExito('Usuario activado'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    }
  }
}
