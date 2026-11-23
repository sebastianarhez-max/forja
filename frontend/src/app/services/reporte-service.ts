import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from '../app.settings';
import {
  ClaseConcurrenciaDTO,
  IngresoMetodoPagoDTO,
  MembresiaPlanDTO,
  ProductoVendidoDTO,
} from '../models/consultas';

/** Reportes agregados para gráficos (/url/reporte). */
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = AppSettings.API_ENDPOINT + '/reporte';

  membresiasPorPlan(): Observable<MembresiaPlanDTO[]> {
    return this.http.get<MembresiaPlanDTO[]>(`${this.url}/membresias-por-plan`);
  }

  ingresosPorMetodoPago(desde: string, hasta: string): Observable<IngresoMetodoPagoDTO[]> {
    return this.http.get<IngresoMetodoPagoDTO[]>(`${this.url}/ingresos-por-metodo-pago`, {
      params: new HttpParams().set('desde', desde).set('hasta', hasta),
    });
  }

  clasesMasConcurridas(): Observable<ClaseConcurrenciaDTO[]> {
    return this.http.get<ClaseConcurrenciaDTO[]>(`${this.url}/clases-mas-concurridas`);
  }

  productosMasVendidos(): Observable<ProductoVendidoDTO[]> {
    return this.http.get<ProductoVendidoDTO[]>(`${this.url}/productos-mas-vendidos`);
  }
}
