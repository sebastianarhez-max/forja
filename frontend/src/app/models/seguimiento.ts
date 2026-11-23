import { Cliente } from './cliente';
import { Entrenador } from './entrenador';

/** Medición física de un socio en una fecha. */
export interface EvaluacionFisica {
  idEvaluacion?: number;
  cliente: Partial<Cliente> & { idCliente: number };
  fecha: string;
  peso: number; // kg
  altura: number; // m
  imc: number;
  grasaCorporal?: number | null; // %
  observaciones?: string;
}

export interface Ejercicio {
  nombre: string;
  series: number;
  repeticiones: number;
  descansoSeg: number;
}

/** Rutina que un entrenador asigna a un socio. */
export interface Rutina {
  idRutina?: number;
  cliente: Partial<Cliente> & { idCliente: number };
  entrenador: Partial<Entrenador> & { idEntrenador: number };
  nombre: string;
  objetivo?: string;
  ejercicios: Ejercicio[];
  fechaCreacion?: string;
  estado: boolean;
}
