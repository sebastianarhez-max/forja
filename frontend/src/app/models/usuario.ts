/** Cuenta de administrador (las únicas que inician sesión). */
export interface Usuario {
  idUsuario?: number;
  nombres: string;
  apellidos: string;
  dni?: string;
  login: string;
  password?: string; // solo se envía al crear o cambiar la contraseña
  correo?: string;
  telefono?: string;
  fechaRegistro?: string;
  estado: boolean;
}
