import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Ingresos, MembresiaVigente, ProductoStockBajo } from '../models/consultas';
import { Horario } from '../models/horario';
import { ConsultaService } from '../services/consulta-service';
import { HorarioService } from '../services/horario-service';
import { TorneoService } from '../services/torneo-service';
import { Torneo } from '../models/torneo';
import { TokenService } from '../security/token.service';
import { FechaPipe, HoraPipe, SolesPipe } from '../shared/pipes';
import { alertaError, hoyIso, nombreDia, ordenarClases } from '../shared/util';

interface ClaseHoy {
  horario: Horario;
  ocupados: number;
  cupo: number;
}

/**
 * Panel de inicio: indicadores del día y accesos rápidos.
 * Cada bloque solo se muestra (y solo se consulta al backend) si el rol del usuario tiene esa opción.
 */
@Component({
  selector: 'app-index',
  imports: [RouterLink, SolesPipe, HoraPipe, FechaPipe],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent implements OnInit {
  private readonly consultaService = inject(ConsultaService);
  private readonly horarioService = inject(HorarioService);
  private readonly torneoService = inject(TorneoService);

  private readonly tokenService = inject(TokenService);
  readonly nombre = this.tokenService.getNombreCompleto().split(' ')[0];

  /** Qué partes del panel puede ver el usuario según las opciones de su rol. */
  readonly ver = {
    asistencia: this.tokenService.tieneOpcion('asistencia'),
    clasesLibres: this.tokenService.tieneOpcion('clases-libres'),
    membresias: this.tokenService.tieneOpcion('membresias'),
    tienda: this.tokenService.tieneOpcion('tienda'),
    reportes: this.tokenService.tieneOpcion('reportes'),
    torneos: this.tokenService.tieneOpcion('torneos'),
  };
  /** Las clases del día interesan a quien atiende reservas o cobra clases libres. */
  readonly verClases = this.ver.asistencia || this.ver.clasesLibres;
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
    // Lo que el rol no tiene no se pide al backend (respondería 403)
    forkJoin({
      vigentes: this.ver.membresias ? this.consultaService.membresiasVigentes() : of([] as MembresiaVigente[]),
      porVencer: this.ver.membresias ? this.consultaService.membresiasPorVencer(7) : of([] as MembresiaVigente[]),
      stock: this.ver.tienda ? this.consultaService.productosStockBajo() : of([] as ProductoStockBajo[]),
      ingresos: this.ver.reportes ? this.consultaService.ingresos(primerDiaMes, this.hoy) : of(null),
      horarios: this.verClases ? this.horarioService.lista() : of([] as Horario[]),
      torneos: this.ver.torneos ? this.torneoService.lista() : of([] as Torneo[]),
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
