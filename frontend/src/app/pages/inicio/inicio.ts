import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Ingresos, MembresiaVigente, ProductoStockBajo } from '../../models/consultas';
import { Horario } from '../../models/horario';
import { ConsultaService } from '../../services/consulta-service';
import { HorarioService } from '../../services/horario-service';
import { TorneoService } from '../../services/torneo-service';
import { Torneo } from '../../models/torneo';
import { TokenService } from '../../security/token.service';
import { FechaPipe, HoraPipe, SolesPipe } from '../../shared/pipes';
import { alertaError, hoyIso, nombreDia, ordenarClases } from '../../shared/util';

interface ClaseHoy {
  horario: Horario;
  ocupados: number;
  cupo: number;
}

/** Panel de inicio: indicadores del día y accesos rápidos para el administrador. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, SolesPipe, HoraPipe, FechaPipe],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  private readonly consultaService = inject(ConsultaService);
  private readonly horarioService = inject(HorarioService);
  private readonly torneoService = inject(TorneoService);

  readonly nombre = inject(TokenService).getNombreCompleto().split(' ')[0];
  readonly hoy = hoyIso();
  readonly fechaLarga = (() => {
    const t = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  })();

  readonly vigentes = signal<MembresiaVigente[]>([]);
  readonly porVencer = signal<MembresiaVigente[]>([]);
  readonly stockBajo = signal<ProductoStockBajo[]>([]);
  readonly ingresosMes = signal<Ingresos | null>(null);
  readonly clasesHoy = signal<ClaseHoy[]>([]);
  readonly cargando = signal(true);
  readonly proximoTorneo = signal<Torneo | null>(null);

  readonly ocupacionHoy = computed(() => {
    const c = this.clasesHoy();
    const cupo = c.reduce((t, x) => t + x.cupo, 0);
    return cupo ? Math.round((c.reduce((t, x) => t + x.ocupados, 0) / cupo) * 100) : 0;
  });

  ngOnInit(): void {
    const primerDiaMes = this.hoy.substring(0, 8) + '01';
    forkJoin({
      vigentes: this.consultaService.membresiasVigentes(),
      porVencer: this.consultaService.membresiasPorVencer(7),
      stock: this.consultaService.productosStockBajo(),
      ingresos: this.consultaService.ingresos(primerDiaMes, this.hoy),
      horarios: this.horarioService.lista(),
      torneos: this.torneoService.lista(),
    }).subscribe({
      next: (r) => {
        this.vigentes.set(r.vigentes);
        this.porVencer.set(r.porVencer.map((m) => ({ ...m, diasRestantes: Number(m.diasRestantes) })));
        this.stockBajo.set(r.stock);
        this.ingresosMes.set(r.ingresos);
        this.cargarClasesHoy(r.horarios);
        this.proximoTorneo.set(
          r.torneos.filter((t) => t.estado && t.fecha >= this.hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))[0] ?? null,
        );
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        alertaError(e, 'No se pudo cargar el panel');
      },
    });
  }

  /** Clases activas que se dictan hoy, con su ocupación. */
  private cargarClasesHoy(horarios: Horario[]): void {
    const dia = nombreDia(this.hoy);
    const deHoy = ordenarClases(
      horarios.filter((h) => h.estado && (h.fecha ? h.fecha === this.hoy : h.dia === dia)),
    );
    if (!deHoy.length) {
      this.clasesHoy.set([]);
      return;
    }
    forkJoin(
      deHoy.map((h) =>
        this.consultaService.cupos(h.idHorario!, this.hoy).pipe(
          map((c) => ({ horario: h, ocupados: Number(c[0]?.ocupados ?? 0), cupo: Number(c[0]?.cupoMaximo ?? h.cupoMaximo ?? 0) })),
          catchError(() => of({ horario: h, ocupados: 0, cupo: h.cupoMaximo ?? 0 })),
        ),
      ),
    ).subscribe((lista) => this.clasesHoy.set(lista));
  }
}
