import { Cliente } from './cliente';
import { Entrenador } from './entrenador';

/** Competencia o evento interno del gimnasio. */
export interface Torneo {
  idTorneo?: number;
  nombre: string;
  descripcion?: string;
  fecha: string; // yyyy-MM-dd
  lugar?: string;
  estado: boolean;
}

/** Socio inscrito en un torneo, con su categoría y su resultado. */
export interface InscripcionTorneo {
  idInscripcion?: number;
  cliente: Partial<Cliente> & { idCliente: number };
  torneo: Partial<Torneo> & { idTorneo: number };
  entrenador?: (Partial<Entrenador> & { idEntrenador: number }) | null;
  categoria?: string;
  sexo?: string;
  pesoMinimo?: number | null;
  pesoMaximo?: number | null;
  fechaInscripcion?: string;
  puesto?: number | null;
  puntaje?: number | null;
  observaciones?: string;
  estado: boolean;
}
