import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/services/admin.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Platform overview at a glance</p>
      </div>
    </div>

    @if (loading) { <div class="spinner">Loading stats...</div> }
    @else if (stats) {
      <div class="stat-grid">
        <div class="stat-card">
          <div class="label">Pending Deposits</div>
          <div class="value">{{ stats.pendingDeposits }}</div>
        </div>
        <div class="stat-card">
          <div class="label">Pending Withdrawals</div>
          <div class="value">{{ stats.pendingWithdrawals }}</div>
        </div>
        <div class="stat-card">
          <div class="label">Open Battles</div>
          <div class="value">{{ stats.openBattles }}</div>
        </div>
        <div class="stat-card">
          <div class="label">Running Battles</div>
          <div class="value">{{ stats.runningBattles }}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Users</div>
          <div class="value">{{ stats.totalUsers }}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Deposits</div>
          <div class="value">₹{{ stats.totalDeposits | number }}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Withdrawals</div>
          <div class="value">₹{{ stats.totalWithdrawals | number }}</div>
        </div>
      </div>

      <div class="quick-links">
        <h2>Quick Actions</h2>
        <div class="links">
          <a routerLink="/deposits" class="card link-card">
            <span class="link-icon">💰</span>
            <span>Review Deposits</span>
            <span class="arrow">→</span>
          </a>
          <a routerLink="/withdrawals" class="card link-card">
            <span class="link-icon">🏦</span>
            <span>Review Withdrawals</span>
            <span class="arrow">→</span>
          </a>
          <a routerLink="/battles" class="card link-card">
            <span class="link-icon">⚔️</span>
            <span>Manage Battles</span>
            <span class="arrow">→</span>
          </a>
          <a routerLink="/kyc" class="card link-card">
            <span class="link-icon">🪪</span>
            <span>Pending KYC</span>
            <span class="arrow">→</span>
          </a>
        </div>
      </div>
    }
  `,
  styles: [`
    .quick-links h2 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 14px;
      color: var(--text);
    }
    .links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
    }
    .link-card {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text);
      font-weight: 600;
      transition: border-color 0.15s, transform 0.15s;
    }
    .link-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }
    .link-icon { font-size: 22px; }
    .link-card span:nth-child(2) { flex: 1; font-size: 14px; }
    .arrow { color: var(--primary-light); font-size: 18px; }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(AdminApiService);
  stats: DashboardStats | null = null;
  loading = true;

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (res) => {
        this.stats = res.stats;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
