import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'wallet',
    loadComponent: () => import('./pages/wallet/wallet.component').then((m) => m.WalletComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'refer',
    loadComponent: () => import('./pages/refer/refer.component').then((m) => m.ReferComponent),
    canActivate: [authGuard],
  },
  {
    path: 'support',
    loadComponent: () => import('./pages/support/support.component').then((m) => m.SupportComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'home' },
];
