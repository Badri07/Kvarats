import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, catchError, throwError, TimeoutError } from 'rxjs';

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    timeout(10000),
    catchError(error => {
      if (error instanceof TimeoutError) {

        return throwError(() => new Error('Request timed out'));
      }
      return throwError(() => error);
    })
  );
};
