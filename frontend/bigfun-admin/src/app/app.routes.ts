import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

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
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'deposits',
        loadComponent: () =>
          import('./pages/deposits/deposits.component').then((m) => m.DepositsComponent),
      },
      {
        path: 'withdrawals',
        loadComponent: () =>
          import('./pages/withdrawals/withdrawals.component').then((m) => m.WithdrawalsComponent),
      },
      {
        path: 'battles',
        loadComponent: () =>
          import('./pages/battles/battles.component').then((m) => m.BattlesComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'kyc',
        loadComponent: () => import('./pages/kyc/kyc.component').then((m) => m.KycComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./pages/transactions/transactions.component').then((m) => m.TransactionsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
