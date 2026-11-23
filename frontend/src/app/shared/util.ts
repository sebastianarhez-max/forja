import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

/** Color principal de FORJA (también en styles.css como --primary). */
export const COLOR_PRIMARIO = '#c2410c';

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

/** Nombre del día como lo guarda el backend (sin tildes). */
export function nombreDia(fechaIso: string): string {
  const [a, m, d] = fechaIso.split('-').map(Number);
  const dia = new Date(a, m - 1, d).getDay(); // 0 = domingo
  return DIAS_SEMANA[(dia + 6) % 7];
}

/** "Miercoles" -> "Miércoles" (solo para mostrar). */
export function diaConTilde(dia: string | null | undefined): string {
  if (!dia) return '';
  return dia === 'Miercoles' ? 'Miércoles' : dia === 'Sabado' ? 'Sábado' : dia;
}

/** Fecha local en formato yyyy-MM-dd (la que entiende el backend). */
export function fechaIso(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function hoyIso(): string {
  return fechaIso(new Date());
}

export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return fechaIso(new Date(a, m - 1, d + dias));
}

/** Próxima fecha (desde hoy, incluido) que cae en el día de semana indicado. */
export function proximaFechaDelDia(dia: string): string {
  let f = hoyIso();
  for (let i = 0; i < 7; i++) {
    if (nombreDia(f) === dia) return f;
    f = sumarDias(f, 1);
  }
  return hoyIso();
}

/** "07:00:00" -> "07:00" */
export function horaCorta(h: string | null | undefined): string {
  return h ? h.substring(0, 5) : '';
}

/** Texto del error que devolvió el backend ({ error: "..." }) o uno genérico. */
export function mensajeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
    }
    const cuerpo = err.error as { error?: string; message?: string } | null;
    if (cuerpo?.error) return cuerpo.error;
    if (cuerpo?.message) return cuerpo.message;
    return `Error ${err.status} al comunicarse con el servidor`;
  }
  return 'Ocurrió un error inesperado';
}

// ---------------------------------------------------------------- alertas (SweetAlert2)
const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

export function alertaExito(texto: string): void {
  toast.fire({ icon: 'success', title: texto });
}

export function alertaError(err: unknown, titulo = 'No se pudo completar la operación'): void {
  // 401: el interceptor ya cerró la sesión y avisó al usuario
  if (err instanceof HttpErrorResponse && err.status === 401) return;
  Swal.fire({ icon: 'error', title: titulo, text: mensajeError(err), confirmButtonColor: COLOR_PRIMARIO });
}

export function alertaAviso(texto: string, titulo = 'Revisa los datos'): void {
  Swal.fire({ icon: 'warning', title: titulo, text: texto, confirmButtonColor: COLOR_PRIMARIO });
}

export async function confirmar(titulo: string, texto: string, boton = 'Sí, continuar'): Promise<boolean> {
  const r = await Swal.fire({
    icon: 'question',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: boton,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: COLOR_PRIMARIO,
    reverseButtons: true,
  });
  return r.isConfirmed;
}

// ---------------------------------------------------------------- clases (horarios)
/** "Crossfit · Lunes 07:00–08:00 · Sala 1" para los combos de selección de clase. */
export function textoClase(h: {
  actividad: { nombre?: string };
  dia: string;
  fecha?: string | null;
  horaInicio: string;
  horaFin: string;
  sala?: { nombre?: string } | null;
}): string {
  const cuando = h.fecha
    ? `${diaConTilde(h.dia)} ${h.fecha.split('-').reverse().join('/')}`
    : diaConTilde(h.dia);
  const sala = h.sala?.nombre ? ` · ${h.sala.nombre}` : '';
  return `${h.actividad.nombre ?? ''} · ${cuando} ${horaCorta(h.horaInicio)}–${horaCorta(h.horaFin)}${sala}`;
}

/** Orden natural: por día de la semana (o fecha) y luego por hora. */
export function ordenarClases<T extends { dia: string; horaInicio: string; fecha?: string | null }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    const da = DIAS_SEMANA.indexOf(a.dia);
    const db = DIAS_SEMANA.indexOf(b.dia);
    if (da !== db) return da - db;
    return a.horaInicio.localeCompare(b.horaInicio);
  });
}

/** Fecha sugerida para una clase: su fecha fija o el próximo día que se dicta. */
export function fechaSugerida(h: { dia: string; fecha?: string | null }): string {
  return h.fecha ?? proximaFechaDelDia(h.dia);
}
