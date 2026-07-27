import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Admin } from '../../core/models';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">S</span>
          <div>
            <strong>MASTI LUDO</strong>
            <small>Superadmin Portal</small>
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
              <strong>{{ admin.name || (admin.role === 'superadmin' ? 'Super Admin' : 'Admin') }}</strong>
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
    .layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: var(--sidebar-width);
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
    }
    .brand {
      display: flex; align-items: center; gap: 12px;
      padding: 22px 18px; border-bottom: 1px solid var(--border);
    }
    .brand-mark {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, #f59e0b, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 20px; color: #fff; flex-shrink: 0;
    }
    .brand strong { display: block; font-size: 17px; letter-spacing: 0.04em; }
    .brand small { color: var(--text-muted); font-size: 11px; }
    nav {
      flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto;
    }
    nav a {
      padding: 12px 14px; border-radius: var(--radius-sm);
      color: var(--text-muted); font-size: 14px; font-weight: 600;
    }
    nav a:hover { background: rgba(255,255,255,0.05); color: var(--text); }
    nav a.active { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .sidebar-footer { padding: 16px 14px; border-top: 1px solid var(--border); }
    .admin-info { margin-bottom: 10px; }
    .admin-info strong { display: block; font-size: 13px; }
    .admin-info small { color: var(--text-muted); font-size: 11px; }
    .logout { width: 100%; }
    .content {
      flex: 1; margin-left: var(--sidebar-width); padding: 28px; min-height: 100vh;
    }
    @media (max-width: 768px) {
      .sidebar { width: 72px; }
      .sidebar .brand div, .admin-info, .brand small { display: none; }
      .brand { justify-content: center; padding: 16px 8px; }
      nav a { text-align: center; font-size: 18px; padding: 12px 8px; }
      .content { margin-left: 72px; padding: 16px; }
    }
  `],
})
export class AdminLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  admin: Admin | null = this.auth.getAdmin();

  navItems = [
    { path: '/dashboard', label: '📊 Dashboard' },
    { path: '/deposits', label: '💰 Deposits' },
    { path: '/withdrawals', label: '🏦 Withdrawals' },
    { path: '/battles', label: '⚔️ Battles' },
    { path: '/users', label: '👥 Users' },
    { path: '/kyc', label: '🪪 KYC' },
    { path: '/transactions', label: '📋 Transactions' },
    { path: '/admins', label: '🛡️ Admins' },
    { path: '/settings', label: '⚙️ Settings' },
  ];

  ngOnInit() {
    this.auth.admin$.subscribe((a) => (this.admin = a));
    this.auth.fetchProfile().subscribe({
      error: () => this.router.navigate(['/login']),
    });
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
