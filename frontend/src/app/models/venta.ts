import { Producto } from './producto';

export interface ItemVenta {
  idProducto: number;
  cantidad: number;
}

/** Cuerpo de POST /url/registro/venta */
export interface VentaRegistro {
  idUsuario: number | null;
  idCliente: number | null;
  items: ItemVenta[];
}

export interface DetalleVenta {
  idDetalle: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaRespuesta {
  venta: { idVenta: number; fecha: string; total: number };
  detalles: DetalleVenta[];
}
