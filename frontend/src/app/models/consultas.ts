/** Filas que devuelven las consultas (/url/consulta/...) y reportes (/url/reporte/...). */

export interface Cupos {
  cupoMaximo: number;
  ocupados: number;
  disponibles: number;
}

export interface Asistente {
  idAsistencia: number;
  idCliente: number;
  nombres: string;
  apellidos: string;
  estado: 'RESERVADO' | 'ASISTIO' | 'FALTO';
  horaIngreso: string | null;
  montoPagado: number;
}

export interface RecaudadoClase {
  clase: string;
  horaInicio: string;
  horaFin: string;
  precioEntrada: number;
  personasIngresaron: number;
  totalRecaudado: number;
}

export interface RecaudadoPorPago {
  tipoPago: string;
  cantidad: number;
  total: number;
}

export interface MembresiaVigente {
  idMembresia: number;
  idCliente: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  plan: string;
  fechaInicio?: string;
  fechaFin: string;
  diasRestantes: number;
}

export interface ProductoStockBajo {
  idProducto: number;
  nombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
}

export interface VentaHistorial {
  idVenta: number;
  fecha: string;
  vendedor: string;
  cliente: string;
  total: number;
}

export interface Ingresos {
  membresias: number;
  ventasTienda: number;
  clasesLibres: number;
  total: number;
}

export interface HorarioSala {
  idHorario: number;
  actividad: string;
  entrenador: string;
  dia: string;
  fecha: string | null;
  horaInicio: string;
  horaFin: string;
  cupoMaximo: number;
  tipoAcceso: string;
  precioEntrada: number;
}

export interface ResumenSala {
  idSala: number;
  nombre: string;
  capacidad: number;
  estado: boolean;
  clasesActivas: number;
  horasSemana: number;
}

export interface HistorialAsistencia {
  fecha: string;
  actividad: string;
  entrenador: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  montoPagado: number;
}

// ---- Reportes (DTO) ----
export interface ReporteCantidad {
  etiqueta: string;
  cantidad: number;
  total?: number;
}
export interface MembresiaPlanDTO { plan: string; cantidad: number; }
export interface IngresoMetodoPagoDTO { tipoPago: string; cantidad: number; total: number; }
export interface ClaseConcurrenciaDTO { actividad: string; cantidad: number; }
export interface ProductoVendidoDTO { producto: string; unidades: number; total: number; }
