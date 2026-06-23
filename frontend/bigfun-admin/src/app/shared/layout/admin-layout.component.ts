import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span>⚙️</span>
          <div>
            <strong>BIGFUN</strong>
            <small>Admin Portal</small>
          </div>
        </div>
        <nav>
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">{{ item.label }}</a>
          }
        </nav>
        <div class="sidebar-footer">
          @if (admin) {
            <div class="admin-info">
              <strong>{{ admin.name }}</strong>
              <small>{{ admin.mobile }} · {{ admin.role }}</small>
            </div>
          }
          <button class="btn btn-outline btn-sm logout" (click)="logout()">Logout</button>
        </div>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: var(--sidebar-width);
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      border-bottom: 1px solid var(--border);
    }
    .brand span { font-size: 24px; }
    .brand strong { display: block; font-size: 16px; }
    .brand small { color: var(--text-muted); font-size: 11px; }
    nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    nav a {
      padding: 10px 12px;
      border-radius: 8px;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 500;
      transition: background 0.15s;
    }
    nav a:hover { background: rgba(255,255,255,0.05); color: var(--text); }
    nav a.active {
      background: rgba(245, 197, 24, 0.12);
      color: var(--gold);
    }
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border);
    }
    .admin-info {
      margin-bottom: 10px;
    }
    .admin-info strong { display: block; font-size: 13px; }
    .admin-info small { color: var(--text-muted); font-size: 11px; }
    .logout { width: 100%; }
    .content {
      flex: 1;
      margin-left: var(--sidebar-width);
      padding: 24px;
      min-height: 100vh;
    }
    @media (max-width: 768px) {
      .sidebar { width: 64px; }
      .sidebar .brand div, .sidebar nav a, .admin-info, .brand small { display: none; }
      .brand { justify-content: center; padding: 16px 8px; }
      nav a { text-align: center; font-size: 18px; }
      .content { margin-left: 64px; padding: 16px; }
    }
  `],
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  admin = this.auth.getAdmin();

  navItems = [
    { path: '/dashboard', label: '📊 Dashboard' },
    { path: '/deposits', label: '💰 Deposits' },
    { path: '/withdrawals', label: '🏦 Withdrawals' },
    { path: '/battles', label: '⚔️ Battles' },
    { path: '/users', label: '👥 Users' },
    { path: '/kyc', label: '🪪 KYC' },
    { path: '/transactions', label: '📋 Transactions' },
  ];

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
