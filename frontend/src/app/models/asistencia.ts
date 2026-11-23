import { Cliente } from './cliente';
import { Horario } from './horario';

export type EstadoAsistencia = 'RESERVADO' | 'ASISTIO' | 'FALTO';

export interface Asistencia {
  idAsistencia: number;
  horario: Horario;
  cliente: Cliente;
  fecha: string;
  horaIngreso: string | null;
  estado: EstadoAsistencia;
  montoPagado: number;
}

/** Cuerpo de /url/registro/asistencia/reservar e /ingreso */
export interface AsistenciaRegistro {
  idHorario: number;
  idCliente: number;
  idUsuario: number | null;
  fecha: string;
  idTipoPago?: number | null;
}
