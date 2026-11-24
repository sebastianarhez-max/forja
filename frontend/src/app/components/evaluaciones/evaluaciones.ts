import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../models/cliente';
import { EvaluacionFisica } from '../../models/seguimiento';
import { ClienteService } from '../../services/cliente-service';
import { EvaluacionService } from '../../services/evaluacion-service';
import { CampoError } from '../campo-error/campo-error';
import { FechaPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, alertaExito, confirmar, hoyIso } from '../../shared/util';

/** Clasificación del IMC según la OMS. */
export function categoriaImc(imc: number): { texto: string; clase: string } {
  if (imc < 18.5) return { texto: 'Bajo peso', clase: 'badge-warn' };
  if (imc < 25) return { texto: 'Normal', clase: 'badge-ok' };
  if (imc < 30) return { texto: 'Sobrepeso', clase: 'badge-warn' };
  return { texto: 'Obesidad', clase: 'badge-bad' };
}

/** Seguimiento físico de cada socio: peso, talla, IMC y % de grasa en el tiempo. */
@Component({
  selector: 'app-evaluaciones',
  imports: [ReactiveFormsModule, FormsModule, CampoError, FechaPipe],
  templateUrl: './evaluaciones.html',
})
export class Evaluaciones implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly evaluacionService = inject(EvaluacionService);

  /** ?idCliente=2 para abrir directamente un socio */
  readonly idClienteParam = input<string | undefined>(undefined, { alias: 'idCliente' });

  readonly hoy = hoyIso();
  readonly categoria = categoriaImc;
  readonly socios = signal<Cliente[]>([]);
  readonly todas = signal<EvaluacionFisica[]>([]);
  readonly idCliente = signal<number | null>(null);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);

  readonly socio = computed(() => this.socios().find((c) => c.idCliente === this.idCliente()) ?? null);
  /** Evaluaciones del socio, de la más reciente a la más antigua. */
  readonly evaluaciones = computed(() =>
    this.todas()
      .filter((e) => e.cliente.idCliente === this.idCliente())
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.idEvaluacion ?? 0) - (a.idEvaluacion ?? 0)),
  );
  /** Variación de peso entre la primera y la última evaluación. */
  readonly progreso = computed(() => {
    const e = this.evaluaciones();
    if (e.length < 2) return null;
    return Math.round((Number(e[0].peso) - Number(e[e.length - 1].peso)) * 100) / 100;
  });

  readonly form = inject(FormBuilder).nonNullable.group({
    fecha: [hoyIso(), Validators.required],
    peso: [null as number | null, [Validators.required, Validators.min(20), Validators.max(300)]],
    altura: [null as number | null, [Validators.required, Validators.min(1), Validators.max(2.5)]],
    grasaCorporal: [null as number | null, [Validators.min(2), Validators.max(70)]],
    observaciones: [''],
  });
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** IMC = peso (kg) / altura (m)² */
  readonly imc = computed(() => {
    const p = Number(this.valores().peso);
    const a = Number(this.valores().altura);
    return p > 0 && a > 0 ? Math.round((p / (a * a)) * 100) / 100 : null;
  });

  ngOnInit(): void {
    forkJoin({ socios: this.clienteService.lista(), evaluaciones: this.evaluacionService.lista() }).subscribe({
      next: ({ socios, evaluaciones }) => {
        this.socios.set(socios.filter((c) => c.estado).sort((a, b) => a.nombres.localeCompare(b.nombres)));
        this.todas.set(evaluaciones);
        const id = Number(this.idClienteParam());
        if (id) this.elegir(id);
      },
      error: (e) => alertaError(e, 'No se pudo cargar las evaluaciones'),
    });
  }

  elegir(id: number | null): void {
    this.idCliente.set(id);
    this.cancelar();
    // la altura casi no cambia: se propone la última registrada
    const ultima = this.evaluaciones()[0];
    if (ultima) this.form.patchValue({ altura: Number(ultima.altura) });
  }

  private recargar(): void {
    this.evaluacionService.lista().subscribe((d) => this.todas.set(d));
  }

  guardar(): void {
    if (!this.idCliente()) {
      alertaAviso('Primero selecciona un socio');
      return;
    }
    if (this.form.invalid || this.imc() === null) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const obj: EvaluacionFisica = {
      cliente: { idCliente: this.idCliente()! },
      fecha: v.fecha,
      peso: Number(v.peso),
      altura: Number(v.altura),
      imc: this.imc()!,
      grasaCorporal: v.grasaCorporal != null && String(v.grasaCorporal) !== '' ? Number(v.grasaCorporal) : null,
      observaciones: v.observaciones.trim(),
    };
    const id = this.editandoId();
    this.guardando.set(true);
    (id ? this.evaluacionService.actualizar(id, { ...obj, idEvaluacion: id }) : this.evaluacionService.registrar(obj)).subscribe({
      next: () => {
        alertaExito(id ? 'Evaluación actualizada' : 'Evaluación registrada');
        this.cancelar();
        this.recargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }

  editar(e: EvaluacionFisica): void {
    this.editandoId.set(e.idEvaluacion ?? null);
    this.form.setValue({
      fecha: e.fecha,
      peso: Number(e.peso),
      altura: Number(e.altura),
      grasaCorporal: e.grasaCorporal != null ? Number(e.grasaCorporal) : null,
      observaciones: e.observaciones ?? '',
    });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.guardando.set(false);
    const altura = this.form.controls.altura.value;
    this.form.reset({ fecha: hoyIso(), peso: null, altura, grasaCorporal: null, observaciones: '' });
  }

  async eliminar(e: EvaluacionFisica): Promise<void> {
    if (!(await confirmar('Eliminar evaluación', `¿Eliminar la evaluación del ${e.fecha.split('-').reverse().join('/')}?`, 'Sí, eliminar'))) return;
    this.evaluacionService.eliminar(e.idEvaluacion!).subscribe({
      next: () => {
        alertaExito('Evaluación eliminada');
        this.recargar();
      },
      error: (err) => alertaError(err),
    });
  }
}
