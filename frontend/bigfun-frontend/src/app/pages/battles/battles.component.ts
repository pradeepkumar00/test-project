import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BattleService } from '../../core/services/battle.service';
import { AuthService } from '../../core/services/auth.service';
import { Battle } from '../../core/models';
import { getGameBySlug, GameCard } from '../../core/constants/games';

@Component({
  selector: 'app-battles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page battles-page">
      <button class="back-btn" routerLink="/home">← Back to Games</button>

      @if (game) {
        <div class="game-banner" [style.--accent]="game.accent">
          <img [src]="game.image" [alt]="game.name" class="banner-img" />
          <div class="banner-overlay">
            <h1>{{ game.name }}</h1>
            <p>{{ game.subtitle }}</p>
          </div>
        </div>

        @if (game.status !== 'live') {
          <div class="alert error">This game is coming soon. Try Ludo Classic!</div>
        } @else {
          <section class="create-section card">
            <h2 class="block-title">Create Battle</h2>
            <p class="block-sub">Set entry fee and wait for an opponent</p>
            <div class="create-row">
              <div class="fee-input-wrap">
                <label>Entry Fee (₹)</label>
                <input type="number" [(ngModel)]="entryFee" (ngModelChange)="onEntryFeeChange()" min="10" />
              </div>
              @if (previewPrize) {
                <div class="prize-box">
                  <span>Win Prize</span>
                  <strong>₹{{ previewPrize | number:'1.0-2' }}</strong>
                </div>
              }
            </div>
            <button class="btn btn-primary btn-block" [disabled]="creating" (click)="createBattle()">
              {{ creating ? 'Creating...' : 'Create Battle' }}
            </button>
            @if (battleMsg) {
              <div class="alert" [class.success]="battleSuccess" [class.error]="!battleSuccess">{{ battleMsg }}</div>
            }
          </section>

          <section class="battles-section">
            <h2 class="block-title">Open Battles</h2>
            @if (loadingOpen) { <div class="spinner">Loading...</div> }
            @else if (!filteredOpen.length) { <p class="empty">No open battles — create one!</p> }
            @for (b of filteredOpen; track b.id) {
              <div class="battle-item card">
                <div class="battle-top">
                  <span class="player-tag">From {{ b.creator?.name || b.creator?.mobile }}</span>
                </div>
                <div class="battle-mid">
                  <div class="fee-col">
                    <small>Entry</small>
                    <strong>₹{{ b.entryFee }}</strong>
                  </div>
                  <button class="btn btn-primary btn-sm" [disabled]="joiningId === b.id" (click)="joinBattle(b.id)">
                    {{ joiningId === b.id ? '...' : 'JOIN' }}
                  </button>
                  <div class="fee-col right">
                    <small>Prize</small>
                    <strong class="prize">₹{{ b.winningPrize }}</strong>
                  </div>
                </div>
              </div>
            }
          </section>

          <section class="battles-section">
            <h2 class="block-title">Live Battles</h2>
            @if (loadingRunning) { <div class="spinner">Loading...</div> }
            @else if (!filteredRunning.length) { <p class="empty">No battles running right now</p> }
            @for (b of filteredRunning; track b.id) {
              <div class="battle-item live card">
                <div class="battle-top">
                  <span class="live-dot">● LIVE</span>
                  <span>{{ b.creator?.name || b.creator?.mobile }} vs {{ b.joiner?.name || b.joiner?.mobile }}</span>
                </div>
                <div class="battle-mid center">
                  <div class="fee-col">
                    <small>Entry</small>
                    <strong>₹{{ b.entryFee }}</strong>
                  </div>
                  <span class="vs">VS</span>
                  <div class="fee-col">
                    <small>Prize</small>
                    <strong class="prize">₹{{ b.winningPrize }}</strong>
                  </div>
                </div>
              </div>
            }
          </section>
        }
      } @else {
        <div class="alert error">Game not found. <a routerLink="/home">Go back</a></div>
      }
    </div>
  `,
  styles: [`
    .battles-page { padding-top: 4px; }

    .back-btn {
      all: unset;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 16px;
      display: inline-block;
    }
    .back-btn:hover { color: var(--primary-light); }

    .game-banner {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 24px;
      height: 200px;
      border: 2px solid var(--accent);
      box-shadow: 0 8px 32px color-mix(in srgb, var(--accent) 30%, transparent);
    }
    .banner-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }
    .banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 20px 24px;
    }
    .banner-overlay h1 {
      font-size: 28px;
      font-weight: 800;
    }
    .banner-overlay p {
      font-size: 14px;
      color: var(--text-muted);
    }

    .block-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .block-sub {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 18px;
    }

    .create-section { margin-bottom: 28px; }
    .create-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 14px;
      align-items: end;
      margin-bottom: 16px;
    }
    @media (max-width: 480px) {
      .create-row { grid-template-columns: 1fr; }
    }
    .fee-input-wrap label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .prize-box {
      padding: 14px 20px;
      border-radius: var(--radius-sm);
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      text-align: center;
    }
    .prize-box span {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .prize-box strong {
      font-size: 22px;
      color: #34d399;
    }

    .battles-section { margin-bottom: 28px; }
    @media (min-width: 900px) {
      .battles-page {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: start;
      }
      .back-btn, .game-banner, .create-section, .alert.error {
        grid-column: 1 / -1;
      }
    }
    .battle-item { margin-bottom: 14px; }
    .battle-item.live { border-color: rgba(124, 58, 237, 0.4); }
    .battle-top {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .live-dot { color: var(--danger); font-weight: 700; font-size: 12px; }
    .battle-mid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .battle-mid.center { justify-content: center; }
    .fee-col small {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .fee-col strong { font-size: 20px; font-weight: 800; }
    .fee-col .prize { color: #34d399; }
    .fee-col.right { text-align: right; }
    .vs {
      font-size: 22px;
      font-weight: 900;
      color: var(--primary-light);
    }
    .empty { color: var(--text-muted); font-size: 14px; padding: 12px 0; }

    @media (max-width: 768px) {
      .game-banner { height: 160px; margin-bottom: 16px; }
      .banner-overlay { padding: 16px; }
      .banner-overlay h1 { font-size: 22px; }
      .battle-top {
        flex-wrap: wrap;
        font-size: 12px;
      }
      .battle-mid {
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
      }
      .battle-mid.center { gap: 20px; }
      .fee-col.right { text-align: left; }
      .fee-col strong { font-size: 18px; }
    }
  `],
})
export class BattlesComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private battleService = inject(BattleService);
  private auth = inject(AuthService);

  game: GameCard | undefined;
  gameSlug = '';
  entryFee = 100;
  previewPrize: number | null = null;
  openBattles: Battle[] = [];
  runningBattles: Battle[] = [];
  loadingOpen = true;
  loadingRunning = true;
  creating = false;
  joiningId = '';
  battleMsg = '';
  battleSuccess = false;
  private refreshTimer?: ReturnType<typeof setInterval>;

  get filteredOpen() {
    return this.openBattles.filter((b) => b.gameType === this.gameSlug);
  }

  get filteredRunning() {
    return this.runningBattles.filter((b) => b.gameType === this.gameSlug);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      if (this.refreshTimer) clearInterval(this.refreshTimer);

      this.gameSlug = params.get('gameSlug') || '';
      this.game = getGameBySlug(this.gameSlug);
      this.loadingOpen = true;
      this.loadingRunning = true;

      if (this.game?.status === 'live') {
        this.loadBattles();
        this.onEntryFeeChange();
        this.refreshTimer = setInterval(() => this.loadBattles(), 15000);
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  onEntryFeeChange() {
    if (this.entryFee > 0) {
      this.battleService.previewPrize(this.entryFee).subscribe({
        next: (r) => (this.previewPrize = r.winningPrize),
      });
    }
  }

  loadBattles() {
    this.battleService.getOpenBattles().subscribe({
      next: (r) => {
        this.openBattles = r.battles;
        this.loadingOpen = false;
      },
      error: () => (this.loadingOpen = false),
    });
    this.battleService.getRunningBattles().subscribe({
      next: (r) => {
        this.runningBattles = r.battles;
        this.loadingRunning = false;
      },
      error: () => (this.loadingRunning = false),
    });
  }

  createBattle() {
    this.creating = true;
    this.battleMsg = '';
    this.battleService.createBattle(this.entryFee, this.gameSlug).subscribe({
      next: (r) => {
        this.battleSuccess = true;
        this.battleMsg = r.message;
        this.auth.fetchProfile().subscribe();
        this.loadBattles();
        this.creating = false;
      },
      error: (e) => {
        this.battleSuccess = false;
        this.battleMsg = e.error?.message || 'Failed';
        this.creating = false;
      },
    });
  }

  joinBattle(id: string) {
    this.joiningId = id;
    this.battleService.joinBattle(id).subscribe({
      next: () => {
        this.auth.fetchProfile().subscribe();
        this.loadBattles();
        this.joiningId = '';
      },
      error: (e) => {
        alert(e.error?.message || 'Failed to join');
        this.joiningId = '';
      },
    });
  }
}
