import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { TokenService } from './token.service';

/** Solo deja entrar a las pantallas internas si hay una sesión válida. */
export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  if (tokenService.estaLogueado()) {
    return true;
  }
  tokenService.logOut();
  return inject(Router).createUrlTree(['/login']);
};

/**
 * Solo deja abrir un módulo si su ruta está entre las opciones del rol del usuario
 * (las mismas que se ven en el menú). Si escribe en el navegador una ruta que no tiene,
 * se le manda a su primera opción.
 */
export const opcionGuard: CanActivateChildFn = (route) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  if (tokenService.getOpciones().length === 0) {
    // Usuario sin roles u opciones: no tiene nada que ver dentro del sistema
    tokenService.logOut();
    return router.parseUrl('/login');
  }
  // Módulo = primer segmento de la ruta (en /tienda/venta el módulo es "tienda")
  const modulo = route.pathFromRoot.map((r) => r.routeConfig?.path).find((p) => !!p) ?? '';
  if (!modulo || tokenService.tieneOpcion(modulo)) {
    return true;
  }
  return router.parseUrl(tokenService.primeraRuta());
};

/** Si ya hay sesión, la pantalla de login redirige a la primera opción del usuario. */
export const loginGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  if (!tokenService.estaLogueado()) {
    return true;
  }
  if (tokenService.getOpciones().length === 0) {
    tokenService.logOut();
    return true;
  }
  return inject(Router).parseUrl(tokenService.primeraRuta());
};
