import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { WalletSyncService } from '../../core/services/wallet-sync.service';
import { User } from '../../core/models';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BottomNavComponent],
  template: `
    <div class="layout">
      <aside class="sidebar desktop-only">
        <div class="brand">
          <span class="brand-mark">B</span>
          <div>
            <strong>BIGFUN</strong>
            <small>Play & Win</small>
          </div>
        </div>

        @if (user) {
          <div class="wallet-card">
            <span class="wallet-label">Wallet Balance</span>
            <strong class="wallet-value">₹{{ walletBalance | number:'1.0-2' }}</strong>
          </div>
        }

        <nav>
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          @if (user) {
            <div class="user-info">
              <strong>{{ user.name || user.mobile }}</strong>
              <small>{{ user.mobile }}</small>
            </div>
          }
          <button class="btn btn-ghost btn-sm logout" (click)="logout()">Logout</button>
        </div>
      </aside>

      <div class="main-shell">
        <header class="mobile-header mobile-only">
          <div class="mobile-brand">
            <span class="brand-mark">B</span>
            <strong>BIGFUN</strong>
          </div>
          @if (user) {
            <a routerLink="/wallet" class="mobile-wallet">
              <span class="wallet-pill">₹{{ walletBalance | number:'1.0-2' }}</span>
            </a>
          }
        </header>

        <main class="content">
          <router-outlet />
        </main>

        <app-bottom-nav class="mobile-only" />
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      width: 100%;
    }

    .mobile-only { display: none; }
    .desktop-only { display: flex; }

    .sidebar {
      width: var(--sidebar-width);
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 22px 18px;
      border-bottom: 1px solid var(--border);
    }
    .brand-mark {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--gradient-hero);
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

    .wallet-card {
      margin: 16px 14px;
      padding: 14px 16px;
      border-radius: var(--radius-sm);
      background: var(--gradient-card);
      border: 1px solid rgba(124, 58, 237, 0.35);
    }
    .wallet-label {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .wallet-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--gold);
    }

    nav {
      flex: 1;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
    }
    nav a:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text);
    }
    nav a.active {
      background: rgba(124, 58, 237, 0.2);
      color: var(--primary-light);
    }
    .nav-icon { font-size: 18px; width: 24px; text-align: center; }

    .sidebar-footer {
      padding: 16px 14px;
      border-top: 1px solid var(--border);
    }
    .user-info { margin-bottom: 10px; }
    .user-info strong { display: block; font-size: 13px; }
    .user-info small { color: var(--text-muted); font-size: 11px; }
    .logout { width: 100%; }

    .main-shell {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
    }

    .content {
      flex: 1;
      margin-left: var(--sidebar-width);
      min-height: 100vh;
      width: calc(100% - var(--sidebar-width));
      padding: var(--page-padding);
    }

    @media (max-width: 768px) {
      .mobile-only { display: block; }
      .desktop-only { display: none !important; }

      .main-shell {
        width: 100%;
      }

      .mobile-header {
        position: sticky;
        top: 0;
        z-index: 150;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px var(--page-padding);
        padding-top: calc(12px + env(safe-area-inset-top, 0px));
        background: rgba(10, 16, 32, 0.92);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--border);
      }
      .mobile-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .mobile-brand .brand-mark {
        width: 34px;
        height: 34px;
        font-size: 16px;
        border-radius: 10px;
      }
      .mobile-brand strong {
        font-size: 16px;
        letter-spacing: 0.04em;
      }
      .mobile-wallet {
        text-decoration: none;
      }
      .wallet-pill {
        display: inline-block;
        padding: 8px 14px;
        border-radius: 999px;
        background: var(--gradient-card);
        border: 1px solid rgba(124, 58, 237, 0.35);
        color: var(--gold);
        font-size: 14px;
        font-weight: 700;
      }

      .content {
        margin-left: 0;
        width: 100%;
        min-height: auto;
        padding: var(--page-padding);
        padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 20px);
      }
    }
  `],
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private walletSync = inject(WalletSyncService);
  private router = inject(Router);
  private userSub?: Subscription;

  user: User | null = null;
  walletBalance = 0;

  navItems = [
    { path: '/home', label: 'Games', icon: '🎮', exact: true },
    { path: '/wallet', label: 'Wallet', icon: '💳', exact: false },
    { path: '/refer', label: 'Refer & Earn', icon: '🎁', exact: false },
    { path: '/support', label: 'Support', icon: '💬', exact: false },
    { path: '/profile', label: 'Profile', icon: '👤', exact: false },
  ];

  ngOnInit() {
    this.userSub = this.auth.user$.subscribe((u) => {
      this.user = u;
      if (u) {
        this.walletBalance = u.totalBalance ?? u.balance + (u.bonusBalance || 0);
        void this.walletSync.start(String(u.id));
      } else {
        this.walletBalance = 0;
        void this.walletSync.stop();
      }
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    void this.walletSync.stop();
  }

  logout() {
    void this.walletSync.stop();
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
