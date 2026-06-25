import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      @for (item of navItems; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px));
      padding-bottom: env(safe-area-inset-bottom, 0px);
      display: flex;
      padding-left: 4px;
      padding-right: 4px;
      background: rgba(10, 16, 32, 0.96);
      backdrop-filter: blur(20px);
      border-top: 1px solid var(--border);
      z-index: 200;
    }
    a {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      margin: 6px 2px;
      min-height: 44px;
      transition: color 0.2s, background 0.2s;
      -webkit-tap-highlight-color: transparent;
    }
    a.active {
      color: var(--primary-light);
      background: rgba(124, 58, 237, 0.15);
    }
    .nav-icon { font-size: 20px; line-height: 1; }
    .nav-label { line-height: 1.1; }
  `],
})
export class BottomNavComponent {
  navItems = [
    { path: '/home', label: 'Games', icon: '🎮', exact: true },
    { path: '/wallet', label: 'Wallet', icon: '💳', exact: false },
    { path: '/refer', label: 'Refer', icon: '🎁', exact: false },
    { path: '/support', label: 'Help', icon: '💬', exact: false },
    { path: '/profile', label: 'Profile', icon: '👤', exact: false },
  ];
}
