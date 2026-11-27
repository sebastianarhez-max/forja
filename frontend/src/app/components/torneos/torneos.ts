import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../models/cliente';
import { Entrenador } from '../../models/entrenador';
import { InscripcionTorneo, Torneo } from '../../models/torneo';
import { ClienteService } from '../../services/cliente-service';
import { EntrenadorService } from '../../services/entrenador-service';
import { InscripcionTorneoService } from '../../services/inscripcion-torneo-service';
import { TorneoService } from '../../services/torneo-service';
import { CampoError } from '../campo-error/campo-error';
import { FechaPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, alertaExito, confirmar, hoyIso } from '../../shared/util';

interface Resultado {
  puesto: number | null;
  puntaje: number | null;
}

/** Torneos internos: organización, inscripción de socios y registro de resultados. */
@Component({
  selector: 'app-torneos',
  imports: [ReactiveFormsModule, FormsModule, CampoError, FechaPipe],
  templateUrl: './torneos.html',
  styleUrl: './torneos.css',
})
export class Torneos implements OnInit {
  private readonly torneoService = inject(TorneoService);
  private readonly inscripcionService = inject(InscripcionTorneoService);
  private readonly clienteService = inject(ClienteService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly fb = inject(FormBuilder);

  readonly hoy = hoyIso();
  readonly torneos = signal<Torneo[]>([]);
  readonly inscripciones = signal<InscripcionTorneo[]>([]);
  readonly socios = signal<Cliente[]>([]);
  readonly entrenadores = signal<Entrenador[]>([]);
  readonly editandoId = signal<number | null>(null);
  readonly idSeleccionado = signal<number | null>(null);
  /** Puesto y puntaje que se están editando en la tabla de inscritos */
  readonly resultados = signal<Record<number, Resultado>>({});

  readonly torneosOrdenados = computed(() =>
    [...this.torneos()].sort((a, b) => Number(b.estado) - Number(a.estado) || b.fecha.localeCompare(a.fecha)),
  );
  readonly seleccionado = computed(() => this.torneos().find((t) => t.idTorneo === this.idSeleccionado()) ?? null);
  readonly inscritos = computed(() =>
    this.inscripciones()
      .filter((i) => i.estado && i.torneo.idTorneo === this.idSeleccionado())
      .sort((a, b) => (a.puesto ?? 999) - (b.puesto ?? 999) || (a.cliente.nombres ?? '').localeCompare(b.cliente.nombres ?? '')),
  );
  readonly sociosDisponibles = computed(() => {
    const ya = new Set(this.inscritos().map((i) => i.cliente.idCliente));
    return this.socios().filter((s) => !ya.has(s.idCliente!));
  });
  readonly proximos = computed(() => this.torneos().filter((t) => t.estado && t.fecha >= this.hoy).length);

  readonly formTorneo = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    fecha: ['', Validators.required],
    lugar: ['', Validators.maxLength(100)],
    descripcion: [''],
    estado: [true],
  });

  readonly formInscripcion = this.fb.group({
    idCliente: [null as number | null, Validators.required],
    categoria: ['', [Validators.required, Validators.maxLength(60)]],
    sexo: ['M'],
    idEntrenador: [null as number | null],
    pesoMinimo: [null as number | null, Validators.min(0)],
    pesoMaximo: [null as number | null, Validators.min(0)],
  });

  ngOnInit(): void {
    forkJoin({
      torneos: this.torneoService.lista(),
      inscripciones: this.inscripcionService.lista(),
      socios: this.clienteService.lista(),
      entrenadores: this.entrenadorService.lista(),
    }).subscribe({
      next: (r) => {
        this.torneos.set(r.torneos);
        this.inscripciones.set(r.inscripciones);
        this.socios.set(r.socios.filter((c) => c.estado).sort((a, b) => a.nombres.localeCompare(b.nombres)));
        this.entrenadores.set(r.entrenadores.filter((e) => e.estado));
        const proximo = this.torneosOrdenados().find((t) => t.estado && t.fecha >= this.hoy) ?? this.torneosOrdenados()[0];
        if (proximo) this.seleccionar(proximo);
      },
      error: (e) => alertaError(e, 'No se pudo cargar los torneos'),
    });
  }

  estadoTorneo(t: Torneo): { texto: string; clase: string } {
    if (!t.estado) return { texto: 'Cancelado', clase: 'badge-gray' };
    if (t.fecha < this.hoy) return { texto: 'Realizado', clase: 'badge-info' };
    if (t.fecha === this.hoy) return { texto: 'Hoy', clase: 'badge-orange' };
    return { texto: 'Próximo', clase: 'badge-ok' };
  }

  cantidadInscritos(t: Torneo): number {
    return this.inscripciones().filter((i) => i.estado && i.torneo.idTorneo === t.idTorneo).length;
  }

  private recargar(): void {
    forkJoin({ t: this.torneoService.lista(), i: this.inscripcionService.lista() }).subscribe(({ t, i }) => {
      this.torneos.set(t);
      this.inscripciones.set(i);
      this.prepararResultados();
    });
  }

  private prepararResultados(): void {
    const r: Record<number, Resultado> = {};
    this.inscritos().forEach((i) => (r[i.idInscripcion!] = { puesto: i.puesto ?? null, puntaje: i.puntaje != null ? Number(i.puntaje) : null }));
    this.resultados.set(r);
  }

  seleccionar(t: Torneo): void {
    this.idSeleccionado.set(t.idTorneo ?? null);
    this.prepararResultados();
  }

  // ------------------------------------------------------------ torneo
  guardarTorneo(): void {
    if (this.formTorneo.invalid) {
      this.formTorneo.markAllAsTouched();
      return;
    }
    const v = this.formTorneo.getRawValue();
    const obj: Torneo = { ...v, nombre: v.nombre.trim(), lugar: v.lugar.trim(), descripcion: v.descripcion.trim() };
    const id = this.editandoId();
    (id ? this.torneoService.actualizar(id, { ...obj, idTorneo: id }) : this.torneoService.registrar(obj)).subscribe({
      next: (r) => {
        alertaExito(id ? 'Torneo actualizado' : `Torneo ${r.data.nombre} creado`);
        this.cancelarTorneo();
        if (!id && r.data.idTorneo) this.idSeleccionado.set(r.data.idTorneo);
        this.recargar();
      },
      error: (e) => alertaError(e),
    });
  }

  editarTorneo(t: Torneo): void {
    this.editandoId.set(t.idTorneo ?? null);
    this.formTorneo.setValue({ nombre: t.nombre, fecha: t.fecha, lugar: t.lugar ?? '', descripcion: t.descripcion ?? '', estado: t.estado });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarTorneo(): void {
    this.editandoId.set(null);
    this.formTorneo.reset({ nombre: '', fecha: '', lugar: '', descripcion: '', estado: true });
  }

  async cambiarEstado(t: Torneo): Promise<void> {
    if (t.estado) {
      if (!(await confirmar('Cancelar torneo', `¿Cancelar el torneo "${t.nombre}"?`, 'Sí, cancelar torneo'))) return;
      this.torneoService.eliminar(t.idTorneo!).subscribe({
        next: () => { alertaExito('Torneo cancelado'); this.recargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.torneoService.actualizar(t.idTorneo!, { ...t, estado: true }).subscribe({
        next: () => { alertaExito('Torneo reactivado'); this.recargar(); },
        error: (e) => alertaError(e),
      });
    }
  }

  // ------------------------------------------------------------ inscripciones
  inscribir(): void {
    const torneo = this.seleccionado();
    if (!torneo) return;
    if (!torneo.estado) {
      alertaAviso('El torneo está cancelado');
      return;
    }
    if (this.formInscripcion.invalid) {
      this.formInscripcion.markAllAsTouched();
      return;
    }
    const v = this.formInscripcion.getRawValue();
    if (v.pesoMinimo != null && v.pesoMaximo != null && Number(v.pesoMinimo) > Number(v.pesoMaximo)) {
      alertaAviso('El peso mínimo no puede ser mayor que el máximo');
      return;
    }
    const datos: InscripcionTorneo = {
      cliente: { idCliente: Number(v.idCliente) },
      torneo: { idTorneo: torneo.idTorneo! },
      entrenador: v.idEntrenador ? { idEntrenador: Number(v.idEntrenador) } : null,
      categoria: (v.categoria ?? '').trim(),
      sexo: v.sexo ?? undefined,
      pesoMinimo: v.pesoMinimo != null && String(v.pesoMinimo) !== '' ? Number(v.pesoMinimo) : null,
      pesoMaximo: v.pesoMaximo != null && String(v.pesoMaximo) !== '' ? Number(v.pesoMaximo) : null,
      estado: true,
    };
    // Si el socio se había retirado antes, se reactiva su inscripción (un socio solo se inscribe una vez por torneo)
    const retirada = this.inscripciones().find(
      (i) => !i.estado && i.torneo.idTorneo === torneo.idTorneo && i.cliente.idCliente === datos.cliente.idCliente,
    );
    const peticion = retirada
      ? this.inscripcionService.actualizar(retirada.idInscripcion!, {
          ...retirada,
          ...datos,
          idInscripcion: retirada.idInscripcion,
          puesto: null,
          puntaje: null,
        })
      : this.inscripcionService.registrar(datos);
    peticion.subscribe({
      next: () => {
        alertaExito('Socio inscrito');
        this.formInscripcion.reset({ idCliente: null, categoria: v.categoria, sexo: v.sexo, idEntrenador: null, pesoMinimo: null, pesoMaximo: null });
        this.recargar();
      },
      error: (e) => alertaError(e, 'No se pudo inscribir'),
    });
  }

  cambiarResultado(id: number, campo: keyof Resultado, valor: unknown): void {
    const n = valor === '' || valor == null ? null : Number(valor);
    this.resultados.update((r) => ({ ...r, [id]: { ...r[id], [campo]: n } }));
  }

  guardarResultado(i: InscripcionTorneo): void {
    const r = this.resultados()[i.idInscripcion!];
    if (r?.puesto != null && r.puesto < 1) {
      alertaAviso('El puesto debe ser 1 o mayor');
      return;
    }
    this.inscripcionService
      .actualizar(i.idInscripcion!, { ...i, puesto: r?.puesto ?? null, puntaje: r?.puntaje ?? null })
      .subscribe({
        next: () => { alertaExito(`Resultado de ${i.cliente.nombres} guardado`); this.recargar(); },
        error: (e) => alertaError(e),
      });
  }

  async retirar(i: InscripcionTorneo): Promise<void> {
    if (!(await confirmar('Retirar del torneo', `¿Retirar a ${i.cliente.nombres} ${i.cliente.apellidos}?`, 'Sí, retirar'))) return;
    this.inscripcionService.eliminar(i.idInscripcion!).subscribe({
      next: () => { alertaExito('Inscripción retirada'); this.recargar(); },
      error: (e) => alertaError(e),
    });
  }

  medalla(puesto: number | null | undefined): string {
    return puesto === 1 ? '🥇' : puesto === 2 ? '🥈' : puesto === 3 ? '🥉' : '';
  }
}
