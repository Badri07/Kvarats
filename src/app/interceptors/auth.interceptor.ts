import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../service/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const token = localStorage.getItem('token');
  let headers = req.headers;
  if (!headers.has('Content-Type') && !(req.body instanceof FormData)) {
    headers = headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  const clonedReq = req.clone({ headers });
  return next(clonedReq).pipe(
    catchError((error: any) => {
      if (error.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          const data = { refreshToken };

          return authService.getRefreshToken(data).pipe(
            switchMap((res: any) => {
              const newToken = res.token;
              localStorage.setItem('token', newToken);

              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${newToken}`)
              });

              return next(retryReq);
            }),
            catchError(err => {
              authService.logout();
              return throwError(() => err);
            })
          );
        }
        authService.logout();
      }

      return throwError(() => error);
    })
  );

}
