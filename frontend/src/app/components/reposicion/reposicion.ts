import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto-service';
import { alertaAviso, alertaError, alertaExito } from '../../shared/util';

/**
 * HU05 · Reposición de stock: se obtiene el producto y se envía por PUT con el stock FINAL.
 * Ej.: stock 10 + reposición 20 => se guarda stock 30 (el backend asigna, no suma).
 */
@Component({
  selector: 'app-reposicion',
  imports: [FormsModule],
  templateUrl: './reposicion.html',
})
export class Reposicion implements OnInit {
  private readonly productoService = inject(ProductoService);

  readonly idProductoParam = input<string | undefined>(undefined, { alias: 'idProducto' });

  readonly productos = signal<Producto[]>([]);
  readonly idProducto = signal<number | null>(null);
  readonly cantidad = signal<number | null>(null);
  readonly guardando = signal(false);

  readonly producto = computed(() => this.productos().find((p) => p.idProducto === this.idProducto()) ?? null);
  readonly stockFinal = computed(() => (this.producto()?.stock ?? 0) + Number(this.cantidad() ?? 0));

  ngOnInit(): void {
    this.cargar(Number(this.idProductoParam()) || null);
  }

  cargar(seleccionar: number | null): void {
    this.productoService.lista().subscribe({
      next: (d) => {
        this.productos.set(d.filter((p) => p.estado).sort((a, b) => a.nombre.localeCompare(b.nombre)));
        if (seleccionar) this.idProducto.set(seleccionar);
      },
      error: (e) => alertaError(e, 'No se pudo cargar los productos'),
    });
  }

  guardar(): void {
    const p = this.producto();
    const c = Number(this.cantidad());
    if (!p) {
      alertaAviso('Selecciona un producto');
      return;
    }
    if (!Number.isInteger(c) || c <= 0) {
      alertaAviso('La cantidad a reponer debe ser un número entero mayor a 0');
      return;
    }
    this.guardando.set(true);
    // Se obtiene el producto actualizado y se envía completo con el stock final
    this.productoService.buscar(p.idProducto!).subscribe({
      next: (actual) => {
        const final = actual.stock + c;
        this.productoService.actualizar(actual.idProducto!, { ...actual, stock: final }).subscribe({
          next: () => {
            this.guardando.set(false);
            alertaExito(`Stock de ${actual.nombre} actualizado a ${final}`);
            this.cantidad.set(null);
            this.cargar(actual.idProducto!);
          },
          error: (e) => {
            this.guardando.set(false);
            alertaError(e);
          },
        });
      },
      error: (e) => {
        this.guardando.set(false);
        alertaError(e);
      },
    });
  }
}
