import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { I18nService } from '../i18n/i18n.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const i18n = inject(I18nService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
      } else if (err.status === 403) {
        toast.show(i18n.t('toast.accessDenied'), 'error');
      } else if (err.status >= 500) {
        toast.show(i18n.t('toast.serverError'), 'error');
      } else if (err.error?.error) {
        toast.show(err.error.error, 'error');
      }
      return throwError(() => err);
    })
  );
};
