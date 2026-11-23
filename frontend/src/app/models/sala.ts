/** Ambiente del gimnasio donde se dicta una clase (Sala 1, Sala 2...). */
export interface Sala {
  idSala?: number;
  nombre: string;
  capacidad: number;
  descripcion?: string;
  estado: boolean;
}
