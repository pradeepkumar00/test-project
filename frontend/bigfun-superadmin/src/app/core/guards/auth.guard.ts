import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Requires a valid superadmin session token in localStorage. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isSuperAdmin()) return true;
  auth.logout().subscribe();
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  if (!auth.isSuperAdmin()) {
    auth.logout().subscribe();
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
