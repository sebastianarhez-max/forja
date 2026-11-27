import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Plan } from '../../models/plan';
import { PlanService } from '../../services/plan-service';
import { CampoError } from '../campo-error/campo-error';
import { SolesPipe } from '../../shared/pipes';
import { alertaError, alertaExito, confirmar } from '../../shared/util';

/** HU04 · Registrar y consultar planes de membresía. */
@Component({
  selector: 'app-planes',
  imports: [ReactiveFormsModule, CampoError, SolesPipe],
  templateUrl: './planes.html',
})
export class Planes implements OnInit {
  private readonly service = inject(PlanService);

  readonly lista = signal<Plan[]>([]);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    descripcion: [''],
    duracionDias: [30, [Validators.required, Validators.min(1), Validators.max(3650)]],
    precio: [0, [Validators.required, Validators.min(0.1)]],
    estado: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.lista().subscribe({
      next: (d) => this.lista.set(d.sort((a, b) => a.duracionDias - b.duracionDias)),
      error: (e) => alertaError(e, 'No se pudo cargar los planes'),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const obj: Plan = { ...v, nombre: v.nombre.trim(), duracionDias: Number(v.duracionDias), precio: Number(v.precio) };
    const id = this.editandoId();
    this.guardando.set(true);
    (id ? this.service.actualizar(id, { ...obj, idPlan: id }) : this.service.registrar(obj)).subscribe({
      next: (r) => {
        alertaExito(id ? 'Plan actualizado' : `Plan ${r.data.nombre} registrado`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }

  editar(p: Plan): void {
    this.editandoId.set(p.idPlan ?? null);
    this.form.setValue({ nombre: p.nombre, descripcion: p.descripcion ?? '', duracionDias: p.duracionDias, precio: p.precio, estado: p.estado });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.guardando.set(false);
    this.form.reset({ nombre: '', descripcion: '', duracionDias: 30, precio: 0, estado: true });
  }

  async cambiarEstado(p: Plan): Promise<void> {
    if (p.estado) {
      if (!(await confirmar('Desactivar plan', `¿Desactivar el plan ${p.nombre}? Ya no se podrá contratar.`, 'Sí, desactivar'))) return;
      this.service.eliminar(p.idPlan!).subscribe({
        next: () => { alertaExito('Plan desactivado'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.service.actualizar(p.idPlan!, { ...p, estado: true }).subscribe({
        next: () => { alertaExito('Plan activado'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    }
  }
}
