import { Rol } from './rol';

/** Cuenta que inicia sesión en el sistema, con sus roles (tabla usuario_has_rol). */
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
  /** Al guardar basta con enviar los ids: [{ idRol: 2 }] */
  roles?: Partial<Rol>[];
}
