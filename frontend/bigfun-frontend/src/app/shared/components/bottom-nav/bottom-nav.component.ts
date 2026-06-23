import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/home" routerLinkActive="active">
        <span class="icon">🏠</span>
        <span>Home</span>
      </a>
      <a routerLink="/support" routerLinkActive="active">
        <span class="icon">💬</span>
        <span>Support</span>
      </a>
      <a routerLink="/refer" routerLinkActive="active">
        <span class="icon">🎁</span>
        <span>Refer</span>
      </a>
      <a routerLink="/wallet" routerLinkActive="active">
        <span class="icon">💰</span>
        <span>Wallet</span>
      </a>
      <a routerLink="/profile" routerLinkActive="active">
        <span class="icon">👤</span>
        <span>Profile</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: var(--max-width);
      display: flex;
      background: #111;
      border-top: 1px solid var(--border);
      z-index: 100;
    }
    a {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 4px;
      color: var(--text-muted);
      font-size: 11px;
      gap: 2px;
      text-decoration: none;
      &.active { color: var(--gold); }
    }
    .icon { font-size: 20px; }
  `],
})
export class BottomNavComponent {}
