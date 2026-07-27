import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { WalletSyncService } from '../../core/services/wallet-sync.service';
import { SettingsService } from '../../core/services/settings.service';
import { User } from '../../core/models';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BottomNavComponent],
  template: `
    <div class="layout" [class.drawer-open]="menuOpen">
      @if (menuOpen) {
        <div class="drawer-backdrop" (click)="closeMenu()"></div>
      }

      <aside class="drawer" [class.open]="menuOpen">
        <div class="drawer-header">
          <img src="/assets/brand/masti-ludo-sticker.png" alt="Masti Ludo" class="drawer-logo" />
          <button type="button" class="drawer-close" (click)="closeMenu()" aria-label="Close menu">✕</button>
        </div>

        @if (user) {
          <div class="drawer-user">
            <strong>{{ user.name || user.mobile }}</strong>
            <small>{{ user.mobile }}</small>
          </div>
        }

        <nav class="drawer-nav">
          <a routerLink="/profile" routerLinkActive="active" (click)="closeMenu()">
            <span class="nav-ico">👤</span> My Profile
          </a>
          <a routerLink="/profile" [queryParams]="{ kyc: '1' }" (click)="closeMenu()">
            <span class="nav-ico">🛡️</span> KYC
          </a>
          <a routerLink="/history" routerLinkActive="active" (click)="closeMenu()">
            <span class="nav-ico">🕐</span> History
          </a>
          <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">
            <span class="nav-ico">🏠</span> App Dashboard
          </a>
          <button type="button" class="drawer-logout" (click)="logout()">
            <span class="nav-ico">🚪</span> Logout
          </button>
        </nav>
      </aside>

      <div class="main-shell">
        <header class="top-header">
          <button type="button" class="menu-btn" (click)="toggleMenu()" aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>

          <img src="/assets/brand/masti-ludo-sticker.png" alt="Masti Ludo" class="center-logo" />

          <div class="wallet-pair">
            <a routerLink="/wallet" class="wallet-chip" (click)="closeMenu()" title="Deposited Cash">
              <img src="/assets/icons/wallet-deposit.png" alt="" class="chip-icon" />
              <strong>{{ depositedCash | number:'1.0-0' }}</strong>
            </a>
            <a routerLink="/wallet" class="wallet-chip" (click)="closeMenu()" title="Referral Cash">
              <img src="/assets/icons/wallet-referral.png" alt="" class="chip-icon gift" />
              <strong>{{ referralCash | number:'1.0-2' }}</strong>
            </a>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>

        <app-bottom-nav />
      </div>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
      width: 100%;
      background: radial-gradient(ellipse at top, #1a0a3d 0%, #0a0614 55%, #050308 100%);
    }

    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      z-index: 240;
    }

    .drawer {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(300px, 84vw);
      background: #0c0618;
      border-right: 1px solid rgba(34, 211, 238, 0.25);
      z-index: 250;
      display: flex;
      flex-direction: column;
      transform: translateX(-105%);
      transition: transform 0.22s ease;
      padding-top: env(safe-area-inset-top, 0px);
    }
    .drawer.open { transform: translateX(0); }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.25);
    }
    .drawer-logo {
      height: 48px;
      width: auto;
      object-fit: contain;
    }
    .drawer-close {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(34, 211, 238, 0.35);
      border-radius: 10px;
      background: transparent;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
    }

    .drawer-user {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
    }
    .drawer-user strong { display: block; font-size: 14px; color: #fff; }
    .drawer-user small { color: #a3a3b8; font-size: 12px; }

    .drawer-nav {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .drawer-nav a,
    .drawer-logout {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 14px;
      border-radius: 12px;
      color: #e5e5e5;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
    }
    .drawer-nav a:hover,
    .drawer-logout:hover,
    .drawer-nav a.active {
      background: rgba(34, 211, 238, 0.12);
      color: #67e8f9;
    }
    .nav-ico { width: 22px; text-align: center; }
    .drawer-logout { color: #f87171; margin-top: 8px; }
    .drawer-logout:hover { background: rgba(239, 68, 68, 0.12); color: #fca5a5; }

    .drawer-footer {
      display: none;
    }
    .logout { width: 100%; color: #ef4444 !important; }

    .main-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .top-header {
      position: sticky;
      top: 0;
      z-index: 150;
      display: grid;
      grid-template-columns: 40px 1fr auto;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      padding-top: calc(8px + env(safe-area-inset-top, 0px));
      background: rgba(5, 3, 12, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
    }

    .menu-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 10px;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
      padding: 0;
    }
    .menu-btn span {
      display: block;
      width: 22px;
      height: 2.5px;
      border-radius: 2px;
      background: #fff;
    }

    .center-logo {
      height: 52px;
      width: auto;
      max-width: 72px;
      object-fit: contain;
      justify-self: center;
      filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.35));
    }

    .wallet-pair {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-self: end;
    }
    .wallet-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px 4px 4px;
      border-radius: 999px;
      text-decoration: none;
      background: rgba(8, 20, 40, 0.95);
      border: 1.5px solid #22d3ee;
      box-shadow: 0 0 14px rgba(34, 211, 238, 0.65), inset 0 0 8px rgba(34, 211, 238, 0.18);
      min-width: 0;
      max-width: 118px;
    }
    .chip-icon {
      width: 28px;
      height: 28px;
      object-fit: contain;
      flex-shrink: 0;
      display: block;
    }
    .chip-icon.gift {
      width: 26px;
      height: 26px;
    }
    .wallet-chip strong {
      font-size: 13px;
      font-weight: 800;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .content {
      flex: 1;
      width: 100%;
      padding: 12px;
      padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 20px);
    }

    @media (min-width: 480px) {
      .wallet-chip { max-width: 140px; }
      .wallet-chip strong { font-size: 14px; }
      .center-logo { height: 58px; max-width: 84px; }
    }

    @media (min-width: 768px) {
      .content {
        max-width: 720px;
        margin: 0 auto;
        padding: 20px;
        padding-bottom: calc(var(--nav-height) + 28px);
      }
    }
  `],
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private walletSync = inject(WalletSyncService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private userSub?: Subscription;

  user: User | null = null;
  depositedCash = 0;
  referralCash = 0;
  menuOpen = false;
  supportWhatsApp = '';

  ngOnInit() {
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.supportWhatsApp = res.settings.supportWhatsApp || '';
      },
    });

    this.userSub = this.auth.user$.subscribe((u) => {
      this.user = u;
      if (u) {
        this.depositedCash = u.balance ?? 0;
        this.referralCash = u.bonusBalance ?? 0;
        void this.walletSync.start(String(u.id));
      } else {
        this.depositedCash = 0;
        this.referralCash = 0;
        void this.walletSync.stop();
      }
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    void this.walletSync.stop();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  openWhatsApp() {
    this.closeMenu();
    const open = (raw: string) => {
      const number = (raw || '').replace(/\D/g, '');
      if (!number) {
        alert('WhatsApp support number is not configured. Set it in Admin → Settings.');
        return;
      }
      window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer');
    };

    if (this.supportWhatsApp) {
      open(this.supportWhatsApp);
      return;
    }

    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.supportWhatsApp = res.settings.supportWhatsApp || '';
        open(this.supportWhatsApp);
      },
      error: () => alert('Unable to load WhatsApp support number.'),
    });
  }

  logout() {
    this.closeMenu();
    void this.walletSync.stop();
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
