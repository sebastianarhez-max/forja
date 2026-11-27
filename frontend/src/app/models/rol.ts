import { Opcion } from './opcion';

/** Rol del sistema (tabla rol) con las opciones del menú que puede ver (tabla rol_has_opcion). */
export interface Rol {
  idRol?: number;
  nombre: string;
  estado: boolean;
  /** Al guardar basta con enviar los ids: [{ idOpcion: 1 }, { idOpcion: 4 }] */
  opciones?: Partial<Opcion>[];
}

/** El rol 1 es el Administrador principal: tiene todo y no se modifica. */
export const ID_ROL_ADMINISTRADOR = 1;
