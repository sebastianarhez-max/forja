import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Entrenador } from '../../models/entrenador';
import { EntrenadorService } from '../../services/entrenador-service';
import { CampoError } from '../campo-error/campo-error';
import { alertaError, alertaExito, confirmar } from '../../shared/util';

/** HU01 · Registrar y consultar entrenadores (dato gestionado, no inician sesión). */
@Component({
  selector: 'app-entrenadores',
  imports: [ReactiveFormsModule, FormsModule, CampoError],
  templateUrl: './entrenadores.html',
})
export class Entrenadores implements OnInit {
  private readonly service = inject(EntrenadorService);

  readonly lista = signal<Entrenador[]>([]);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly filtro = signal('');

  readonly filtrados = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return this.lista().filter((e) =>
      !f || `${e.nombres} ${e.apellidos} ${e.dni ?? ''} ${e.especialidad ?? ''}`.toLowerCase().includes(f),
    );
  });

  readonly form = inject(FormBuilder).nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    dni: ['', Validators.pattern(/^\d{8}$/)],
    especialidad: ['', Validators.maxLength(80)],
    telefono: ['', Validators.pattern(/^\d{9}$/)],
    correo: ['', [Validators.email, Validators.maxLength(45)]],
    estado: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.lista().subscribe({
      next: (d) => this.lista.set(d.sort((a, b) => (a.idEntrenador ?? 0) - (b.idEntrenador ?? 0))),
      error: (e) => alertaError(e, 'No se pudo cargar los entrenadores'),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const obj: Entrenador = { ...v, nombres: v.nombres.trim(), apellidos: v.apellidos.trim() };
    const id = this.editandoId();
    this.guardando.set(true);
    (id ? this.service.actualizar(id, { ...obj, idEntrenador: id }) : this.service.registrar(obj)).subscribe({
      next: (r) => {
        alertaExito(id ? 'Entrenador actualizado' : `Entrenador ${r.data.nombres} registrado`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }

  editar(e: Entrenador): void {
    this.editandoId.set(e.idEntrenador ?? null);
    this.form.setValue({
      nombres: e.nombres,
      apellidos: e.apellidos,
      dni: e.dni ?? '',
      especialidad: e.especialidad ?? '',
      telefono: e.telefono ?? '',
      correo: e.correo ?? '',
      estado: e.estado,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.guardando.set(false);
    this.form.reset({ nombres: '', apellidos: '', dni: '', especialidad: '', telefono: '', correo: '', estado: true });
  }

  async cambiarEstado(e: Entrenador): Promise<void> {
    if (e.estado) {
      if (!(await confirmar('Desactivar entrenador', `¿Desactivar a ${e.nombres} ${e.apellidos}?`, 'Sí, desactivar'))) return;
      this.service.eliminar(e.idEntrenador!).subscribe({
        next: () => { alertaExito('Entrenador desactivado'); this.cargar(); },
        error: (err) => alertaError(err),
      });
    } else {
      this.service.actualizar(e.idEntrenador!, { ...e, estado: true }).subscribe({
        next: () => { alertaExito('Entrenador activado'); this.cargar(); },
        error: (err) => alertaError(err),
      });
    }
  }
}
