import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { HomeService } from '../../core/services/battle.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page home">
      <div class="disclaimer">
        आप सभी से निवेदन कि आप जिस नाम से केवाईसी कर रखे हैं उसी नाम से डिपॉजिट करें
        अगर आपने केवाईसी नाम के अलावा किसी अन्य व्यक्ति के नाम से डिपॉजिट किया है तो आपकी
        आईडी को जीरो करके ब्लॉक कर दिया जाएगा (केवाईसी नाम व डिपॉजिट नाम और विड्रॉल नाम एक होना चाहिए)
      </div>

      <div class="tile-grid">
        <button type="button" class="game-tile" (click)="openLudoClassic()">
          <img src="/assets/games/ludo-classic.png" alt="Ludo Classic" />
        </button>

        <button type="button" class="game-tile" (click)="openWhatsApp()">
          <img src="/assets/games/whatsapp-support.png" alt="WhatsApp Support" />
        </button>

        <button type="button" class="game-tile soon" disabled>
          <span class="soon-dot">COMING SOON</span>
          <img src="/assets/games/ludo-speed.svg" alt="Ludo Speed Coming Soon" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    .home { padding-top: 2px; }

    .disclaimer {
      background: linear-gradient(180deg, #2a0f4a 0%, #140820 100%);
      border: 1px solid rgba(236, 72, 153, 0.5);
      box-shadow: 0 0 16px rgba(168, 85, 247, 0.4);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 16px;
      color: #fff;
      font-size: 12px;
      line-height: 1.55;
      font-weight: 500;
    }

    .tile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .game-tile {
      all: unset;
      box-sizing: border-box;
      position: relative;
      display: block;
      width: 100%;
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      background: #000;
      border: 0 !important;
      outline: none !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      -webkit-tap-highlight-color: transparent;
      -webkit-appearance: none;
      appearance: none;
    }
    .game-tile:not(:disabled):active {
      transform: scale(0.985);
    }
    .game-tile.soon {
      cursor: not-allowed;
      opacity: 0.95;
    }

    .soon-dot {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 2;
      font-size: 10px;
      font-weight: 800;
      color: #facc15;
      background: rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(250, 204, 21, 0.5);
      padding: 3px 7px;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }

    .game-tile img {
      width: 104%;
      max-width: none;
      height: 104%;
      margin: -2%;
      aspect-ratio: 1;
      object-fit: cover;
      object-position: center;
      display: block;
      border: 0;
      background: #000;
    }

    @media (min-width: 640px) {
      .disclaimer { font-size: 13px; padding: 14px 16px; }
      .tile-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
    }
  `],
})
export class HomeComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private auth = inject(AuthService);
  private homeService = inject(HomeService);
  private router = inject(Router);

  supportWhatsApp = '';

  ngOnInit() {
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.supportWhatsApp = res.settings.supportWhatsApp || '';
      },
    });

    this.homeService.getHome().subscribe({
      next: (res) => {
        const u = this.auth.getUser();
        if (u) {
          u.totalBalance = res.home.walletBalance;
          u.income = res.home.income;
          this.auth.updateUser(u);
        }
      },
    });
  }

  openLudoClassic() {
    this.router.navigate(['/battles', 'ludo-classic']);
  }

  openWhatsApp() {
    const open = (raw: string) => {
      const number = (raw || '').replace(/\D/g, '');
      if (!number) {
        alert('WhatsApp support number is not configured. Set it in Admin → Settings.');
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
      error: () => alert('Unable to load WhatsApp support number.'),
    });
  }
}
