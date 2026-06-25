import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HomeService } from '../../core/services/battle.service';
import { AuthService } from '../../core/services/auth.service';
import { GAME_CARDS, GameCard } from '../../core/constants/games';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page dashboard">
      <section class="hero">
        <p class="hero-greet">Hello, {{ userName }} 👋</p>
        <h1 class="hero-title">Pick a game<br /><span>Start winning</span></h1>
        <p class="hero-sub">Choose your battle arena and challenge players</p>
      </section>

      @if (kycPending) {
        <div class="kyc-strip" (click)="goProfile()">
          <span>⚠️ Complete KYC to unlock full features</span>
          <span class="arrow">→</span>
        </div>
      }

      <div class="quick-stats">
        <div class="stat-box">
          <span class="stat-label">Wallet</span>
          <span class="stat-value">₹{{ walletBalance | number:'1.0-2' }}</span>
        </div>
        <div class="stat-box accent">
          <span class="stat-label">Income</span>
          <span class="stat-value">₹{{ income | number:'1.0-2' }}</span>
        </div>
      </div>

      <h2 class="section-title">Popular Games</h2>
      <p class="section-sub">Tap a game to enter the battle lobby</p>

      <div class="games-grid">
        @for (game of games; track game.slug) {
          <button
            class="game-card"
            [class.disabled]="game.status !== 'live'"
            [style.--game-accent]="game.accent"
            (click)="openGame(game)"
          >
            <div class="game-image-wrap">
              <img [src]="game.image" [alt]="game.name" class="game-image" />
              @if (game.status === 'live') {
                <span class="badge-live game-badge">● Live</span>
              } @else {
                <span class="badge-soon game-badge">Coming Soon</span>
              }
            </div>
            <div class="game-info">
              <h3>{{ game.name }}</h3>
              <p>{{ game.subtitle }}</p>
              @if (game.status === 'live') {
                <span class="play-cta">Play Now →</span>
              }
            </div>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding-top: 8px; }

    .hero {
      margin-bottom: 28px;
      padding: 8px 0 4px;
    }
    .hero-greet {
      font-size: 15px;
      color: var(--secondary);
      font-weight: 600;
      margin-bottom: 8px;
    }
    .hero-title {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 10px;
    }
    .hero-title span {
      background: var(--gradient-hero);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-sub {
      font-size: 15px;
      color: var(--text-muted);
      max-width: 320px;
    }

    .kyc-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      margin-bottom: 20px;
      border-radius: var(--radius-sm);
      background: rgba(249, 115, 22, 0.12);
      border: 1px solid rgba(249, 115, 22, 0.35);
      font-size: 14px;
      font-weight: 600;
      color: #fdba74;
      cursor: pointer;
    }
    .arrow { font-size: 18px; }

    .quick-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 32px;
    }
    .stat-box {
      padding: 18px 20px;
      border-radius: var(--radius);
      background: var(--gradient-card);
      border: 1px solid var(--border);
    }
    .stat-box.accent {
      border-color: rgba(6, 182, 212, 0.35);
      background: linear-gradient(160deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.04));
    }
    .stat-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: var(--text);
    }

    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 18px;
    }
    @media (min-width: 1200px) {
      .games-grid { grid-template-columns: repeat(4, 1fr); }
    }
    @media (max-width: 768px) {
      .hero { margin-bottom: 20px; }
      .hero-title { font-size: 28px; }
      .hero-sub { max-width: none; font-size: 14px; }
      .quick-stats { gap: 10px; margin-bottom: 24px; }
      .stat-box { padding: 14px 16px; }
      .stat-value { font-size: 22px; }
      .games-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .game-image-wrap { aspect-ratio: 3 / 4; }
      .game-info { padding: 12px 14px 16px; }
      .game-info h3 { font-size: 16px; }
      .kyc-strip {
        font-size: 13px;
        padding: 12px 14px;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
    }
    @media (max-width: 380px) {
      .hero-title { font-size: 24px; }
      .games-grid { grid-template-columns: 1fr; }
    }

    .game-card {
      all: unset;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      border-radius: var(--radius);
      overflow: hidden;
      border: 2px solid transparent;
      background: var(--bg-card-solid);
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    }
    .game-card:not(.disabled):hover {
      transform: translateY(-4px);
      border-color: var(--game-accent);
      box-shadow: 0 12px 40px rgba(124, 58, 237, 0.2);
    }
    .game-card.disabled {
      opacity: 0.75;
      cursor: not-allowed;
    }
    .game-image-wrap {
      position: relative;
      aspect-ratio: 4 / 5;
      overflow: hidden;
    }
    .game-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .game-badge {
      position: absolute;
      top: 12px;
      right: 12px;
    }
    .game-info {
      padding: 16px 18px 20px;
    }
    .game-info h3 {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .game-info p {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 10px;
    }
    .play-cta {
      font-size: 14px;
      font-weight: 700;
      color: var(--game-accent);
    }
  `],
})
export class HomeComponent implements OnInit, OnDestroy {
  private homeService = inject(HomeService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private userSub?: Subscription;

  games = GAME_CARDS;
  userName = 'Player';
  walletBalance = 0;
  income = 0;
  kycPending = false;

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.name) this.userName = user.name;
    else if (user?.mobile) this.userName = user.mobile;

    this.userSub = this.auth.user$.subscribe((u) => {
      if (!u) {
        return;
      }
      this.walletBalance = u.totalBalance ?? u.balance + (u.bonusBalance || 0);
      this.income = u.income ?? 0;
    });

    this.homeService.getHome().subscribe({
      next: (res) => {
        this.kycPending = res.home.kyc.status !== 'verified';
        this.walletBalance = res.home.walletBalance;
        this.income = res.home.income;
        const u = this.auth.getUser();
        if (u) {
          u.totalBalance = res.home.walletBalance;
          u.income = res.home.income;
          this.auth.updateUser(u);
        }
      },
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }

  openGame(game: GameCard) {
    if (game.status !== 'live') return;
    this.router.navigate(['/battles', game.slug]);
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }
}
