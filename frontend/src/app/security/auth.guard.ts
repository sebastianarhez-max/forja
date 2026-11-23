import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
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

/** Si ya hay sesión, la pantalla de login redirige al inicio. */
export const loginGuard: CanActivateFn = () => {
  return inject(TokenService).estaLogueado() ? inject(Router).createUrlTree(['/inicio']) : true;
};
