import { Component, inject, OnInit } from '@angular/core';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [],
  template: `
    <div class="page">
      <h2 class="section-title">Support</h2>
      <div class="card">
        <p>Need help? Contact our support team.</p>
        @if (supportEmail) {
          <p class="email">
            📧
            <a [href]="'mailto:' + supportEmail">{{ supportEmail }}</a>
          </p>
        } @else {
          <p class="email muted">Loading support contact...</p>
        }
        <p class="note">We typically respond within 24 hours.</p>
      </div>
      <div class="card faq">
        <h3>FAQs</h3>
        <details>
          <summary>How do I deposit money?</summary>
          <p>Go to Wallet, pay via UPI, then submit amount and UTR number.</p>
        </details>
        <details>
          <summary>How do battles work?</summary>
          <p>Create a battle with coins. Another player joins with same amount. Winner gets total minus 2.5% fee.</p>
        </details>
        <details>
          <summary>Withdrawal time?</summary>
          <p>Withdrawals are processed within 24 hours after admin approval.</p>
        </details>
      </div>
    </div>
  `,
  styles: [`
    .email { color: var(--gold); font-size: 18px; margin: 16px 0; }
    .email a { color: inherit; text-decoration: none; }
    .email a:hover { text-decoration: underline; }
    .muted { color: var(--text-muted); font-size: 14px; }
    .note { color: var(--text-muted); font-size: 13px; }
    .faq { margin-top: 16px; }
    .faq h3 { margin-bottom: 12px; }
    .faq details { margin-bottom: 10px; }
    .faq summary { cursor: pointer; font-weight: 600; }
    .faq p { color: var(--text-muted); font-size: 13px; margin-top: 6px; padding-left: 8px; }
  `],
})
export class SupportComponent implements OnInit {
  private settingsService = inject(SettingsService);

  supportEmail = '';

  ngOnInit() {
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.supportEmail = res.settings.supportEmail;
      },
      error: () => {
        this.supportEmail = '';
      },
    });
  }
}
