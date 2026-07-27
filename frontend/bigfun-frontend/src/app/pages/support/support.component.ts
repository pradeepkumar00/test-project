import { Component, inject, OnInit } from '@angular/core';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [],
  template: `
    <div class="page support-page">
      <div class="help-banner">
        <div>
          <h1>Help Center</h1>
          <p>Chat with Masti Ludo support on WhatsApp — we're here 24/7.</p>
        </div>
        <div class="banner-art" aria-hidden="true">💬</div>
      </div>

      <h3 class="contact-title">CONTACT US ON WHATSAPP</h3>

      <button type="button" class="contact-card" (click)="openWhatsApp()">
        <span class="ico wa">
          <svg viewBox="0 0 24 24"><path fill="#25D366" d="M12.04 2C6.58 2 2.15 6.4 2.15 11.86c0 1.94.57 3.74 1.56 5.26L2 22l5.05-1.64a9.86 9.86 0 0 0 4.99 1.35h.01c5.46 0 9.89-4.4 9.89-9.85C21.94 6.4 17.5 2 12.04 2z"/><path fill="#fff" d="M17.79 15.93c-.24.68-1.4 1.24-1.94 1.32-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.26-4.79-4.2-4.93-4.39-.14-.2-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.57-.35.76-.35h.55c.17 0 .4-.07.62.48.24.58.81 2 .88 2.14.07.14.12.3.02.49-.1.2-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.57.16.28.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.28.36-.23.61-.14.24.1 1.55.73 1.81.86.27.14.44.2.51.31.07.11.07.64-.17 1.32z"/></svg>
        </span>
        <span class="meta">
          <strong>WhatsApp Chat</strong>
          <small>{{ supportWhatsApp ? 'Instant reply within minutes' : 'Loading support number...' }}</small>
        </span>
        <span class="chev">›</span>
      </button>

      @if (error) {
        <div class="alert">{{ error }}</div>
      }
    </div>
  `,
  styles: [`
    .support-page { padding-top: 4px; }

    .help-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: linear-gradient(120deg, #128c7e 0%, #25d366 100%);
      border-radius: 18px;
      padding: 20px 16px;
      margin-bottom: 18px;
      color: #fff;
    }
    .help-banner h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .help-banner p { font-size: 13px; opacity: 0.95; line-height: 1.4; max-width: 240px; }
    .banner-art {
      width: 72px; height: 72px; border-radius: 50%;
      background: rgba(255,255,255,0.22);
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; flex-shrink: 0;
    }

    .contact-title {
      font-size: 12px;
      letter-spacing: 0.06em;
      color: #e5e5e5;
      margin-bottom: 12px;
      font-weight: 800;
    }

    .contact-card {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      color: #111;
      border: none;
      border-radius: 14px;
      padding: 16px;
      text-decoration: none;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
    }
    .ico {
      width: 52px; height: 52px; border-radius: 14px;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      background: #dcfce7;
    }
    .ico.wa svg { width: 30px; height: 30px; }
    .meta { flex: 1; min-width: 0; }
    .meta strong { display: block; font-size: 16px; margin-bottom: 2px; }
    .meta small { color: #6b7280; font-size: 12px; }
    .chev { color: #94a3b8; font-size: 24px; line-height: 1; }
    .alert {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(239,68,68,0.15);
      color: #fda4af;
      font-size: 13px;
    }
  `],
})
export class SupportComponent implements OnInit {
  private settingsService = inject(SettingsService);

  supportWhatsApp = '';
  error = '';

  ngOnInit() {
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.supportWhatsApp = res.settings.supportWhatsApp || '';
      },
      error: () => {
        this.supportWhatsApp = '';
      },
    });
  }

  openWhatsApp() {
    this.error = '';
    const open = (raw: string) => {
      const number = (raw || '').replace(/\D/g, '');
      if (!number) {
        this.error = 'WhatsApp support number is not configured yet.';
        return;
      }
      window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer');
    };

    if (this.supportWhatsApp) {
      open(this.supportWhatsApp);
      return;
    }

    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.supportWhatsApp = res.settings.supportWhatsApp || '';
        open(this.supportWhatsApp);
      },
      error: () => {
        this.error = 'Unable to load WhatsApp support number.';
      },
    });
  }
}
