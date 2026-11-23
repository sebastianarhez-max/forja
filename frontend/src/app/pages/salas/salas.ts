import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HorarioSala, ResumenSala } from '../../models/consultas';
import { Sala } from '../../models/sala';
import { ConsultaService } from '../../services/consulta-service';
import { SalaService } from '../../services/sala-service';
import { CampoError } from '../../shared/campo-error';
import { DiaPipe, FechaPipe, HoraPipe } from '../../shared/pipes';
import { DIAS_SEMANA, alertaError, alertaExito, confirmar } from '../../shared/util';

interface SalaConResumen extends Sala {
  clasesActivas: number;
  horasSemana: number;
}

/** Salas del gimnasio: registro, aforo y horario semanal de cada sala. */
@Component({
  selector: 'app-salas',
  imports: [ReactiveFormsModule, CampoError, RouterLink, DiaPipe, HoraPipe, FechaPipe],
  templateUrl: './salas.html',
  styleUrl: './salas.css',
})
export class Salas implements OnInit {
  private readonly salaService = inject(SalaService);
  private readonly consultaService = inject(ConsultaService);

  readonly dias = DIAS_SEMANA;
  readonly salas = signal<SalaConResumen[]>([]);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly salaVista = signal<SalaConResumen | null>(null);
  readonly horarios = signal<HorarioSala[]>([]);

  /** Clases de la sala agrupadas por día para la grilla semanal. */
  readonly semana = computed(() =>
    this.dias.map((d) => ({
      dia: d,
      clases: this.horarios()
        .filter((h) => h.dia === d)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    })),
  );

  readonly totales = computed(() => {
    const activas = this.salas().filter((s) => s.estado);
    return {
      salas: activas.length,
      aforo: activas.reduce((t, s) => t + s.capacidad, 0),
      clases: activas.reduce((t, s) => t + s.clasesActivas, 0),
    };
  });

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    capacidad: [20, [Validators.required, Validators.min(1), Validators.max(500)]],
    descripcion: ['', Validators.maxLength(250)],
    estado: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    forkJoin({ salas: this.salaService.lista(), resumen: this.consultaService.resumenSalas() }).subscribe({
      next: ({ salas, resumen }) => {
        const lista = salas
          .map((s) => {
            const r = resumen.find((x: ResumenSala) => x.idSala === s.idSala);
            return { ...s, clasesActivas: Number(r?.clasesActivas ?? 0), horasSemana: Number(r?.horasSemana ?? 0) };
          })
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
        this.salas.set(lista);
        // la primera vez se muestra el horario de la primera sala
        const vista = this.salaVista();
        const actual = lista.find((s) => s.idSala === vista?.idSala) ?? lista[0] ?? null;
        if (actual) this.verHorario(actual);
      },
      error: (e) => alertaError(e, 'No se pudo cargar las salas'),
    });
  }

  verHorario(s: SalaConResumen): void {
    this.salaVista.set(s);
    this.consultaService.horariosSala(s.idSala!).subscribe({
      next: (h) => this.horarios.set(h),
      error: (e) => alertaError(e),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const obj: Sala = { nombre: v.nombre.trim(), capacidad: Number(v.capacidad), descripcion: v.descripcion.trim(), estado: v.estado };
    const id = this.editandoId();
    this.guardando.set(true);
    (id ? this.salaService.actualizar(id, { ...obj, idSala: id }) : this.salaService.registrar(obj)).subscribe({
      next: (r) => {
        alertaExito(id ? 'Sala actualizada' : `${r.data.nombre} registrada`);
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e, 'No se pudo guardar la sala');
      },
    });
  }

  editar(s: SalaConResumen): void {
    this.editandoId.set(s.idSala ?? null);
    this.form.setValue({ nombre: s.nombre, capacidad: s.capacidad, descripcion: s.descripcion ?? '', estado: s.estado });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.guardando.set(false);
    this.form.reset({ nombre: '', capacidad: 20, descripcion: '', estado: true });
  }

  async cambiarEstado(s: SalaConResumen): Promise<void> {
    if (s.estado) {
      const aviso = s.clasesActivas > 0 ? ` Tiene ${s.clasesActivas} clase(s) activa(s) que seguirán programadas.` : '';
      if (!(await confirmar('Desactivar sala', `¿Desactivar la ${s.nombre}?${aviso}`, 'Sí, desactivar'))) return;
      this.salaService.eliminar(s.idSala!).subscribe({
        next: () => { alertaExito('Sala desactivada'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    } else {
      const { clasesActivas, horasSemana, ...sala } = s;
      this.salaService.actualizar(s.idSala!, { ...sala, estado: true }).subscribe({
        next: () => { alertaExito('Sala activada'); this.cargar(); },
        error: (e) => alertaError(e),
      });
    }
  }
}
