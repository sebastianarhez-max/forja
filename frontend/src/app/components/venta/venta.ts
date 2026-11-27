import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../models/cliente';
import { Producto } from '../../models/producto';
import { VentaRespuesta } from '../../models/venta';
import { ClienteService } from '../../services/cliente-service';
import { ProductoService } from '../../services/producto-service';
import { RegistroService } from '../../services/registro-service';
import { TokenService } from '../../security/token.service';
import { SolesPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, alertaExito } from '../../shared/util';

interface LineaVenta {
  producto: Producto;
  cantidad: number;
}

/** HU05 · Registrar una venta: descuenta stock y calcula el total (todo o nada). */
@Component({
  selector: 'app-venta',
  imports: [FormsModule, SolesPipe],
  templateUrl: './venta.html',
})
export class Venta implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly registroService = inject(RegistroService);
  private readonly tokenService = inject(TokenService);

  readonly vendedor = this.tokenService.getUserName();
  readonly clientes = signal<Cliente[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly idCliente = signal<number | null>(null);
  readonly idProductoNuevo = signal<number | null>(null);
  readonly cantidadNueva = signal(1);
  readonly lineas = signal<LineaVenta[]>([]);
  readonly guardando = signal(false);
  readonly ultimaVenta = signal<VentaRespuesta | null>(null);

  readonly total = computed(() =>
    Math.round(this.lineas().reduce((t, l) => t + l.producto.precio * l.cantidad, 0) * 100) / 100,
  );
  readonly disponibles = computed(() => this.productos().filter((p) => !this.lineas().some((l) => l.producto.idProducto === p.idProducto)));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    forkJoin({ clientes: this.clienteService.lista(), productos: this.productoService.lista() }).subscribe({
      next: ({ clientes, productos }) => {
        this.clientes.set(clientes.filter((c) => c.estado).sort((a, b) => a.nombres.localeCompare(b.nombres)));
        this.productos.set(productos.filter((p) => p.estado).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      },
      error: (e) => alertaError(e, 'No se pudo cargar los datos'),
    });
  }

  agregar(): void {
    const p = this.productos().find((x) => x.idProducto === this.idProductoNuevo());
    const c = Number(this.cantidadNueva());
    if (!p) {
      alertaAviso('Selecciona un producto');
      return;
    }
    if (!Number.isInteger(c) || c <= 0) {
      alertaAviso('La cantidad debe ser un número entero mayor a 0');
      return;
    }
    if (c > p.stock) {
      alertaAviso(`Stock insuficiente de ${p.nombre} (disponible: ${p.stock})`);
      return;
    }
    this.lineas.update((l) => [...l, { producto: p, cantidad: c }]);
    this.idProductoNuevo.set(null);
    this.cantidadNueva.set(1);
  }

  cambiarCantidad(linea: LineaVenta, valor: number): void {
    const c = Math.max(1, Math.min(Number(valor) || 1, linea.producto.stock));
    this.lineas.update((l) => l.map((x) => (x === linea ? { ...x, cantidad: c } : x)));
  }

  quitar(linea: LineaVenta): void {
    this.lineas.update((l) => l.filter((x) => x !== linea));
  }

  registrar(): void {
    if (this.lineas().length === 0) {
      alertaAviso('La venta debe tener al menos un producto');
      return;
    }
    this.guardando.set(true);
    this.registroService
      .registrarVenta({
        idUsuario: this.tokenService.getUserId(),
        idCliente: this.idCliente(),
        items: this.lineas().map((l) => ({ idProducto: l.producto.idProducto!, cantidad: l.cantidad })),
      })
      .subscribe({
        next: (r) => {
          this.guardando.set(false);
          this.ultimaVenta.set(r);
          alertaExito(`Venta N.° ${r.venta.idVenta} registrada: S/ ${r.venta.total.toFixed(2)}`);
          this.lineas.set([]);
          this.idCliente.set(null);
          this.cargar(); // stocks actualizados
        },
        error: (e) => {
          this.guardando.set(false);
          alertaError(e, 'No se registró la venta');
        },
      });
  }
}
