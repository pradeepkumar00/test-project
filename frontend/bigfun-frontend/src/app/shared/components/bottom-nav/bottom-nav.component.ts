import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-home">
        <span class="active-pill">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8.5z"/>
          </svg>
          <span class="label">Home</span>
        </span>
      </a>

      <a routerLink="/wallet" routerLinkActive="active" aria-label="Wallet">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="6.5" width="18" height="12" rx="2.5"/>
          <path d="M3 10h18"/>
          <circle cx="16.5" cy="14.2" r="1.3" fill="currentColor" stroke="none"/>
        </svg>
      </a>

      <a routerLink="/refer" routerLinkActive="active" aria-label="Refer">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="7" cy="8" r="2.4"/>
          <path d="M3.2 17.5c.7-2.2 2.2-3.3 3.8-3.3s3.1 1.1 3.8 3.3"/>
          <circle cx="17" cy="8" r="2.4"/>
          <path d="M13.2 17.5c.7-2.2 2.2-3.3 3.8-3.3s3.1 1.1 3.8 3.3"/>
          <path d="M10.2 8.2h3.6"/>
          <path d="M11.2 6.6L9.6 8.2l1.6 1.6"/>
          <path d="M12.8 6.6l1.6 1.6-1.6 1.6"/>
        </svg>
      </a>

      <a routerLink="/support" routerLinkActive="active" aria-label="Support">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12a7 7 0 0 1 14 0"/>
          <path d="M5 12v3.5a2 2 0 0 0 2 2h1V12H5z"/>
          <path d="M19 12v3.5a2 2 0 0 1-2 2h-1V12h3z"/>
          <circle cx="12" cy="13.5" r="2.2"/>
          <path d="M9.5 19.5c.9-1.3 2-1.9 2.5-1.9s1.6.6 2.5 1.9"/>
        </svg>
      </a>

      <a routerLink="/profile" routerLinkActive="active" aria-label="Profile">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="10" r="3"/>
          <path d="M7.2 18.3c1.5-2.1 3.2-3 4.8-3s3.3.9 4.8 3"/>
        </svg>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px));
      padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px));
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 2px;
      background: linear-gradient(180deg, #1a0a30 0%, #0a0614 100%);
      border-top: 1px solid rgba(168, 85, 247, 0.3);
      box-shadow: 0 -8px 24px rgba(88, 28, 135, 0.28);
      z-index: 200;
    }
    a {
      flex: 1;
      max-width: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      text-decoration: none;
      min-height: 44px;
      -webkit-tap-highlight-color: transparent;
    }
    a svg {
      width: 22px;
      height: 22px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    a.active:not(.nav-home) {
      color: #67e8f9;
      filter: drop-shadow(0 0 6px rgba(103, 232, 249, 0.55));
    }

    .nav-home .label {
      display: none;
      font-size: 11px;
      font-weight: 800;
      color: #111;
      line-height: 1;
    }
    .nav-home .active-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px;
      border-radius: 999px;
    }
    .nav-home.active .active-pill {
      background: #fff;
      padding: 6px 12px 6px 8px;
      box-shadow: 0 0 14px rgba(255, 255, 255, 0.25);
    }
    .nav-home.active svg {
      stroke: #111;
      width: 18px;
      height: 18px;
    }
    .nav-home.active .label {
      display: inline;
    }
  `],
})
export class BottomNavComponent {}
