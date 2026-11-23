export interface Cliente {
  idCliente?: number;
  nombres: string;
  apellidos: string;
  dni?: string;
  correo?: string;
  telefono?: string;
  fechaNacimiento?: string | null;
  direccion?: string;
  fechaRegistro?: string;
  estado: boolean;
}
