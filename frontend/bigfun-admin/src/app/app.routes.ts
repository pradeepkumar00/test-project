import { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'deposits',
        canActivate: [permissionGuard],
        loadComponent: () =>
          import('./pages/deposits/deposits.component').then((m) => m.DepositsComponent),
      },
      {
        path: 'withdrawals',
        canActivate: [permissionGuard],
        loadComponent: () =>
          import('./pages/withdrawals/withdrawals.component').then((m) => m.WithdrawalsComponent),
      },
      {
        path: 'battles',
        canActivate: [permissionGuard],
        loadComponent: () =>
          import('./pages/battles/battles.component').then((m) => m.BattlesComponent),
      },
      {
        path: 'users',
        canActivate: [permissionGuard],
        loadComponent: () => import('./pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'kyc',
        canActivate: [permissionGuard],
        loadComponent: () => import('./pages/kyc/kyc.component').then((m) => m.KycComponent),
      },
      {
        path: 'transactions',
        canActivate: [permissionGuard],
        loadComponent: () =>
          import('./pages/transactions/transactions.component').then((m) => m.TransactionsComponent),
      },
      {
        path: 'settings',
        canActivate: [permissionGuard],
        loadComponent: () =>
          import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
