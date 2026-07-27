import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReferralService } from '../../core/services/wallet.service';

@Component({
  selector: 'app-refer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page refer-page">
      <div class="hero">
        <span class="badge">SPECIAL PROGRAM</span>
        <h1>Refer & <span>Earn</span></h1>
        <p>Share the joy with friends and unlock exclusive cash rewards for every sign-up!</p>
        <div class="hero-art" aria-hidden="true">
          <div class="bubble left">📣</div>
          <div class="shake">🤝</div>
          <div class="bubble right">🪙</div>
        </div>
      </div>

      @if (referral) {
        <div class="code-card">
          <label>Referral Code</label>
          <div class="code-row">
            <strong>{{ referral.code }}</strong>
            <button type="button" class="copy-btn" (click)="copyCode()">COPY</button>
          </div>
        </div>

        <button type="button" class="wa-btn" (click)="shareWhatsApp()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12.04 2C6.58 2 2.15 6.4 2.15 11.86c0 1.94.57 3.74 1.56 5.26L2 22l5.05-1.64a9.86 9.86 0 0 0 4.99 1.35h.01c5.46 0 9.89-4.4 9.89-9.85C21.94 6.4 17.5 2 12.04 2zm5.75 13.93c-.24.68-1.4 1.24-1.94 1.32-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.26-4.79-4.2-4.93-4.39-.14-.2-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.57-.35.76-.35h.55c.17 0 .4-.07.62.48.24.58.81 2 .88 2.14.07.14.12.3.02.49-.1.2-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.57.16.28.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.28.36-.23.61-.14.24.1 1.55.73 1.81.86.27.14.44.2.51.31.07.11.07.64-.17 1.32z"/>
          </svg>
          Whatsapp
        </button>

        <h3 class="perf-title">YOUR PERFORMANCE</h3>
        <div class="perf-card">
          <div>
            <span>Referred Players</span>
            <strong>{{ referral.totalReferrals }}</strong>
          </div>
          <span class="trophy">🏆</span>
        </div>
        <div class="perf-card">
          <div>
            <span>Referral Earning</span>
            <strong>₹{{ referral.totalEarnings }}</strong>
          </div>
          <span class="earn-ico">₹</span>
        </div>
        <p class="bonus-note">Earn ₹{{ referral.bonus }} per successful referral</p>
      }

      @if (message) { <div class="alert success">{{ message }}</div> }
    </div>
  `,
  styles: [`
    .refer-page { padding-top: 4px; }

    .hero {
      background: linear-gradient(160deg, #1a0a3d 0%, #0b1228 100%);
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 20px;
      padding: 20px 16px 18px;
      text-align: center;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-block;
      background: #7c3aed;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 5px 10px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    .hero h1 {
      font-size: 32px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 8px;
    }
    .hero h1 span { color: #c4b5fd; }
    .hero p {
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.45;
      max-width: 320px;
      margin: 0 auto 14px;
    }
    .hero-art {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 28px;
    }
    .bubble, .shake {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(250, 204, 21, 0.12);
      border: 2px solid rgba(250, 204, 21, 0.45);
    }

    .code-card {
      background: #fff;
      color: #111;
      border-radius: 16px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .code-card label {
      display: block;
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .code-row {
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1.5px dashed #cbd5e1;
      border-radius: 12px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .code-row strong {
      flex: 1;
      font-size: 22px;
      letter-spacing: 0.08em;
      font-weight: 800;
    }
    .copy-btn {
      border: none;
      background: #1f2937;
      color: #fff;
      font-weight: 800;
      font-size: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-family: inherit;
    }

    .wa-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: none;
      border-radius: 14px;
      padding: 14px;
      background: #25d366;
      color: #fff;
      font-size: 17px;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
      margin-bottom: 18px;
    }
    .wa-btn svg { width: 22px; height: 22px; }

    .perf-title {
      font-size: 12px;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .perf-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
      color: #111;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 10px;
    }
    .perf-card span { color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px; }
    .perf-card strong { font-size: 28px; font-weight: 800; }
    .trophy, .earn-ico {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #fef3c7; font-size: 18px; font-weight: 800;
    }
    .earn-ico { background: #dcfce7; color: #16a34a; }
    .bonus-note { color: #a3a3b8; font-size: 12px; text-align: center; margin-top: 8px; }
    .alert.success {
      margin-top: 12px; padding: 10px 12px; border-radius: 10px;
      background: rgba(34,197,94,0.15); color: #86efac; font-size: 13px;
    }
  `],
})
export class ReferComponent implements OnInit {
  private referralService = inject(ReferralService);

  referral: { code: string; link: string; bonus: number; totalReferrals: number; totalEarnings: number } | null = null;
  message = '';

  ngOnInit() {
    this.referralService.getReferralInfo().subscribe({
      next: (r) => (this.referral = r.referral),
    });
  }

  copyCode() {
    if (!this.referral?.code) return;
    navigator.clipboard.writeText(this.referral.code);
    this.message = 'Referral code copied!';
  }

  shareWhatsApp() {
    if (!this.referral) return;
    const text = encodeURIComponent(
      `Join Masti Ludo with my referral code ${this.referral.code} and play! ${this.referral.link}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }
}
