import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ROUTE_PERMISSIONS } from '../constants/permissions';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  return router.createUrlTree([firstAllowedPath(auth)]);
};

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);

  const path = '/' + (route.routeConfig?.path || '');
  const needed = ROUTE_PERMISSIONS[path];
  if (!needed || auth.hasPermission(needed)) return true;

  const fallback = firstAllowedPath(auth);
  if (fallback === path) return true;
  return router.createUrlTree([fallback]);
};

function firstAllowedPath(auth: AuthService): string {
  for (const [path, perm] of Object.entries(ROUTE_PERMISSIONS)) {
    if (auth.hasPermission(perm)) return path;
  }
  return '/dashboard';
}
