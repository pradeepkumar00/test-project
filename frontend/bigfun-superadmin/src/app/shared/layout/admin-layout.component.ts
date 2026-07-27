import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { Admin } from '../../core/models';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" [class.nav-open]="menuOpen">
      <header class="topbar">
        <button type="button" class="menu-btn" (click)="toggleMenu()" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <div class="topbar-brand">
          <span class="brand-mark">S</span>
          <div>
            <strong>MASTI LUDO</strong>
            <small>Superadmin</small>
          </div>
        </div>
      </header>

      <div class="backdrop" (click)="closeMenu()" role="presentation"></div>

      <aside class="sidebar" [attr.aria-hidden]="!menuOpen && isMobile ? 'true' : null">
        <div class="brand">
          <span class="brand-mark">S</span>
          <div>
            <strong>MASTI LUDO</strong>
            <small>Superadmin Portal</small>
          </div>
          <button type="button" class="sidebar-close" (click)="closeMenu()" aria-label="Close menu">×</button>
        </div>
        <nav>
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              (click)="closeMenu()"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
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
    .layout {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
    }

    .topbar {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 120;
      height: calc(56px + env(safe-area-inset-top, 0px));
      padding: env(safe-area-inset-top, 0px) 12px 0;
      align-items: center;
      gap: 12px;
      background: rgba(10, 16, 32, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }

    .menu-btn {
      width: 44px;
      height: 44px;
      border: none;
      background: transparent;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .menu-btn span {
      display: block;
      width: 20px;
      height: 2px;
      background: var(--text);
      border-radius: 2px;
    }

    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .topbar-brand strong { display: block; font-size: 15px; }
    .topbar-brand small { color: var(--text-muted); font-size: 11px; }

    .backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 130;
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
      z-index: 140;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 22px 18px;
      padding-top: calc(22px + env(safe-area-inset-top, 0px));
      border-bottom: 1px solid var(--border);
    }
    .brand-mark {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f59e0b, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      color: #fff;
      flex-shrink: 0;
    }
    .brand strong { display: block; font-size: 17px; letter-spacing: 0.04em; }
    .brand small { color: var(--text-muted); font-size: 11px; }
    .brand > div { flex: 1; min-width: 0; }

    .sidebar-close {
      display: none;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
    }

    nav {
      flex: 1;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      min-height: 44px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 600;
    }
    nav a:hover { background: rgba(255,255,255,0.05); color: var(--text); }
    nav a.active { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .nav-icon { font-size: 16px; width: 22px; text-align: center; flex-shrink: 0; }

    .sidebar-footer {
      padding: 16px 14px;
      padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid var(--border);
    }
    .admin-info { margin-bottom: 10px; }
    .admin-info strong { display: block; font-size: 13px; }
    .admin-info small { color: var(--text-muted); font-size: 11px; }
    .logout { width: 100%; min-height: 40px; }

    .content {
      flex: 1;
      margin-left: var(--sidebar-width);
      padding: 28px;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    @media (max-width: 900px) {
      .topbar { display: flex; }
      .backdrop { display: none; }
      .layout.nav-open .backdrop { display: block; }

      .sidebar {
        transform: translateX(-105%);
        transition: transform 0.22s ease;
        width: min(300px, 86vw);
        box-shadow: 8px 0 32px rgba(0, 0, 0, 0.45);
      }
      .layout.nav-open .sidebar { transform: translateX(0); }

      .sidebar-close { display: flex; align-items: center; justify-content: center; }

      .content {
        margin-left: 0;
        padding: 16px;
        padding-top: calc(56px + env(safe-area-inset-top, 0px) + 16px);
        padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      }
    }
  `],
})
export class AdminLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  admin: Admin | null = this.auth.getAdmin();
  menuOpen = false;
  isMobile = typeof window !== 'undefined' && window.innerWidth <= 900;

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/deposits', label: 'Deposits', icon: '💰' },
    { path: '/withdrawals', label: 'Withdrawals', icon: '🏦' },
    { path: '/battles', label: 'Battles', icon: '⚔️' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/kyc', label: 'KYC', icon: '🪪' },
    { path: '/transactions', label: 'Transactions', icon: '📋' },
    { path: '/admins', label: 'Admins', icon: '🛡️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 900;
    if (!this.isMobile) this.menuOpen = false;
  }

  ngOnInit() {
    this.auth.admin$.subscribe((a) => (this.admin = a));
    this.auth.fetchProfile().subscribe({
      error: () => this.router.navigate(['/login']),
    });

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.closeMenu();
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.closeMenu();
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
