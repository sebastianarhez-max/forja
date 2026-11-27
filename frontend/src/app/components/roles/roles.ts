import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GRUPOS_MENU, Opcion } from '../../models/opcion';
import { ID_ROL_ADMINISTRADOR, Rol } from '../../models/rol';
import { RolService } from '../../services/rol-service';
import { CampoError } from '../campo-error/campo-error';
import { alertaAviso, alertaError, alertaExito, confirmar } from '../../shared/util';

/**
 * Roles y permisos: qué opciones del menú ve cada rol (tablas rol y rol_has_opcion).
 * Lo que se marque aquí es lo que el usuario verá en su menú la próxima vez que inicie sesión,
 * y también lo que el backend le deja hacer.
 */
@Component({
  selector: 'app-roles',
  imports: [ReactiveFormsModule, CampoError],
  templateUrl: './roles.html',
})
export class Roles implements OnInit {
  private readonly service = inject(RolService);
  readonly grupos = GRUPOS_MENU;
  readonly idAdmin = ID_ROL_ADMINISTRADOR;

  readonly lista = signal<Rol[]>([]);
  readonly opciones = signal<Opcion[]>([]);
  readonly marcadas = signal<Set<number>>(new Set());
  readonly editando = signal<Rol | null>(null);
  readonly guardando = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(45)]],
  });

  ngOnInit(): void {
    this.service.opciones().subscribe({
      next: (d) => this.opciones.set(d.filter((o) => o.estado !== false)),
      error: (e) => alertaError(e, 'No se pudo cargar las opciones del menú'),
    });
    this.cargar();
  }

  cargar(): void {
    this.service.lista().subscribe({
      next: (d) => this.lista.set(d),
      error: (e) => alertaError(e, 'No se pudo cargar los roles'),
    });
  }

  opcionesDelGrupo(tipo: number): Opcion[] {
    return this.opciones().filter((o) => o.tipo === tipo);
  }

  /** Nombres de las opciones de un rol, separados por coma, para la tabla. */
  resumen(r: Rol): string {
    return (r.opciones ?? []).map((o) => o.nombre).join(', ');
  }

  alternar(idOpcion: number): void {
    const s = new Set(this.marcadas());
    if (s.has(idOpcion)) {
      s.delete(idOpcion);
    } else {
      s.add(idOpcion);
    }
    this.marcadas.set(s);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.marcadas().size === 0) {
      alertaAviso('Marca al menos una opción del menú para el rol');
      return;
    }
    const nombre = this.form.getRawValue().nombre.trim();
    const previo = this.editando();
    if (this.lista().some((r) => r.nombre.toLowerCase() === nombre.toLowerCase() && r.idRol !== previo?.idRol)) {
      alertaAviso(`El rol "${nombre}" ya existe`);
      return;
    }
    const obj: Rol = {
      nombre,
      estado: previo?.estado ?? true,
      opciones: [...this.marcadas()].map((idOpcion) => ({ idOpcion })),
    };
    this.guardando.set(true);
    const peticion = previo ? this.service.actualizar(previo.idRol!, { ...obj, idRol: previo.idRol }) : this.service.registrar(obj);
    peticion.subscribe({
      next: () => {
        alertaExito(previo ? 'Rol actualizado: los usuarios verán el cambio al volver a iniciar sesión' : `Rol ${nombre} creado`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }

  editar(r: Rol): void {
    this.editando.set(r);
    this.form.setValue({ nombre: r.nombre });
    this.marcadas.set(new Set((r.opciones ?? []).map((o) => o.idOpcion!)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editando.set(null);
    this.guardando.set(false);
    this.marcadas.set(new Set());
    this.form.reset({ nombre: '' });
  }

  async cambiarEstado(r: Rol): Promise<void> {
    if (r.estado) {
      if (!(await confirmar('Desactivar rol', `Los usuarios con el rol ${r.nombre} dejarán de ver sus opciones.`, 'Sí, desactivar'))) return;
      this.service.eliminar(r.idRol!).subscribe({
        next: () => { alertaExito('Rol desactivado'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.service.actualizar(r.idRol!, { ...r, estado: true }).subscribe({
        next: () => { alertaExito('Rol activado'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    }
  }
}
