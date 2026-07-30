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
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Choose a game</p>
          <h1>Ready to play?</h1>
          <p class="hero-sub">Create or join 1v1 Ludo battles, win cash prizes, and climb the leaderboard.</p>
        </div>
      </section>

      <div class="disclaimer">
        आप सभी से निवेदन कि आप जिस नाम से केवाईसी कर रखे हैं उसी नाम से डिपॉजिट करें
        अगर आपने केवाईसी नाम के अलावा किसी अन्य व्यक्ति के नाम से डिपॉजिट किया है तो आपकी
        आईडी को जीरो करके ब्लॉक कर दिया जाएगा (केवाईसी नाम व डिपॉजिट नाम और विड्रॉल नाम एक होना चाहिए)
      </div>

      <div class="tile-grid">
        <button type="button" class="game-card live" (click)="openLudoClassic()">
          <div class="card-art">
            <img src="/assets/games/ludo-classic-web.png" alt="" />
          </div>
          <div class="card-body">
            <span class="badge live-badge">LIVE</span>
            <h2>Ludo Classic</h2>
            <p>Classic 1v1 battles · Instant matchmaking</p>
            <span class="cta">Play Now →</span>
          </div>
        </button>

        <button type="button" class="game-card support" (click)="openWhatsApp()">
          <div class="card-art">
            <img src="/assets/games/whatsapp-support-web.png" alt="" />
          </div>
          <div class="card-body">
            <span class="badge support-badge">HELP</span>
            <h2>WhatsApp Support</h2>
            <p>Chat with our team for deposits, KYC & more</p>
            <span class="cta">Open Chat →</span>
          </div>
        </button>

        <button type="button" class="game-card soon" disabled>
          <div class="card-art">
            <img src="/assets/games/ludo-speed-web.png" alt="" />
          </div>
          <div class="card-body">
            <span class="badge soon-badge">COMING SOON</span>
            <h2>Ludo Speed</h2>
            <p>Faster rounds and bigger thrills — stay tuned</p>
            <span class="cta muted">Notify later</span>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .home { padding-top: 4px; }

    .hero {
      margin-bottom: 20px;
    }
    .eyebrow {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #67e8f9;
      margin-bottom: 6px;
    }
    .hero h1 {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 8px;
    }
    .hero-sub {
      font-size: 15px;
      color: #a3a3b8;
      max-width: 520px;
      line-height: 1.5;
    }

    .disclaimer {
      background: linear-gradient(180deg, #2a0f4a 0%, #140820 100%);
      border: 1px solid rgba(236, 72, 153, 0.45);
      box-shadow: 0 0 16px rgba(168, 85, 247, 0.25);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 24px;
      color: #fff;
      font-size: 13px;
      line-height: 1.55;
      font-weight: 500;
    }

    .tile-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .game-card {
      all: unset;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 0;
      width: 100%;
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      background: rgba(16, 8, 32, 0.9);
      border: 1px solid rgba(168, 85, 247, 0.35) !important;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .game-card:not(:disabled):hover {
      transform: translateY(-2px);
      border-color: rgba(34, 211, 238, 0.55) !important;
      box-shadow: 0 16px 40px rgba(88, 28, 135, 0.35);
    }
    .game-card:not(:disabled):active {
      transform: scale(0.99);
    }
    .game-card.soon {
      cursor: not-allowed;
      opacity: 0.78;
    }
    .game-card.live {
      border-color: rgba(250, 204, 21, 0.45) !important;
    }
    .game-card.support {
      border-color: rgba(37, 211, 102, 0.4) !important;
    }

    .card-art {
      background: #0a0614;
      min-height: 110px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .card-art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-body {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      text-align: left;
    }
    .badge {
      display: inline-flex;
      align-self: flex-start;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 3px 8px;
      border-radius: 999px;
      margin-bottom: 4px;
    }
    .live-badge {
      background: rgba(250, 204, 21, 0.15);
      color: #facc15;
      border: 1px solid rgba(250, 204, 21, 0.4);
    }
    .support-badge {
      background: rgba(37, 211, 102, 0.12);
      color: #4ade80;
      border: 1px solid rgba(37, 211, 102, 0.35);
    }
    .soon-badge {
      background: rgba(168, 85, 247, 0.15);
      color: #c4b5fd;
      border: 1px solid rgba(168, 85, 247, 0.35);
    }
    .card-body h2 {
      font-size: 17px;
      font-weight: 800;
      color: #fff;
    }
    .card-body p {
      font-size: 13px;
      color: #a3a3b8;
      line-height: 1.4;
    }
    .cta {
      margin-top: 8px;
      font-size: 13px;
      font-weight: 800;
      color: #67e8f9;
    }
    .cta.muted { color: #71717a; }

    @media (min-width: 700px) {
      .hero h1 { font-size: 34px; }
      .tile-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      .game-card {
        grid-template-columns: 1fr;
        min-height: 320px;
      }
      .card-art {
        min-height: 180px;
        aspect-ratio: 16 / 11;
      }
      .card-body {
        padding: 18px;
        flex: 1;
      }
      .card-body h2 { font-size: 20px; }
    }

    @media (min-width: 1100px) {
      .game-card { min-height: 360px; }
      .card-art { min-height: 200px; }
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
