/** Respuesta de los POST/PUT de los CRUD: { data, mensaje } */
export interface Respuesta<T> {
  data: T;
  mensaje: string;
}
