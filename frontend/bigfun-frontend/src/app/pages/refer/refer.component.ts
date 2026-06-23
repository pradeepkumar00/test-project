import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { ReferralService } from '../../core/services/wallet.service';

@Component({
  selector: 'app-refer',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BottomNavComponent],
  template: `
    <app-header />
    <div class="page">
      <h2 class="section-title">Refer & Earn</h2>
      @if (referral) {
        <div class="card refer-card">
          <p>Share your code and earn ₹{{ referral.bonus }} per referral!</p>
          <div class="code-box">{{ referral.code }}</div>
          <button class="btn btn-gold btn-block" (click)="copyLink()">Copy Referral Link</button>
          <div class="stats">
            <div>
              <strong>{{ referral.totalReferrals }}</strong>
              <span>Referrals</span>
            </div>
            <div>
              <strong>₹{{ referral.totalEarnings }}</strong>
              <span>Earned</span>
            </div>
          </div>
        </div>
      }
      @if (message) { <div class="alert success">{{ message }}</div> }

      <h3 class="section-title">Referred Users</h3>
      @for (u of referredUsers; track u.mobile) {
        <div class="user-item card">{{ u.name || u.mobile }}</div>
      }
      @if (!referredUsers.length) { <p class="empty">No referrals yet</p> }
    </div>
    <app-bottom-nav />
  `,
  styles: [`
    .refer-card { text-align: center; }
    .code-box { font-size: 32px; font-weight: 800; color: var(--gold); letter-spacing: 4px; margin: 16px 0; }
    .stats { display: flex; justify-content: space-around; margin-top: 20px; }
    .stats div { text-align: center; }
    .stats strong { display: block; font-size: 22px; color: var(--gold); }
    .stats span { font-size: 12px; color: var(--text-muted); }
    .user-item { margin-bottom: 8px; font-size: 14px; }
    .empty { color: var(--text-muted); }
  `],
})
export class ReferComponent implements OnInit {
  private referralService = inject(ReferralService);

  referral: { code: string; link: string; bonus: number; totalReferrals: number; totalEarnings: number } | null = null;
  referredUsers: { name?: string; mobile: string }[] = [];
  message = '';

  ngOnInit() {
    this.referralService.getReferralInfo().subscribe({
      next: (r) => (this.referral = r.referral),
    });
    this.referralService.getReferralStats().subscribe({
      next: (r) => (this.referredUsers = r.referredUsers as { name?: string; mobile: string }[]),
    });
  }

  copyLink() {
    if (this.referral?.link) {
      navigator.clipboard.writeText(this.referral.link);
      this.message = 'Referral link copied!';
    }
  }
}
