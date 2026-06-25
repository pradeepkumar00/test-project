import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <a routerLink="/home" class="logo">
        <span class="logo-mark">B</span>
        <span class="logo-text">BIGFUN</span>
      </a>
      @if (auth.getUser(); as user) {
        <div class="stats">
          <div class="stat-chip wallet">
            <span class="icon">💰</span>
            <div>
              <small>Wallet</small>
              <strong>₹{{ walletBalance | number:'1.0-2' }}</strong>
            </div>
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px var(--page-padding);
      background: rgba(12, 18, 34, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }
    .logo-mark {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--gradient-hero);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 18px;
      color: #fff;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .stat-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      border: 1px solid var(--border);
    }
    .stat-chip .icon { font-size: 20px; }
    .stat-chip small {
      display: block;
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .stat-chip strong {
      font-size: 15px;
      font-weight: 800;
      color: var(--gold);
    }
  `],
})
export class HeaderComponent implements OnInit {
  auth = inject(AuthService);
  walletBalance = 0;

  ngOnInit() {
    this.auth.user$.subscribe((u: User | null) => {
      if (u) {
        this.walletBalance = u.totalBalance ?? u.balance + (u.bonusBalance || 0);
      }
    });
  }
}
