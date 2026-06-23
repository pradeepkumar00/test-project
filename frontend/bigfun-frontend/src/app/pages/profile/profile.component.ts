import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/wallet.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, BottomNavComponent],
  template: `
    <app-header />
    <div class="page">
      @if (user) {
        <div class="profile-header card">
          <div class="avatar">👤</div>
          <div>
            <h2>{{ user.name || 'User' }}</h2>
            <p>{{ user.mobile }}</p>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat card">
            <span class="num">{{ user.gamesWon || 0 }}</span>
            <span class="stat-label">Won</span>
          </div>
          <div class="stat card">
            <span class="num">{{ user.gamesPlayed || 0 }}</span>
            <span class="stat-label">Games</span>
          </div>
        </div>

        <div class="kyc card">
          <div class="kyc-info">
            <strong>KYC Status</strong>
            <span class="badge" [class.verified]="user.kycVerified">{{ user.kycVerified ? 'Verified' : 'Pending' }}</span>
          </div>
          @if (!user.kycVerified) {
            <div class="form-group">
              <label>PAN Number</label>
              <input [(ngModel)]="panNumber" placeholder="PAN" />
            </div>
            <div class="form-group">
              <label>Aadhaar Number</label>
              <input [(ngModel)]="aadhaarNumber" placeholder="Aadhaar" />
            </div>
            <button class="btn btn-gold btn-block" (click)="submitKyc()">Complete KYC</button>
          }
        </div>

        <div class="menu">
          <button class="menu-item card" (click)="showHistory = !showHistory">📜 History</button>
          <button class="menu-item card" routerLink="/wallet">💰 My Wallet</button>
          <button class="menu-item card" routerLink="/refer">🎁 Refer & Earn</button>
          <button class="menu-item card danger" (click)="logout()">🚪 Logout</button>
        </div>

        @if (showHistory && history.length) {
          <h3 class="section-title">Recent History</h3>
          @for (h of history.slice(0, 10); track $index) {
            <div class="history-item card">{{ h.type }} — ₹{{ h.amount }}</div>
          }
        }
      }
    </div>
    <app-bottom-nav />
  `,
  styles: [`
    .profile-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .avatar { font-size: 48px; width: 64px; height: 64px; background: var(--bg-input); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    h2 { font-size: 20px; }
    p { color: var(--text-muted); font-size: 14px; }
    .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .stat { text-align: center; padding: 16px; }
    .num { display: block; font-size: 24px; font-weight: 700; color: var(--gold); }
    .stat-label { font-size: 12px; color: var(--text-muted); }
    .kyc { margin-bottom: 16px; }
    .kyc-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .badge { font-size: 12px; padding: 4px 10px; border-radius: 10px; background: var(--gold); color: #000; }
    .badge.verified { background: var(--success); color: #fff; }
    .menu { display: flex; flex-direction: column; gap: 8px; }
    .menu-item { text-align: left; font-size: 15px; cursor: pointer; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); padding: 14px 16px; border-radius: 14px; }
    .menu-item.danger { color: var(--danger); }
    .history-item { margin-bottom: 8px; font-size: 13px; }
  `],
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  user: User | null = null;
  panNumber = '';
  aadhaarNumber = '';
  showHistory = false;
  history: { type: string; amount: number }[] = [];

  ngOnInit() {
    this.auth.user$.subscribe((u) => (this.user = u));
    this.auth.fetchProfile().subscribe();
    this.profileService.getStats().subscribe({
      next: (r) => {
        const p = r.profile as User;
        if (p) {
          this.user = { ...this.auth.getUser(), ...p } as User;
          this.auth.updateUser(this.user);
        }
      },
    });
    this.profileService.getHistory().subscribe({
      next: (r) => (this.history = r.transactions as { type: string; amount: number }[]),
    });
  }

  submitKyc() {
    this.profileService.submitKyc(this.panNumber, this.aadhaarNumber).subscribe({
      next: (r) => alert(r.message),
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
