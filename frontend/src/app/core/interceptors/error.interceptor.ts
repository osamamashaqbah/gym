import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
      } else if (err.status === 403) {
        toast.show('You do not have permission for that action.', 'error');
      } else if (err.status >= 500) {
        toast.show('Server error. Please try again.', 'error');
      } else if (err.error?.error) {
        toast.show(err.error.error, 'error');
      }
      return throwError(() => err);
    })
  );
};
