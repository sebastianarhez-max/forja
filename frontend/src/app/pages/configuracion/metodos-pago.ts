import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoPago } from '../../models/tipo-pago';
import { TipoPagoService } from '../../services/tipo-pago-service';
import { CampoError } from '../../shared/campo-error';
import { alertaAviso, alertaError, alertaExito } from '../../shared/util';

/** Métodos de pago que acepta el gimnasio (Efectivo, Yape, Plin, Tarjeta...). */
@Component({
  selector: 'app-metodos-pago',
  imports: [ReactiveFormsModule, CampoError],
  template: `
    <div class="grid-side">
      <form class="card" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <h2 class="card-title">{{ editando() ? 'Editar método' : 'Nuevo método de pago' }}</h2>
        <div class="field" style="margin-bottom: 14px">
          <label for="nombre">Nombre</label>
          <input id="nombre" formControlName="nombre" placeholder="Ej. Transferencia" />
          <app-campo-error [control]="form.controls.nombre" />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">{{ editando() ? 'Guardar' : 'Agregar' }}</button>
          @if (editando()) {
            <button class="btn btn-link" type="button" (click)="cancelar()">Cancelar</button>
          }
        </div>
      </form>
      <section class="card">
        <h2 class="card-title">Métodos de pago</h2>
        <p class="card-sub">Los métodos activos aparecen al cobrar membresías y clases libres.</p>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Método</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (t of lista(); track t.idTipoPago) {
                <tr [class.inactivo]="!t.estado">
                  <td class="strong">{{ t.nombre }}</td>
                  <td><span class="badge" [class.badge-ok]="t.estado" [class.badge-bad]="!t.estado">{{ t.estado ? 'Activo' : 'Inactivo' }}</span></td>
                  <td>
                    <div class="acciones">
                      <button class="btn btn-outline btn-sm" type="button" (click)="editar(t)">Editar</button>
                      <button class="btn btn-sm" [class.btn-danger]="t.estado" [class.btn-outline]="!t.estado" type="button" (click)="cambiarEstado(t)">{{ t.estado ? 'Desactivar' : 'Activar' }}</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class MetodosPago implements OnInit {
  private readonly service = inject(TipoPagoService);
  readonly lista = signal<TipoPago[]>([]);
  readonly editando = signal<TipoPago | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(45)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.lista().subscribe({
      next: (d) => this.lista.set(d.sort((a, b) => a.idTipoPago - b.idTipoPago)),
      error: (e) => alertaError(e),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.getRawValue().nombre.trim();
    const previo = this.editando();
    if (this.lista().some((t) => t.nombre.toLowerCase() === nombre.toLowerCase() && t.idTipoPago !== previo?.idTipoPago)) {
      alertaAviso(`"${nombre}" ya está registrado`);
      return;
    }
    const peticion = previo
      ? this.service.actualizar(previo.idTipoPago, { ...previo, nombre })
      : this.service.registrar({ nombre, estado: true } as TipoPago);
    peticion.subscribe({
      next: () => {
        alertaExito(previo ? 'Método actualizado' : `${nombre} agregado`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => alertaError(e),
    });
  }

  editar(t: TipoPago): void {
    this.editando.set(t);
    this.form.setValue({ nombre: t.nombre });
  }

  cancelar(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '' });
  }

  cambiarEstado(t: TipoPago): void {
    const peticion = t.estado ? this.service.eliminar(t.idTipoPago) : this.service.actualizar(t.idTipoPago, { ...t, estado: true });
    peticion.subscribe({
      next: () => { alertaExito(t.estado ? 'Método desactivado' : 'Método activado'); this.cargar(); },
      error: (e) => alertaError(e),
    });
  }
}
