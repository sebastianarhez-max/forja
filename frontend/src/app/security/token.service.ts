import { Injectable } from '@angular/core';

const TOKEN_KEY = 'AuthToken';
const USER_ID_KEY = 'AuthUserId';
const USERNAME_KEY = 'AuthUserName';
const NAME_KEY = 'AuthName';

/** Datos que el backend guarda dentro del token JWT (ver JwtProvider.java). */
interface PayloadJwt {
  idUsuario: number;
  nombreCompleto: string;
  login: string;
  roles: string[];
  exp: number; // segundos desde 1970
}

/**
 * Guarda la sesión del administrador en sessionStorage (se borra al cerrar el navegador),
 * igual que el TokenService del proyecto guía.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  guardarSesion(token: string): void {
    const p = this.leerPayload(token);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_ID_KEY, String(p?.idUsuario ?? ''));
    sessionStorage.setItem(USERNAME_KEY, p?.login ?? '');
    sessionStorage.setItem(NAME_KEY, p?.nombreCompleto ?? '');
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  getUserId(): number | null {
    const id = sessionStorage.getItem(USER_ID_KEY);
    return id ? Number(id) : null;
  }

  getUserName(): string {
    return sessionStorage.getItem(USERNAME_KEY) ?? '';
  }

  getNombreCompleto(): string {
    return sessionStorage.getItem(NAME_KEY) ?? '';
  }

  /** Hay sesión si existe un token y todavía no venció (dura 10 horas). */
  estaLogueado(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const p = this.leerPayload(token);
    return !!p && p.exp * 1000 > Date.now();
  }

  logOut(): void {
    sessionStorage.clear();
  }

  /** El payload es la parte central del JWT, codificada en Base64URL. */
  private leerPayload(token: string): PayloadJwt | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(json) as PayloadJwt;
    } catch {
      return null;
    }
  }
}
