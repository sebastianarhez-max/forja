import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cliente } from '../../models/cliente';
import { HistorialAsistencia } from '../../models/consultas';
import { ClienteService } from '../../services/cliente-service';
import { ConsultaService } from '../../services/consulta-service';
import { CampoError } from '../../shared/campo-error';
import { EstadoAsistenciaPipe, FechaPipe, HoraPipe, SolesPipe } from '../../shared/pipes';
import { alertaError, alertaExito, confirmar, hoyIso } from '../../shared/util';

/** HU02 · Registrar y consultar clientes (socios) y ver su historial de asistencia. */
@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, CampoError, FechaPipe, HoraPipe, SolesPipe, EstadoAsistenciaPipe],
  templateUrl: './clientes.html',
})
export class Clientes implements OnInit {
  private readonly service = inject(ClienteService);
  private readonly consultaService = inject(ConsultaService);

  readonly hoy = hoyIso();
  readonly lista = signal<Cliente[]>([]);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly filtro = signal('');
  readonly clienteHistorial = signal<Cliente | null>(null);
  readonly historial = signal<HistorialAsistencia[]>([]);

  readonly filtrados = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return this.lista().filter((c) =>
      !f || `${c.nombres} ${c.apellidos} ${c.dni ?? ''} ${c.correo ?? ''}`.toLowerCase().includes(f),
    );
  });

  readonly form = inject(FormBuilder).nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    dni: ['', Validators.pattern(/^\d{8}$/)],
    correo: ['', [Validators.email, Validators.maxLength(45)]],
    telefono: ['', Validators.pattern(/^\d{9}$/)],
    fechaNacimiento: [''],
    direccion: [''],
    estado: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.lista().subscribe({
      next: (d) => this.lista.set(d.sort((a, b) => (a.idCliente ?? 0) - (b.idCliente ?? 0))),
      error: (e) => alertaError(e, 'No se pudo cargar los socios'),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const obj: Cliente = {
      ...v,
      nombres: v.nombres.trim(),
      apellidos: v.apellidos.trim(),
      fechaNacimiento: v.fechaNacimiento || null,
    };
    const id = this.editandoId();
    this.guardando.set(true);
    (id ? this.service.actualizar(id, { ...obj, idCliente: id }) : this.service.registrar(obj)).subscribe({
      next: (r) => {
        alertaExito(id ? 'Socio actualizado' : `Socio ${r.data.nombres} ${r.data.apellidos} registrado`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }

  editar(c: Cliente): void {
    this.editandoId.set(c.idCliente ?? null);
    this.form.setValue({
      nombres: c.nombres,
      apellidos: c.apellidos,
      dni: c.dni ?? '',
      correo: c.correo ?? '',
      telefono: c.telefono ?? '',
      fechaNacimiento: c.fechaNacimiento ?? '',
      direccion: c.direccion ?? '',
      estado: c.estado,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.guardando.set(false);
    this.form.reset({ nombres: '', apellidos: '', dni: '', correo: '', telefono: '', fechaNacimiento: '', direccion: '', estado: true });
  }

  async cambiarEstado(c: Cliente): Promise<void> {
    if (c.estado) {
      if (!(await confirmar('Desactivar socio', `¿Desactivar a ${c.nombres} ${c.apellidos}? No podrá reservar clases.`, 'Sí, desactivar'))) return;
      this.service.eliminar(c.idCliente!).subscribe({
        next: () => { alertaExito('Socio desactivado'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.service.actualizar(c.idCliente!, { ...c, estado: true }).subscribe({
        next: () => { alertaExito('Socio activado'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    }
  }

  verHistorial(c: Cliente): void {
    this.clienteHistorial.set(c);
    this.consultaService.historialAsistencia(c.idCliente!).subscribe({
      next: (h) => {
        this.historial.set(h);
        setTimeout(() => document.getElementById('historial')?.scrollIntoView({ behavior: 'smooth' }));
      },
      error: (e) => alertaError(e),
    });
  }
}
