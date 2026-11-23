import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from '../app.settings';
import { Asistencia, AsistenciaRegistro } from '../models/asistencia';
import { Membresia, MembresiaRegistro, Pago } from '../models/membresia';
import { VentaRegistro, VentaRespuesta } from '../models/venta';

/** Procesos con reglas de negocio (/url/registro): membresía + pago, venta + stock, asistencia. */
@Injectable({ providedIn: 'root' })
export class RegistroService {
  private readonly http = inject(HttpClient);
  private readonly url = AppSettings.API_ENDPOINT + '/registro';

  registrarMembresia(dto: MembresiaRegistro): Observable<{ membresia: Membresia; pago: Pago }> {
    return this.http.post<{ membresia: Membresia; pago: Pago }>(`${this.url}/membresia`, dto);
  }

  registrarVenta(dto: VentaRegistro): Observable<VentaRespuesta> {
    return this.http.post<VentaRespuesta>(`${this.url}/venta`, dto);
  }

  reservar(dto: AsistenciaRegistro): Observable<Asistencia> {
    return this.http.post<Asistencia>(`${this.url}/asistencia/reservar`, dto);
  }

  registrarIngreso(dto: AsistenciaRegistro): Observable<Asistencia> {
    return this.http.post<Asistencia>(`${this.url}/asistencia/ingreso`, dto);
  }

  marcarFalta(idAsistencia: number): Observable<Asistencia> {
    return this.http.put<Asistencia>(`${this.url}/asistencia/${idAsistencia}/falto`, {});
  }
}
