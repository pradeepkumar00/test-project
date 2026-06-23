import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="logo">
        <span class="logo-icon">🎮</span>
        <span class="logo-text">BIGFUN</span>
      </div>
      @if (auth.getUser(); as user) {
        <div class="stats">
          <div class="stat-pill">
            <span class="label">Wallet</span>
            <span class="value">₹ {{ walletBalance | number:'1.2-2' }}</span>
          </div>
          <div class="stat-pill">
            <span class="label">Income</span>
            <span class="value">₹ {{ income | number:'1.0-0' }}</span>
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
      padding: 12px 16px;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .logo-icon { font-size: 22px; }
    .logo-text {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .stats {
      display: flex;
      gap: 8px;
    }
    .stat-pill {
      background: var(--bg-card);
      border: 1px solid var(--gold);
      border-radius: 20px;
      padding: 4px 10px;
      text-align: center;
      min-width: 70px;
    }
    .label {
      display: block;
      font-size: 9px;
      color: var(--text-muted);
    }
    .value {
      font-size: 12px;
      font-weight: 700;
      color: var(--gold);
    }
  `],
})
export class HeaderComponent implements OnInit {
  auth = inject(AuthService);
  walletBalance = 0;
  income = 0;

  ngOnInit() {
    this.auth.user$.subscribe((u: User | null) => {
      if (u) {
        this.walletBalance = u.totalBalance ?? u.balance + (u.bonusBalance || 0);
        this.income = u.income ?? 0;
      }
    });
  }
}
