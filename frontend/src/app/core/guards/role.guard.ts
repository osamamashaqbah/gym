import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/models';
import { ToastService } from '../services/toast.service';

export const roleGuard = (roles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);
    if (!auth.isAuthenticated()) { router.navigate(['/login']); return false; }
    if (auth.hasRole(roles)) return true;
    toast.show('Access denied for your role.', 'error');
    router.navigate(['/dashboard']);
    return false;
  };
};
