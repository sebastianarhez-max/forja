import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { TokenService } from '../security/token.service';

/**
 * 1) Agrega "Authorization: Bearer <token>" a cada petición al backend.
 * 2) Si el backend responde 401 (token vencido o cuenta desactivada), cierra la sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const token = tokenService.getToken();
  const esLogin = req.url.endsWith('/auth/login');

  const peticion =
    token && !esLogin ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !esLogin) {
        tokenService.logOut();
        if (!Swal.isVisible()) Swal.fire({
          icon: 'warning',
          title: 'Sesión finalizada',
          text: 'Tu sesión expiró. Vuelve a iniciar sesión.',
          confirmButtonColor: '#c2410c',
        });
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
