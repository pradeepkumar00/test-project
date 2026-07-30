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
    path: '',
    loadComponent: () =>
      import('./shared/layout/user-layout.component').then((m) => m.UserLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'battles/:gameSlug',
        loadComponent: () => import('./pages/battles/battles.component').then((m) => m.BattlesComponent),
      },
      {
        path: 'battle/:id',
        loadComponent: () =>
          import('./pages/battles/battle-room.component').then((m) => m.BattleRoomComponent),
      },
      {
        path: 'wallet',
        loadComponent: () => import('./pages/wallet/wallet.component').then((m) => m.WalletComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/history/battle-history.component').then((m) => m.BattleHistoryComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'refer',
        loadComponent: () => import('./pages/refer/refer.component').then((m) => m.ReferComponent),
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/support/support.component').then((m) => m.SupportComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
