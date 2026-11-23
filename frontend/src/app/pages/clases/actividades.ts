import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Actividad } from '../../models/actividad';
import { ActividadService } from '../../services/actividad-service';
import { CampoError } from '../../shared/campo-error';
import { alertaError, alertaExito, confirmar } from '../../shared/util';

/** HU01 · Registrar y consultar actividades (tipos de clase). */
@Component({
  selector: 'app-actividades',
  imports: [ReactiveFormsModule, FormsModule, CampoError],
  templateUrl: './actividades.html',
})
export class Actividades implements OnInit {
  private readonly service = inject(ActividadService);

  readonly lista = signal<Actividad[]>([]);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly filtro = signal('');

  readonly filtradas = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return this.lista().filter(
      (a) => !f || a.nombre.toLowerCase().includes(f) || (a.descripcion ?? '').toLowerCase().includes(f),
    );
  });

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    descripcion: ['', Validators.maxLength(250)],
    estado: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.lista().subscribe({
      next: (datos) => this.lista.set(datos.sort((a, b) => (a.idActividad ?? 0) - (b.idActividad ?? 0))),
      error: (e) => alertaError(e, 'No se pudo cargar las actividades'),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const obj: Actividad = { nombre: v.nombre.trim(), descripcion: v.descripcion.trim(), estado: v.estado };
    const id = this.editandoId();
    const peticion = id ? this.service.actualizar(id, { ...obj, idActividad: id }) : this.service.registrar(obj);
    this.guardando.set(true);
    peticion.subscribe({
      next: (r) => {
        alertaExito(id ? 'Actividad actualizada' : `Actividad ${r.data.nombre} registrada`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }

  editar(a: Actividad): void {
    this.editandoId.set(a.idActividad ?? null);
    this.form.setValue({ nombre: a.nombre, descripcion: a.descripcion ?? '', estado: a.estado });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.guardando.set(false);
    this.form.reset({ nombre: '', descripcion: '', estado: true });
  }

  async cambiarEstado(a: Actividad): Promise<void> {
    if (a.estado) {
      if (!(await confirmar('Desactivar actividad', `¿Desactivar "${a.nombre}"? Ya no se podrán programar clases con ella.`, 'Sí, desactivar'))) return;
      this.service.eliminar(a.idActividad!).subscribe({
        next: () => { alertaExito('Actividad desactivada'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.service.actualizar(a.idActividad!, { ...a, estado: true }).subscribe({
        next: () => { alertaExito('Actividad activada'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    }
  }
}
