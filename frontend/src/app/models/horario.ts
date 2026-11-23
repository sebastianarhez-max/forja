import { Actividad } from './actividad';
import { Entrenador } from './entrenador';
import { Sala } from './sala';

export type TipoAcceso = 'MEMBRESIA' | 'LIBRE';

/** Una clase programada: actividad + entrenador + sala + día y horas. */
export interface Horario {
  idHorario?: number;
  actividad: Partial<Actividad> & { idActividad: number };
  entrenador: Partial<Entrenador> & { idEntrenador: number };
  sala?: (Partial<Sala> & { idSala: number }) | null;
  dia: string;
  fecha?: string | null; // yyyy-MM-dd (solo clases de un día específico)
  horaInicio: string; // HH:mm:ss
  horaFin: string;
  cupoMaximo?: number | null;
  tipoAcceso?: TipoAcceso;
  precioEntrada?: number;
  estado: boolean;
}
