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
        <div class="drawer-backdrop mobile-only" (click)="closeMenu()"></div>
      }

      <!-- Desktop sidebar (always visible ≥900px) -->
      <aside class="sidebar desktop-only">
        <div class="sidebar-brand">
          <img src="/assets/brand/masti-ludo-sticker.png" alt="Masti Ludo" class="brand-logo" />
          <div class="brand-text">
            <strong>Masti Ludo</strong>
            <small>Play · Win · Earn</small>
          </div>
        </div>

        <nav class="side-nav">
          <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="nav-ico">🏠</span> Home
          </a>
          <a routerLink="/wallet" routerLinkActive="active">
            <span class="nav-ico">💳</span> Wallet
          </a>
          <a routerLink="/refer" routerLinkActive="active">
            <span class="nav-ico">🎁</span> Refer & Earn
          </a>
          <a routerLink="/support" routerLinkActive="active">
            <span class="nav-ico">🎧</span> Support
          </a>
          <a routerLink="/history" routerLinkActive="active">
            <span class="nav-ico">🕐</span> History
          </a>
          <a routerLink="/profile" routerLinkActive="active">
            <span class="nav-ico">👤</span> Profile
          </a>
          <button type="button" class="side-link" (click)="goKyc()">
            <span class="nav-ico">🛡️</span> KYC
          </button>
        </nav>

        <div class="sidebar-foot">
          @if (user) {
            <div class="side-user">
              <strong>{{ user.name || user.mobile }}</strong>
              <small>{{ user.mobile }}</small>
            </div>
          }
          <button type="button" class="logout-btn" (click)="logout()">Logout</button>
        </div>
      </aside>

      <!-- Mobile drawer -->
      <aside class="drawer mobile-only" [class.open]="menuOpen">
        <div class="drawer-header">
          <img src="/assets/brand/masti-ludo-sticker.png" alt="Masti Ludo" class="drawer-logo" />
          <button type="button" class="drawer-close" (click)="closeMenu()" aria-label="Close">✕</button>
        </div>
        @if (user) {
          <div class="drawer-user">
            <strong>{{ user.name || user.mobile }}</strong>
            <small>{{ user.mobile }}</small>
          </div>
        }
        <nav class="drawer-nav">
          <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">
            <span class="nav-ico">🏠</span> Home
          </a>
          <a routerLink="/wallet" routerLinkActive="active" (click)="closeMenu()">
            <span class="nav-ico">💳</span> Wallet
          </a>
          <a routerLink="/refer" routerLinkActive="active" (click)="closeMenu()">
            <span class="nav-ico">🎁</span> Refer & Earn
          </a>
          <a routerLink="/support" routerLinkActive="active" (click)="closeMenu()">
            <span class="nav-ico">🎧</span> Support
          </a>
          <a routerLink="/history" routerLinkActive="active" (click)="closeMenu()">
            <span class="nav-ico">🕐</span> History
          </a>
          <a routerLink="/profile" routerLinkActive="active" (click)="closeMenu()">
            <span class="nav-ico">👤</span> Profile
          </a>
          <button type="button" class="drawer-logout kyc-link" (click)="goKyc()">
            <span class="nav-ico">🛡️</span> KYC
          </button>
          <button type="button" class="drawer-logout" (click)="logout()">
            <span class="nav-ico">🚪</span> Logout
          </button>
        </nav>
      </aside>

      <div class="main">
        <header class="top-header">
          <div class="header-inner">
            <button type="button" class="menu-btn mobile-only" (click)="toggleMenu()" aria-label="Open menu">
              <span></span><span></span><span></span>
            </button>

            <div class="header-left desktop-only">
              <h1 class="page-greeting">Welcome back</h1>
              @if (user) {
                <p class="page-user">{{ user.name || user.mobile }}</p>
              }
            </div>

            <img src="/assets/brand/masti-ludo-sticker.png" alt="Masti Ludo" class="center-logo mobile-only" />

            <div class="wallet-pair">
              <a routerLink="/wallet" class="wallet-chip" title="Deposited Cash">
                <img src="/assets/icons/wallet-deposit.png" alt="" class="chip-icon" />
                <div class="chip-meta">
                  <small>Cash</small>
                  <strong>₹{{ depositedCash | number:'1.0-0' }}</strong>
                </div>
              </a>
              <a routerLink="/wallet" class="wallet-chip" title="Referral Cash">
                <img src="/assets/icons/wallet-referral.png" alt="" class="chip-icon gift" />
                <div class="chip-meta">
                  <small>Referral</small>
                  <strong>₹{{ referralCash | number:'1.0-2' }}</strong>
                </div>
              </a>
            </div>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>

        <div class="mobile-only">
          <app-bottom-nav />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      display: flex;
      background: transparent;
    }

    .desktop-only { display: none; }
    .mobile-only { display: block; }

    @media (min-width: 900px) {
      .desktop-only { display: block; }
      .mobile-only { display: none !important; }
      .wallet-pair .desktop-only,
      .header-left.desktop-only { display: block; }
    }

    /* —— Desktop sidebar —— */
    .sidebar {
      width: var(--sidebar-width);
      flex-shrink: 0;
      min-height: 100vh;
      min-height: 100dvh;
      background: linear-gradient(180deg, #0e0820 0%, #080414 100%);
      border-right: 1px solid rgba(168, 85, 247, 0.25);
      display: none;
      flex-direction: column;
      padding: 20px 14px;
      position: sticky;
      top: 0;
      align-self: flex-start;
      height: 100vh;
      height: 100dvh;
    }
    @media (min-width: 900px) {
      .sidebar { display: flex; }
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 8px 20px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
      margin-bottom: 16px;
    }
    .brand-logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
    }
    .brand-text strong {
      display: block;
      font-size: 15px;
      font-weight: 800;
      color: #fff;
    }
    .brand-text small {
      color: #a3a3b8;
      font-size: 11px;
    }

    .side-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }
    .side-nav a,
    .side-nav .side-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      color: #d4d4d8;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
    }
    .side-nav a:hover,
    .side-nav .side-link:hover {
      background: rgba(34, 211, 238, 0.08);
      color: #fff;
    }
    .side-nav a.active {
      background: linear-gradient(90deg, rgba(34, 211, 238, 0.18), rgba(168, 85, 247, 0.12));
      color: #67e8f9;
      border: 1px solid rgba(34, 211, 238, 0.25);
    }
    .nav-ico { width: 22px; text-align: center; }

    .sidebar-foot {
      padding-top: 14px;
      border-top: 1px solid rgba(168, 85, 247, 0.2);
    }
    .side-user {
      padding: 0 8px 12px;
    }
    .side-user strong { display: block; font-size: 13px; color: #fff; }
    .side-user small { color: #a3a3b8; font-size: 12px; }
    .logout-btn {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(239, 68, 68, 0.35);
      background: rgba(239, 68, 68, 0.08);
      color: #f87171;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
    }
    .logout-btn:hover { background: rgba(239, 68, 68, 0.16); }

    /* —— Mobile drawer —— */
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
      height: 40px;
      width: auto;
      max-width: 120px;
      object-fit: contain;
    }
    .drawer-close {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(34, 211, 238, 0.35);
      border-radius: 10px;
      background: transparent;
      color: #fff;
      cursor: pointer;
    }
    .drawer-user {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
    }
    .drawer-user strong { display: block; font-size: 14px; }
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
      padding: 14px;
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
    .drawer-nav a.active,
    .drawer-nav a:hover {
      background: rgba(34, 211, 238, 0.12);
      color: #67e8f9;
    }
    .drawer-logout { color: #f87171; margin-top: 8px; }
    .drawer-logout.kyc-link {
      color: #e5e5e5;
      margin-top: 0;
    }
    .drawer-logout.kyc-link:hover {
      background: rgba(34, 211, 238, 0.12);
      color: #67e8f9;
    }

    /* —— Main column —— */
    .main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
    }

    .top-header {
      position: sticky;
      top: 0;
      z-index: 150;
      background: rgba(7, 4, 26, 0.88);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
    }
    .header-inner {
      width: 100%;
      max-width: var(--content-max);
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: var(--header-height);
      padding: 10px var(--page-padding);
      padding-top: calc(10px + env(safe-area-inset-top, 0px));
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
      flex-shrink: 0;
    }
    .menu-btn span {
      display: block;
      width: 20px;
      height: 2px;
      border-radius: 2px;
      background: #fff;
    }

    .header-left .page-greeting {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
    }
    .header-left .page-user {
      font-size: 13px;
      color: #a3a3b8;
      margin-top: 2px;
    }

    .center-logo {
      height: 40px;
      width: auto;
      max-width: 64px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.3));
    }

    .wallet-pair {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .wallet-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 6px;
      border-radius: 999px;
      text-decoration: none;
      background: rgba(8, 20, 40, 0.9);
      border: 1.5px solid rgba(34, 211, 238, 0.55);
      box-shadow: 0 0 12px rgba(34, 211, 238, 0.25);
    }
    .chip-icon {
      width: 24px;
      height: 24px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .chip-icon.gift { width: 22px; height: 22px; }
    .chip-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .chip-meta small {
      display: none;
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
    }
    .chip-meta strong {
      font-size: 13px;
      font-weight: 800;
      color: #fff;
      white-space: nowrap;
    }
    @media (min-width: 900px) {
      .chip-meta small { display: block; }
      .chip-icon { width: 28px; height: 28px; }
      .chip-icon.gift { width: 26px; height: 26px; }
    }

    .content {
      flex: 1;
      width: 100%;
      max-width: var(--content-max);
      margin: 0 auto;
      padding: var(--page-padding);
      padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 20px);
    }
    @media (min-width: 900px) {
      .content {
        padding-bottom: 40px;
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

  goKyc() {
    this.closeMenu();
    void this.router.navigate(['/profile'], {
      queryParams: { kyc: '1' },
      queryParamsHandling: '',
    });
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
