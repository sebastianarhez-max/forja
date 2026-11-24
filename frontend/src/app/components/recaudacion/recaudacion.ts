import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RecaudadoClase, RecaudadoPorPago } from '../../models/consultas';
import { Horario } from '../../models/horario';
import { ConsultaService } from '../../services/consulta-service';
import { HorarioService } from '../../services/horario-service';
import { SolesPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, fechaSugerida, ordenarClases, textoClase } from '../../shared/util';

/** HU03 · Recaudado de una clase (solo ingresos ASISTIO) y desglose por método de pago. */
@Component({
  selector: 'app-recaudacion',
  imports: [FormsModule, SolesPipe],
  templateUrl: './recaudacion.html',
})
export class Recaudacion implements OnInit {
  private readonly horarioService = inject(HorarioService);
  private readonly consultaService = inject(ConsultaService);

  readonly texto = textoClase;
  readonly clases = signal<Horario[]>([]);
  readonly idHorario = signal<number | null>(null);
  readonly fecha = signal('');
  readonly resumen = signal<RecaudadoClase | null>(null);
  readonly desglose = signal<RecaudadoPorPago[]>([]);
  readonly consultado = signal(false);

  readonly totalDesglose = computed(() => this.desglose().reduce((t, d) => t + Number(d.total), 0));

  ngOnInit(): void {
    this.horarioService.lista().subscribe({
      next: (h) => {
        // primero las clases LIBRE (son las que generan recaudación)
        const activas = ordenarClases(h.filter((x) => x.estado));
        this.clases.set([...activas.filter((x) => x.tipoAcceso === 'LIBRE'), ...activas.filter((x) => x.tipoAcceso !== 'LIBRE')]);
        const primera = this.clases()[0];
        if (primera) {
          this.idHorario.set(primera.idHorario!);
          this.fecha.set(fechaSugerida(primera));
          this.consultar();
        }
      },
      error: (e) => alertaError(e),
    });
  }

  elegirClase(id: number): void {
    this.idHorario.set(id);
    const h = this.clases().find((x) => x.idHorario === id);
    if (h) this.fecha.set(fechaSugerida(h));
    this.consultar();
  }

  consultar(): void {
    const id = this.idHorario();
    if (!id || !this.fecha()) {
      alertaAviso('Selecciona una clase y una fecha');
      return;
    }
    forkJoin({
      resumen: this.consultaService.recaudadoClase(id, this.fecha()),
      desglose: this.consultaService.recaudadoPorPago(id, this.fecha()),
    }).subscribe({
      next: ({ resumen, desglose }) => {
        this.resumen.set(resumen[0] ?? null);
        this.desglose.set(desglose);
        this.consultado.set(true);
      },
      error: (e) => alertaError(e),
    });
  }
}
