import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from '../app.settings';
import { Opcion } from '../models/opcion';

export interface LoginUsuario {
  login: string;
  password: string;
}

/** Respuesta de POST /url/auth/login */
export interface JwtDTO {
  bearer: string;
  token: string;
  idUsuario: number;
  nombreCompleto: string;
  roles: string[];
  opciones: Opcion[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(datos: LoginUsuario): Observable<JwtDTO> {
    return this.http.post<JwtDTO>(AppSettings.API_ENDPOINT + '/auth/login', datos);
  }
}
