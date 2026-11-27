/** Opción del menú lateral (tabla opcion). La ruta es la de app.routes.ts. */
export interface Opcion {
  idOpcion: number;
  nombre: string;
  ruta: string;
  tipo: number; // grupo del menú (ver GRUPOS_MENU)
  orden?: number;
  estado?: boolean;
}

/** Grupos del menú lateral: el campo tipo de cada opción indica en cuál aparece. */
export const GRUPOS_MENU = [
  { tipo: 1, titulo: 'Día a día' },
  { tipo: 2, titulo: 'Gestión' },
  { tipo: 3, titulo: 'Configuración' },
];
