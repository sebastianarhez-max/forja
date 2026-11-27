import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoStockBajo } from '../../models/consultas';
import { ConsultaService } from '../../services/consulta-service';
import { alertaError } from '../../shared/util';

/** HU05 · Productos activos con stock menor o igual al mínimo (por reponer). */
@Component({
  selector: 'app-stock-bajo',
  imports: [RouterLink],
  template: `
    <section class="card">
      <h2 class="card-title">Productos por reponer</h2>
      <p class="card-sub">Productos activos con stock menor o igual al mínimo.</p>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Producto</th><th>Categoría</th><th class="num">Stock</th><th class="num">Mínimo</th><th>Acción</th></tr></thead>
          <tbody>
            @for (p of lista(); track p.idProducto) {
              <tr>
                <td class="strong">{{ p.nombre }}</td>
                <td>{{ p.categoria }}</td>
                <td class="num"><span class="badge badge-bad">{{ p.stock }}</span></td>
                <td class="num">{{ p.stockMinimo }}</td>
                <td><a class="btn btn-outline btn-sm" routerLink="/tienda/reposicion" [queryParams]="{ idProducto: p.idProducto }">Reponer</a></td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="vacio">Todo el inventario está por encima del mínimo</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class StockBajo implements OnInit {
  private readonly consultaService = inject(ConsultaService);
  readonly lista = signal<ProductoStockBajo[]>([]);

  ngOnInit(): void {
    this.consultaService.productosStockBajo().subscribe({
      next: (d) => this.lista.set(d),
      error: (e) => alertaError(e),
    });
  }
}
