import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from '../app.settings';
import { Respuesta } from '../models/respuesta';

/**
 * Operaciones comunes de los mantenimientos del backend:
 * GET /url/{recurso}, GET /{id}, POST, PUT /{id}, DELETE /{id} (baja lógica).
 * Cada servicio concreto solo indica su recurso (actividad, sala, cliente...).
 */
export abstract class CrudService<T> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly recurso: string;

  protected get url(): string {
    return `${AppSettings.API_ENDPOINT}/${this.recurso}`;
  }

  lista(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  buscar(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  registrar(obj: T): Observable<Respuesta<T>> {
    return this.http.post<Respuesta<T>>(this.url, obj);
  }

  actualizar(id: number, obj: T): Observable<Respuesta<T>> {
    return this.http.put<Respuesta<T>>(`${this.url}/${id}`, obj);
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }
}
