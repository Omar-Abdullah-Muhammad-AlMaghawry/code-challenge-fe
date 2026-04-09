import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'An unexpected error occurred';
      if (error.status === 401) message = 'Unauthorized';
      else if (error.status === 403) message = 'Forbidden';
      else if (error.status === 404) message = 'Resource not found';
      else if (error.status >= 500) message = 'Server error';
      console.error(`[HTTP Error] ${error.status}: ${message}`, error);
      return throwError(() => new Error(message));
    })
  );
};
