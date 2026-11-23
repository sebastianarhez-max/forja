import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VentaHistorial } from '../../models/consultas';
import { ConsultaService } from '../../services/consulta-service';
import { FechaPipe, HoraPipe, SolesPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, hoyIso } from '../../shared/util';

/** HU05 · Historial de ventas entre dos fechas. */
@Component({
  selector: 'app-historial',
  imports: [FormsModule, FechaPipe, HoraPipe, SolesPipe],
  template: `
    <section class="card">
      <h2 class="card-title">Ventas por período</h2>
      <div class="form-actions" style="margin-bottom: 14px; align-items: flex-end">
        <div class="field"><label for="desde">Desde</label><input id="desde" type="date" [ngModel]="desde()" (ngModelChange)="desde.set($event)" /></div>
        <div class="field"><label for="hasta">Hasta</label><input id="hasta" type="date" [ngModel]="hasta()" (ngModelChange)="hasta.set($event)" /></div>
        <button class="btn btn-outline" type="button" (click)="consultar()">Consultar</button>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-label">Ventas</div><div class="stat-value">{{ lista().length }}</div></div>
        <div class="stat dark"><div class="stat-label">Total vendido</div><div class="stat-value">{{ total() | soles }}</div></div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Venta</th><th>Fecha</th><th>Hora</th><th>Vendedor</th><th>Socio</th><th class="num">Total</th></tr></thead>
          <tbody>
            @for (v of lista(); track v.idVenta) {
              <tr>
                <td>N.° {{ v.idVenta }}</td>
                <td>{{ v.fecha | fecha }}</td>
                <td>{{ v.fecha | hora }}</td>
                <td>{{ v.vendedor }}</td>
                <td [class.muted]="v.cliente === 'Público general'">{{ v.cliente }}</td>
                <td class="num strong">{{ v.total | soles }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="vacio">No hay ventas en ese período</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class Historial implements OnInit {
  private readonly consultaService = inject(ConsultaService);
  readonly desde = signal(hoyIso().substring(0, 8) + '01'); // primer día del mes
  readonly hasta = signal(hoyIso());
  readonly lista = signal<VentaHistorial[]>([]);
  readonly total = computed(() => this.lista().reduce((t, v) => t + Number(v.total), 0));

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    if (!this.desde() || !this.hasta() || this.desde() > this.hasta()) {
      alertaAviso('La fecha "desde" debe ser anterior o igual a "hasta"');
      return;
    }
    this.consultaService.ventas(this.desde(), this.hasta()).subscribe({
      next: (d) => this.lista.set(d),
      error: (e) => alertaError(e),
    });
  }
}
