import { Cliente } from './cliente';
import { Plan } from './plan';
import { TipoPago } from './tipo-pago';

export interface Membresia {
  idMembresia: number;
  cliente: Cliente;
  plan: Plan;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
}

export interface Pago {
  idPago: number;
  membresia: Membresia;
  tipoPago: TipoPago;
  monto: number;
  fecha: string;
  concepto: string;
}

/** Cuerpo de POST /url/registro/membresia */
export interface MembresiaRegistro {
  idCliente: number;
  idPlan: number;
  idTipoPago: number;
  fechaInicio?: string | null;
}
