import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BattleService } from '../../core/services/battle.service';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { Battle, LeaderboardPlayer } from '../../core/models';
import { getGameBySlug, GameCard } from '../../core/constants/games';
import { firstValueFrom } from 'rxjs';

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
            <p class="block-sub">Public battle — anyone can join. Platform fee share may use Referral Cash.</p>
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
              {{ creating ? 'Creating...' : 'SET' }}
            </button>
            @if (battleMsg) {
              <div class="alert" [class.success]="battleSuccess" [class.error]="!battleSuccess">{{ battleMsg }}</div>
            }
          </section>

          <section class="battles-section challenges-section">
            <h2 class="block-title">Challenges</h2>
            <p class="block-sub center-sub">Incoming challenges you can accept, and challenges you sent</p>
            @if (loadingChallenges) { <div class="spinner">Loading...</div> }
            @else if (!filteredChallenges.length) {
              <p class="empty">No pending challenges</p>
            }
            @for (b of filteredChallenges; track b.id) {
              <div class="battle-item card" [class.incoming]="b.direction === 'incoming'">
                <div class="battle-top">
                  @if (b.direction === 'incoming') {
                    <span class="player-tag challenge-tag">Challenge from {{ b.creator?.name || b.creator?.mobile }}</span>
                  } @else {
                    <span class="player-tag sent-tag">Waiting for {{ b.challengedUser?.name || b.challengedUser?.mobile }}</span>
                  }
                </div>
                <div class="battle-mid">
                  <div class="fee-col">
                    <small>Entry</small>
                    <strong>₹{{ b.entryFee }}</strong>
                  </div>
                  @if (b.direction === 'incoming') {
                    <button class="btn btn-primary btn-sm" [disabled]="joiningId === b.id" (click)="joinBattle(b.id)">
                      {{ joiningId === b.id ? '...' : 'Accept' }}
                    </button>
                  } @else {
                    <span class="waiting-pill">Sent</span>
                  }
                  <div class="fee-col right">
                    <small>Prize</small>
                    <strong class="prize">₹{{ b.winningPrize }}</strong>
                  </div>
                </div>
              </div>
            }
          </section>

          <section class="battles-section leaderboard-section">
            <h2 class="block-title">Leaderboard</h2>
            <p class="block-sub center-sub">Ranked by wins · Challenge a player to a private battle</p>
            @if (loadingLeaderboard) { <div class="spinner">Loading...</div> }
            @else if (!leaderboard.length) { <p class="empty">No players yet</p> }
            @else {
              <div class="lb-list card">
                @for (p of leaderboard; track p.id) {
                  <div class="lb-row" [class.me]="p.isMe">
                    <span class="lb-rank" [class.top]="p.rank <= 3">#{{ p.rank }}</span>
                    <div class="lb-info">
                      <strong>{{ p.name }}{{ p.isMe ? ' (You)' : '' }}</strong>
                      <small>{{ p.gamesWon }}W · {{ p.gamesLost }}L · ₹{{ p.earnings | number:'1.0-0' }} won</small>
                    </div>
                    @if (!p.isMe) {
                      <button class="btn btn-outline btn-sm" (click)="openChallenge(p)">Challenge</button>
                    }
                  </div>
                }
              </div>
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
                    {{ joiningId === b.id ? '...' : 'Play' }}
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

      @if (challengeTarget) {
        <div class="modal-backdrop" (click)="closeChallenge()"></div>
        <div class="modal card">
          <h3>Challenge {{ challengeTarget.name }}</h3>
          <p class="block-sub">They will see this in their Challenges list and can Accept.</p>
          <div class="fee-input-wrap">
            <label>Entry Fee (₹)</label>
            <input type="number" [(ngModel)]="challengeFee" (ngModelChange)="onChallengeFeeChange()" min="10" />
          </div>
          @if (challengePreviewPrize) {
            <div class="prize-box modal-prize">
              <span>Win Prize</span>
              <strong>₹{{ challengePreviewPrize | number:'1.0-2' }}</strong>
            </div>
          }
          @if (challengeMsg) {
            <div class="alert error">{{ challengeMsg }}</div>
          }
          <div class="modal-actions">
            <button class="btn btn-outline" [disabled]="challenging" (click)="closeChallenge()">Cancel</button>
            <button class="btn btn-primary" [disabled]="challenging" (click)="sendChallenge()">
              {{ challenging ? 'Sending...' : 'Send Challenge' }}
            </button>
          </div>
        </div>
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
    .center-sub { text-align: center; }

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
    .fee-input-wrap input {
      width: 100%;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-size: 16px;
      font-weight: 700;
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
    .modal-prize { margin: 14px 0; }

    .battles-section { margin-bottom: 28px; }
    @media (min-width: 900px) {
      .battles-page {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: start;
      }
      .back-btn, .game-banner, .create-section, .alert.error, .leaderboard-section {
        grid-column: 1 / -1;
      }
    }
    .battle-item { margin-bottom: 14px; }
    .battle-item.live { border-color: rgba(250, 204, 21, 0.55); }
    .battle-item.incoming { border-color: rgba(96, 165, 250, 0.5); }
    .player-tag { color: #facc15; font-weight: 700; }
    .challenge-tag { color: #60a5fa; }
    .sent-tag { color: var(--text-muted); }
    .waiting-pill {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .create-section .block-title { color: #facc15; }
    .battles-section .block-title { color: #fff; text-align: center; }
    .btn-primary {
      background: #facc15 !important;
      color: #000 !important;
    }
    .vs {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      background: #facc15;
      color: #000;
      border-radius: 8px;
      font-size: 16px;
    }
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
    .empty { color: var(--text-muted); font-size: 14px; padding: 12px 0; text-align: center; }

    .lb-list { padding: 0; overflow: hidden; }
    .lb-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    .lb-row:last-child { border-bottom: none; }
    .lb-row.me { background: rgba(250, 204, 21, 0.08); }
    .lb-rank {
      width: 36px;
      font-weight: 800;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .lb-rank.top { color: #facc15; }
    .lb-info { flex: 1; min-width: 0; }
    .lb-info strong {
      display: block;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lb-info small {
      color: var(--text-muted);
      font-size: 12px;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      z-index: 40;
    }
    .modal {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 50;
      width: min(400px, calc(100vw - 32px));
      padding: 22px;
    }
    .modal h3 {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 18px;
    }

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
  private settingsService = inject(SettingsService);

  game: GameCard | undefined;
  gameSlug = '';
  entryFee = 100;
  previewPrize: number | null = null;
  openBattles: Battle[] = [];
  runningBattles: Battle[] = [];
  challenges: Battle[] = [];
  leaderboard: LeaderboardPlayer[] = [];
  loadingOpen = true;
  loadingRunning = true;
  loadingChallenges = true;
  loadingLeaderboard = true;
  creating = false;
  joiningId = '';
  battleMsg = '';
  battleSuccess = false;

  challengeTarget: LeaderboardPlayer | null = null;
  challengeFee = 100;
  challengePreviewPrize: number | null = null;
  challenging = false;
  challengeMsg = '';

  private refreshTimer?: ReturnType<typeof setInterval>;

  get filteredOpen() {
    return this.openBattles.filter((b) => b.gameType === this.gameSlug);
  }

  get filteredRunning() {
    return this.runningBattles.filter((b) => b.gameType === this.gameSlug);
  }

  get filteredChallenges() {
    return this.challenges.filter((b) => b.gameType === this.gameSlug);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      if (this.refreshTimer) clearInterval(this.refreshTimer);

      this.gameSlug = params.get('gameSlug') || '';
      this.game = getGameBySlug(this.gameSlug);
      this.loadingOpen = true;
      this.loadingRunning = true;
      this.loadingChallenges = true;
      this.loadingLeaderboard = true;

      if (this.game?.status === 'live') {
        this.loadBattles();
        this.onEntryFeeChange();
        void this.setupBattlePolling();
      }
    });
  }

  private async setupBattlePolling(): Promise<void> {
    try {
      const response = await firstValueFrom(this.settingsService.getSettings());
      const { realtime } = response.settings;

      if (realtime.battlesPollingEnabled && realtime.battlesPollIntervalMs > 0) {
        this.refreshTimer = setInterval(
          () => this.loadBattles(),
          realtime.battlesPollIntervalMs
        );
      }
    } catch (error) {
      console.warn('[Battles] Failed to load polling config:', error);
    }
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

  onChallengeFeeChange() {
    if (this.challengeFee > 0) {
      this.battleService.previewPrize(this.challengeFee).subscribe({
        next: (r) => (this.challengePreviewPrize = r.winningPrize),
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
    this.battleService.getChallenges(this.gameSlug).subscribe({
      next: (r) => {
        this.challenges = r.battles;
        this.loadingChallenges = false;
      },
      error: () => (this.loadingChallenges = false),
    });
    this.battleService.getLeaderboard().subscribe({
      next: (r) => {
        this.leaderboard = r.leaderboard;
        this.loadingLeaderboard = false;
      },
      error: () => (this.loadingLeaderboard = false),
    });
  }

  private applyWallet(r: { balance?: number; bonusBalance?: number; totalBalance?: number }) {
    const u = this.auth.getUser();
    if (u) {
      if (typeof r.balance === 'number') u.balance = r.balance;
      if (typeof r.bonusBalance === 'number') u.bonusBalance = r.bonusBalance;
      if (typeof r.totalBalance === 'number') u.totalBalance = r.totalBalance;
      this.auth.updateUser(u);
    } else {
      this.auth.fetchProfile().subscribe();
    }
  }

  createBattle() {
    this.creating = true;
    this.battleMsg = '';
    this.battleService.createBattle(this.entryFee, this.gameSlug).subscribe({
      next: (r) => {
        this.battleSuccess = true;
        this.battleMsg = r.message;
        this.applyWallet(r);
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

  openChallenge(player: LeaderboardPlayer) {
    this.challengeTarget = player;
    this.challengeFee = this.entryFee || 100;
    this.challengeMsg = '';
    this.onChallengeFeeChange();
  }

  closeChallenge() {
    if (this.challenging) return;
    this.challengeTarget = null;
    this.challengeMsg = '';
  }

  sendChallenge() {
    if (!this.challengeTarget) return;
    this.challenging = true;
    this.challengeMsg = '';
    this.battleService
      .createBattle(this.challengeFee, this.gameSlug, this.challengeTarget.id)
      .subscribe({
        next: (r) => {
          this.applyWallet(r);
          this.challenging = false;
          this.challengeTarget = null;
          this.battleSuccess = true;
          this.battleMsg = r.message;
          this.loadBattles();
        },
        error: (e) => {
          this.challengeMsg = e.error?.message || 'Failed to send challenge';
          this.challenging = false;
        },
      });
  }

  joinBattle(id: string) {
    this.joiningId = id;
    this.battleService.joinBattle(id).subscribe({
      next: (r) => {
        this.applyWallet(r);
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
