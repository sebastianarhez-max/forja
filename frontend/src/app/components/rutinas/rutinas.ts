import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../models/cliente';
import { Entrenador } from '../../models/entrenador';
import { Ejercicio, Rutina } from '../../models/seguimiento';
import { ClienteService } from '../../services/cliente-service';
import { EntrenadorService } from '../../services/entrenador-service';
import { RutinaService } from '../../services/rutina-service';
import { CampoError } from '../campo-error/campo-error';
import { FechaPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, alertaExito, confirmar } from '../../shared/util';

/** Rutinas de entrenamiento que un entrenador asigna a cada socio. */
@Component({
  selector: 'app-rutinas',
  imports: [ReactiveFormsModule, FormsModule, CampoError, FechaPipe],
  templateUrl: './rutinas.html',
  styleUrl: './rutinas.css',
})
export class Rutinas implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly rutinaService = inject(RutinaService);
  private readonly fb = inject(FormBuilder);

  readonly idClienteParam = input<string | undefined>(undefined, { alias: 'idCliente' });

  readonly socios = signal<Cliente[]>([]);
  readonly entrenadores = signal<Entrenador[]>([]);
  readonly todas = signal<Rutina[]>([]);
  readonly idCliente = signal<number | null>(null);
  readonly editando = signal<Rutina | null>(null);
  readonly verInactivas = signal(false);
  readonly guardando = signal(false);

  readonly socio = computed(() => this.socios().find((c) => c.idCliente === this.idCliente()) ?? null);
  readonly rutinas = computed(() =>
    this.todas()
      .filter((r) => r.cliente.idCliente === this.idCliente() && (r.estado || this.verInactivas()))
      .sort((a, b) => Number(b.estado) - Number(a.estado) || (b.fechaCreacion ?? '').localeCompare(a.fechaCreacion ?? '')),
  );

  readonly form = this.fb.group({
    idEntrenador: [null as number | null, Validators.required],
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    objetivo: ['', Validators.maxLength(100)],
    ejercicios: this.fb.array([this.filaEjercicio()]),
  });

  get ejercicios(): FormArray {
    return this.form.controls.ejercicios;
  }

  private filaEjercicio(e?: Ejercicio) {
    return this.fb.nonNullable.group({
      nombre: [e?.nombre ?? '', Validators.required],
      series: [e?.series ?? 3, [Validators.required, Validators.min(1), Validators.max(20)]],
      repeticiones: [e?.repeticiones ?? 10, [Validators.required, Validators.min(1), Validators.max(200)]],
      descansoSeg: [e?.descansoSeg ?? 60, [Validators.required, Validators.min(0), Validators.max(600)]],
    });
  }

  ngOnInit(): void {
    forkJoin({
      socios: this.clienteService.lista(),
      entrenadores: this.entrenadorService.lista(),
      rutinas: this.rutinaService.lista(),
    }).subscribe({
      next: ({ socios, entrenadores, rutinas }) => {
        this.socios.set(socios.filter((c) => c.estado).sort((a, b) => a.nombres.localeCompare(b.nombres)));
        this.entrenadores.set(entrenadores.filter((e) => e.estado));
        this.todas.set(rutinas);
        const id = Number(this.idClienteParam());
        if (id) this.idCliente.set(id);
      },
      error: (e) => alertaError(e, 'No se pudo cargar las rutinas'),
    });
  }

  elegir(id: number | null): void {
    this.idCliente.set(id);
    this.cancelar();
  }

  agregarEjercicio(): void {
    this.ejercicios.push(this.filaEjercicio());
  }

  quitarEjercicio(i: number): void {
    if (this.ejercicios.length > 1) this.ejercicios.removeAt(i);
  }

  private recargar(): void {
    this.rutinaService.lista().subscribe((d) => this.todas.set(d));
  }

  guardar(): void {
    if (!this.idCliente()) {
      alertaAviso('Primero selecciona un socio');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const previa = this.editando();
    const obj: Rutina = {
      cliente: { idCliente: this.idCliente()! },
      entrenador: { idEntrenador: Number(v.idEntrenador) },
      nombre: (v.nombre ?? '').trim(),
      objetivo: (v.objetivo ?? '').trim(),
      ejercicios: (v.ejercicios as Ejercicio[]).map((e) => ({
        nombre: e.nombre.trim(),
        series: Number(e.series),
        repeticiones: Number(e.repeticiones),
        descansoSeg: Number(e.descansoSeg),
      })),
      fechaCreacion: previa?.fechaCreacion,
      estado: previa?.estado ?? true,
    };
    this.guardando.set(true);
    const id = previa?.idRutina;
    (id ? this.rutinaService.actualizar(id, { ...obj, idRutina: id }) : this.rutinaService.registrar(obj)).subscribe({
      next: () => {
        alertaExito(id ? 'Rutina actualizada' : 'Rutina asignada');
        this.cancelar();
        this.recargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }

  editar(r: Rutina): void {
    this.editando.set(r);
    this.ejercicios.clear();
    (r.ejercicios?.length ? r.ejercicios : [undefined]).forEach((e) => this.ejercicios.push(this.filaEjercicio(e)));
    this.form.patchValue({ idEntrenador: r.entrenador.idEntrenador, nombre: r.nombre, objetivo: r.objetivo ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editando.set(null);
    this.guardando.set(false);
    this.ejercicios.clear();
    this.ejercicios.push(this.filaEjercicio());
    this.form.reset({ idEntrenador: null, nombre: '', objetivo: '' });
  }

  async cambiarEstado(r: Rutina): Promise<void> {
    if (r.estado) {
      if (!(await confirmar('Archivar rutina', `¿Archivar la rutina "${r.nombre}"? Dejará de mostrarse como vigente.`, 'Sí, archivar'))) return;
      this.rutinaService.eliminar(r.idRutina!).subscribe({
        next: () => { alertaExito('Rutina archivada'); this.recargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.rutinaService.actualizar(r.idRutina!, { ...r, estado: true }).subscribe({
        next: () => { alertaExito('Rutina reactivada'); this.recargar(); },
        error: (e) => alertaError(e),
      });
    }
  }
}
