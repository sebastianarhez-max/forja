import { Pipe, PipeTransform } from '@angular/core';
import { diaConTilde, horaCorta } from './util';

/** 120 -> "S/ 120.00" */
@Pipe({ name: 'soles' })
export class SolesPipe implements PipeTransform {
  transform(valor: number | string | null | undefined): string {
    const n = Number(valor ?? 0);
    return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

/** "2026-10-05" o "2026-10-05T18:02:00-05:00" -> "05/10/2026" */
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '—';
    const s = String(valor);
    if (/^\d{4}-\d{2}-\d{2}/.test(s) && (s.length === 10 || !/[+-]\d{2}:\d{2}$|Z$/.test(s))) {
      const [a, m, d] = s.substring(0, 10).split('-');
      return `${d}/${m}/${a}`;
    }
    const f = new Date(s);
    return isNaN(f.getTime()) ? s : f.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

/** "18:02:00" o un timestamp -> "18:02" */
@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '—';
    const s = String(valor);
    if (/^\d{2}:\d{2}/.test(s)) return horaCorta(s);
    // Fecha-hora sin zona (LocalDateTime) o con zona: se muestra en hora local
    const f = new Date(s);
    if (isNaN(f.getTime())) return s;
    return f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

/** "Miercoles" -> "Miércoles" */
@Pipe({ name: 'dia' })
export class DiaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return diaConTilde(valor);
  }
}

/** RESERVADO / ASISTIO / FALTO -> texto para el administrador */
@Pipe({ name: 'estadoAsistencia' })
export class EstadoAsistenciaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    switch (valor) {
      case 'RESERVADO': return 'Reservado';
      case 'ASISTIO': return 'Asistió';
      case 'FALTO': return 'Faltó';
      default: return valor ?? '';
    }
  }
}
