import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Actividad } from '../../models/actividad';
import { Entrenador } from '../../models/entrenador';
import { Horario, TipoAcceso } from '../../models/horario';
import { Sala } from '../../models/sala';
import { ActividadService } from '../../services/actividad-service';
import { EntrenadorService } from '../../services/entrenador-service';
import { HorarioService } from '../../services/horario-service';
import { SalaService } from '../../services/sala-service';
import { CampoError } from '../campo-error/campo-error';
import { DiaPipe, HoraPipe, SolesPipe, FechaPipe } from '../../shared/pipes';
import {
  DIAS_SEMANA,
  alertaError,
  alertaExito,
  confirmar,
  diaConTilde,
  horaCorta,
  nombreDia,
  ordenarClases,
} from '../../shared/util';

/** La hora de fin debe ser posterior a la de inicio. */
function horasValidas(g: AbstractControl): ValidationErrors | null {
  const ini = g.get('horaInicio')?.value as string;
  const fin = g.get('horaFin')?.value as string;
  return ini && fin && fin <= ini ? { horas: true } : null;
}

/** HU01 · Programar clases: actividad + entrenador + sala + día/hora, cupo y tipo de acceso. */
@Component({
  selector: 'app-programacion',
  imports: [ReactiveFormsModule, FormsModule, CampoError, DiaPipe, HoraPipe, SolesPipe, FechaPipe],
  templateUrl: './programacion.html',
})
export class Programacion implements OnInit {
  private readonly horarioService = inject(HorarioService);
  private readonly actividadService = inject(ActividadService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly salaService = inject(SalaService);

  readonly dias = DIAS_SEMANA;
  readonly lista = signal<Horario[]>([]);
  readonly actividades = signal<Actividad[]>([]);
  readonly entrenadores = signal<Entrenador[]>([]);
  readonly salas = signal<Sala[]>([]);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly filtroDia = signal('');
  readonly filtroSala = signal<number | ''>('');

  readonly form = inject(FormBuilder).group(
    {
      idActividad: [null as number | null, Validators.required],
      idEntrenador: [null as number | null, Validators.required],
      idSala: [null as number | null],
      dia: ['Lunes', Validators.required],
      fecha: [''],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      cupoMaximo: [null as number | null, [Validators.min(1), Validators.max(500)]],
      tipoAcceso: ['MEMBRESIA' as TipoAcceso, Validators.required],
      precioEntrada: [0, [Validators.min(0)]],
      estado: [true],
    },
    { validators: horasValidas },
  );

  // valores del formulario como señales, para los avisos en pantalla
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly salaElegida = computed(() => this.salas().find((s) => s.idSala === Number(this.valores().idSala)) ?? null);
  readonly esLibre = computed(() => this.valores().tipoAcceso === 'LIBRE');
  readonly cupoExcede = computed(() => {
    const sala = this.salaElegida();
    const cupo = this.valores().cupoMaximo;
    return !!sala && cupo != null && Number(cupo) > sala.capacidad;
  });

  readonly actividadesActivas = computed(() => this.actividades().filter((a) => a.estado || a.idActividad === Number(this.valores().idActividad)));
  readonly entrenadoresActivos = computed(() => this.entrenadores().filter((e) => e.estado || e.idEntrenador === Number(this.valores().idEntrenador)));
  readonly salasActivas = computed(() => this.salas().filter((s) => s.estado || s.idSala === Number(this.valores().idSala)));

  readonly filtradas = computed(() =>
    ordenarClases(
      this.lista().filter(
        (h) =>
          (!this.filtroDia() || h.dia === this.filtroDia()) &&
          (this.filtroSala() === '' || h.sala?.idSala === Number(this.filtroSala())),
      ),
    ),
  );

  ngOnInit(): void {
    forkJoin({
      act: this.actividadService.lista(),
      ent: this.entrenadorService.lista(),
      sal: this.salaService.lista(),
    }).subscribe({
      next: ({ act, ent, sal }) => {
        this.actividades.set(act);
        this.entrenadores.set(ent);
        this.salas.set(sal);
      },
      error: (e) => alertaError(e, 'No se pudo cargar los catálogos'),
    });
    this.cargar();

    // Si la clase es de una fecha específica, el día se calcula solo
    this.form.controls.fecha.valueChanges.subscribe((f) => {
      if (f) {
        this.form.controls.dia.setValue(nombreDia(f), { emitEvent: false });
        this.form.controls.dia.disable({ emitEvent: false });
      } else {
        this.form.controls.dia.enable({ emitEvent: false });
      }
    });
    // Precio solo para clases LIBRE
    this.form.controls.tipoAcceso.valueChanges.subscribe((t) => {
      if (t === 'LIBRE') {
        this.form.controls.precioEntrada.enable({ emitEvent: false });
      } else {
        this.form.controls.precioEntrada.setValue(0, { emitEvent: false });
        this.form.controls.precioEntrada.disable({ emitEvent: false });
      }
    });
    this.form.controls.precioEntrada.disable({ emitEvent: false });
  }

  cargar(): void {
    this.horarioService.lista().subscribe({
      next: (d) => this.lista.set(d),
      error: (e) => alertaError(e, 'No se pudo cargar las clases'),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.tipoAcceso === 'LIBRE' && !(Number(v.precioEntrada) > 0)) {
      this.form.controls.precioEntrada.setErrors({ min: { min: 0.1 } });
      this.form.controls.precioEntrada.markAsTouched();
      return;
    }
    const obj: Horario = {
      actividad: { idActividad: Number(v.idActividad) },
      entrenador: { idEntrenador: Number(v.idEntrenador) },
      sala: v.idSala ? { idSala: Number(v.idSala) } : null,
      dia: v.fecha ? nombreDia(v.fecha) : (v.dia ?? 'Lunes'),
      fecha: v.fecha || null,
      horaInicio: `${v.horaInicio}:00`.substring(0, 8),
      horaFin: `${v.horaFin}:00`.substring(0, 8),
      tipoAcceso: v.tipoAcceso ?? 'MEMBRESIA',
      precioEntrada: v.tipoAcceso === 'LIBRE' ? Number(v.precioEntrada) : 0,
      estado: v.estado ?? true,
    };
    // Cupo: el indicado; si está vacío y hay sala, el aforo de la sala; si no, se omite (el backend usa 20)
    if (v.cupoMaximo != null && String(v.cupoMaximo) !== '') {
      obj.cupoMaximo = Number(v.cupoMaximo);
    } else if (this.salaElegida()) {
      obj.cupoMaximo = this.salaElegida()!.capacidad;
    }

    const id = this.editandoId();
    this.guardando.set(true);
    (id ? this.horarioService.actualizar(id, { ...obj, idHorario: id }) : this.horarioService.registrar(obj)).subscribe({
      next: (r) => {
        alertaExito(id ? 'Clase actualizada' : 'Clase programada');
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e, 'No se pudo programar la clase');
      },
    });
  }

  editar(h: Horario): void {
    this.editandoId.set(h.idHorario ?? null);
    this.form.reset({
      idActividad: h.actividad.idActividad,
      idEntrenador: h.entrenador.idEntrenador,
      idSala: h.sala?.idSala ?? null,
      dia: h.dia,
      fecha: h.fecha ?? '',
      horaInicio: horaCorta(h.horaInicio),
      horaFin: horaCorta(h.horaFin),
      cupoMaximo: h.cupoMaximo ?? null,
      tipoAcceso: h.tipoAcceso ?? 'MEMBRESIA',
      precioEntrada: Number(h.precioEntrada ?? 0),
      estado: h.estado,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.guardando.set(false);
    this.form.reset({
      idActividad: null,
      idEntrenador: null,
      idSala: null,
      dia: 'Lunes',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      cupoMaximo: null,
      tipoAcceso: 'MEMBRESIA',
      precioEntrada: 0,
      estado: true,
    });
  }

  async cambiarEstado(h: Horario): Promise<void> {
    if (h.estado) {
      const texto = `${h.actividad.nombre} del ${diaConTilde(h.dia)} ${horaCorta(h.horaInicio)}`;
      if (!(await confirmar('Desactivar clase', `¿Desactivar la clase ${texto}? Ya no se podrán hacer reservas.`, 'Sí, desactivar'))) return;
      this.horarioService.eliminar(h.idHorario!).subscribe({
        next: () => { alertaExito('Clase desactivada'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.horarioService.actualizar(h.idHorario!, { ...h, estado: true }).subscribe({
        next: () => { alertaExito('Clase activada'); this.cargar(); },
        error: (e) => alertaError(e, 'No se pudo activar la clase'),
      });
    }
  }
}
