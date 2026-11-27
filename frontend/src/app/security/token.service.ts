import { Injectable } from '@angular/core';
import { Opcion } from '../models/opcion';

const TOKEN_KEY = 'AuthToken';
const USER_ID_KEY = 'AuthUserId';
const USERNAME_KEY = 'AuthUserName';
const NAME_KEY = 'AuthName';
const AUTHORITIES_KEY = 'AuthAuthorities';
const OPCIONES_KEY = 'Opciones';

/** Datos que el backend guarda dentro del token JWT (ver JwtProvider.java). */
interface PayloadJwt {
  idUsuario: number;
  nombreCompleto: string;
  login: string;
  roles: string[];
  opciones: Opcion[];
  exp: number; // segundos desde 1970
}

/**
 * Guarda la sesión en sessionStorage (se borra al cerrar el navegador), igual que el
 * TokenService del proyecto guía: token, datos del usuario, roles y opciones del menú.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  guardarSesion(token: string): void {
    const p = this.leerPayload(token);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_ID_KEY, String(p?.idUsuario ?? ''));
    sessionStorage.setItem(USERNAME_KEY, p?.login ?? '');
    sessionStorage.setItem(NAME_KEY, p?.nombreCompleto ?? '');
    sessionStorage.setItem(AUTHORITIES_KEY, JSON.stringify(p?.roles ?? []));
    sessionStorage.setItem(OPCIONES_KEY, JSON.stringify(p?.opciones ?? []));
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

  /** Nombres de los roles del usuario logueado (por ejemplo ["Vendedor"]). */
  getRoles(): string[] {
    return this.leerLista<string>(AUTHORITIES_KEY);
  }

  /** Opciones del menú que puede ver el usuario logueado, en el orden del menú. */
  getOpciones(): Opcion[] {
    return this.leerLista<Opcion>(OPCIONES_KEY);
  }

  /** true si el usuario tiene la opción del menú con esa ruta (por ejemplo 'tienda'). */
  tieneOpcion(ruta: string): boolean {
    return this.getOpciones().some((o) => o.ruta === ruta);
  }

  /** Primera pantalla a la que puede entrar (para redirigir si intenta abrir otra). */
  primeraRuta(): string {
    return '/' + (this.getOpciones()[0]?.ruta ?? 'login');
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

  private leerLista<T>(key: string): T[] {
    try {
      const lista = JSON.parse(sessionStorage.getItem(key) ?? '[]');
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
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
