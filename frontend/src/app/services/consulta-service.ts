import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from '../app.settings';
import {
  Asistente,
  Cupos,
  HistorialAsistencia,
  HorarioSala,
  Ingresos,
  MembresiaVigente,
  ProductoStockBajo,
  RecaudadoClase,
  RecaudadoPorPago,
  ResumenSala,
  VentaHistorial,
} from '../models/consultas';

/** Consultas en SQL nativo del backend (/url/consulta). */
@Injectable({ providedIn: 'root' })
export class ConsultaService {
  private readonly http = inject(HttpClient);
  private readonly url = AppSettings.API_ENDPOINT + '/consulta';

  private claseFecha(idHorario: number, fecha: string): HttpParams {
    return new HttpParams().set('idHorario', idHorario).set('fecha', fecha);
  }

  asistencia(idHorario: number, fecha: string): Observable<Asistente[]> {
    return this.http.get<Asistente[]>(`${this.url}/asistencia`, { params: this.claseFecha(idHorario, fecha) });
  }

  cupos(idHorario: number, fecha: string): Observable<Cupos[]> {
    return this.http.get<Cupos[]>(`${this.url}/cupos`, { params: this.claseFecha(idHorario, fecha) });
  }

  recaudadoClase(idHorario: number, fecha: string): Observable<RecaudadoClase[]> {
    return this.http.get<RecaudadoClase[]>(`${this.url}/recaudado-clase`, { params: this.claseFecha(idHorario, fecha) });
  }

  recaudadoPorPago(idHorario: number, fecha: string): Observable<RecaudadoPorPago[]> {
    return this.http.get<RecaudadoPorPago[]>(`${this.url}/recaudado-clase/por-pago`, {
      params: this.claseFecha(idHorario, fecha),
    });
  }

  membresiasVigentes(): Observable<MembresiaVigente[]> {
    return this.http.get<MembresiaVigente[]>(`${this.url}/membresias-vigentes`);
  }

  membresiasPorVencer(dias: number): Observable<MembresiaVigente[]> {
    return this.http.get<MembresiaVigente[]>(`${this.url}/membresias-por-vencer`, {
      params: new HttpParams().set('dias', dias),
    });
  }

  historialAsistencia(idCliente: number): Observable<HistorialAsistencia[]> {
    return this.http.get<HistorialAsistencia[]>(`${this.url}/cliente/${idCliente}/historial-asistencia`);
  }

  productosStockBajo(): Observable<ProductoStockBajo[]> {
    return this.http.get<ProductoStockBajo[]>(`${this.url}/productos-stock-bajo`);
  }

  ventas(desde: string, hasta: string): Observable<VentaHistorial[]> {
    return this.http.get<VentaHistorial[]>(`${this.url}/ventas`, {
      params: new HttpParams().set('desde', desde).set('hasta', hasta),
    });
  }

  ingresos(desde: string, hasta: string): Observable<Ingresos> {
    return this.http.get<Ingresos>(`${this.url}/ingresos`, {
      params: new HttpParams().set('desde', desde).set('hasta', hasta),
    });
  }

  horariosSala(idSala: number): Observable<HorarioSala[]> {
    return this.http.get<HorarioSala[]>(`${this.url}/sala/${idSala}/horarios`);
  }

  resumenSalas(): Observable<ResumenSala[]> {
    return this.http.get<ResumenSala[]>(`${this.url}/salas-resumen`);
  }
}
