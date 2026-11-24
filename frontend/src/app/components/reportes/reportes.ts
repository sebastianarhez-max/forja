import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ClaseConcurrenciaDTO,
  IngresoMetodoPagoDTO,
  Ingresos,
  MembresiaPlanDTO,
  ProductoVendidoDTO,
} from '../../models/consultas';
import { ConsultaService } from '../../services/consulta-service';
import { ReporteService } from '../../services/reporte-service';
import { SolesPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, hoyIso } from '../../shared/util';

interface Barra {
  etiqueta: string;
  valor: number;
  detalle: string;
}

/** Reportes de gestión (backlog #7): membresías, ingresos, clases y productos. */
@Component({
  selector: 'app-reportes',
  imports: [FormsModule, SolesPipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  private readonly reporteService = inject(ReporteService);
  private readonly consultaService = inject(ConsultaService);

  readonly desde = signal(hoyIso().substring(0, 5) + '01-01'); // inicio del año
  readonly hasta = signal(hoyIso());
  readonly ingresos = signal<Ingresos | null>(null);
  readonly porMetodo = signal<IngresoMetodoPagoDTO[]>([]);
  readonly porPlan = signal<MembresiaPlanDTO[]>([]);
  readonly clases = signal<ClaseConcurrenciaDTO[]>([]);
  readonly productos = signal<ProductoVendidoDTO[]>([]);

  readonly barrasMetodo = computed<Barra[]>(() =>
    this.porMetodo().map((x) => ({ etiqueta: x.tipoPago, valor: Number(x.total), detalle: `${x.cantidad} pago(s)` })),
  );
  readonly barrasPlan = computed<Barra[]>(() =>
    this.porPlan().map((x) => ({ etiqueta: x.plan, valor: Number(x.cantidad), detalle: '' })),
  );
  readonly barrasClases = computed<Barra[]>(() =>
    this.clases().map((x) => ({ etiqueta: x.actividad, valor: Number(x.cantidad), detalle: '' })),
  );
  readonly barrasProductos = computed<Barra[]>(() =>
    this.productos().map((x) => ({ etiqueta: x.producto, valor: Number(x.unidades), detalle: `S/ ${Number(x.total).toFixed(2)}` })),
  );

  ngOnInit(): void {
    forkJoin({
      plan: this.reporteService.membresiasPorPlan(),
      clases: this.reporteService.clasesMasConcurridas(),
      productos: this.reporteService.productosMasVendidos(),
    }).subscribe({
      next: (r) => {
        this.porPlan.set(r.plan);
        this.clases.set(r.clases);
        this.productos.set(r.productos);
      },
      error: (e) => alertaError(e, 'No se pudo cargar los reportes'),
    });
    this.consultarIngresos();
  }

  consultarIngresos(): void {
    if (!this.desde() || !this.hasta() || this.desde() > this.hasta()) {
      alertaAviso('La fecha "desde" debe ser anterior o igual a "hasta"');
      return;
    }
    forkJoin({
      ingresos: this.consultaService.ingresos(this.desde(), this.hasta()),
      metodo: this.reporteService.ingresosPorMetodoPago(this.desde(), this.hasta()),
    }).subscribe({
      next: (r) => {
        this.ingresos.set(r.ingresos);
        this.porMetodo.set(r.metodo);
      },
      error: (e) => alertaError(e),
    });
  }

  /** Ancho porcentual de cada barra respecto a la mayor. */
  ancho(lista: Barra[], b: Barra): number {
    const max = Math.max(...lista.map((x) => x.valor), 1);
    return Math.max(4, (b.valor / max) * 100);
  }

  porcentaje(parte: number | undefined): number {
    const total = Number(this.ingresos()?.total ?? 0);
    return total ? Math.round((Number(parte ?? 0) / total) * 100) : 0;
  }
}
