import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
          <div class="battles-layout">
            <div class="col-main">
              @if (activeBattle) {
                <div class="active-banner card">
                  <div>
                    <strong>One battle at a time</strong>
                    <p>You already have an active {{ activeBattleLabel }} battle. Finish or cancel it before creating or joining another.</p>
                  </div>
                  <button type="button" class="btn btn-primary btn-sm" (click)="openRoom(activeBattle.id)">
                    Go to Battle
                  </button>
                </div>
              }

              <section class="create-section card">
                <h2 class="block-title">Create Battle</h2>
                <p class="block-sub">Public battle — anyone can join. Platform fee share may use Referral Cash.</p>
                <div class="create-row">
                  <div class="fee-input-wrap">
                    <label>Entry Fee (₹)</label>
                    <input type="number" [(ngModel)]="entryFee" (ngModelChange)="onEntryFeeChange()" min="10" [disabled]="!!activeBattle" />
                  </div>
                  @if (previewPrize) {
                    <div class="prize-box">
                      <span>Win Prize</span>
                      <strong>₹{{ previewPrize | number:'1.0-2' }}</strong>
                    </div>
                  }
                </div>
                <button class="btn btn-primary btn-block" [disabled]="creating || !!activeBattle" (click)="createBattle()">
                  {{ creating ? 'Creating...' : (activeBattle ? 'Finish current battle first' : 'SET') }}
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
                      <span class="player-tag">{{ isMine(b) ? 'Your battle' : ('From ' + (b.creator?.name || b.creator?.mobile)) }}</span>
                    </div>
                    <div class="battle-mid">
                      <div class="fee-col">
                        <small>Entry</small>
                        <strong>₹{{ b.entryFee }}</strong>
                      </div>
                      @if (isMine(b)) {
                        <span class="waiting-pill">Waiting for opponent</span>
                        <button class="btn btn-danger btn-sm" [disabled]="joiningId === b.id" (click)="askDelete(b.id)">Delete</button>
                      } @else {
                        <button class="btn btn-primary btn-sm" [disabled]="joiningId === b.id || !!activeBattle" (click)="joinBattle(b.id)">
                          {{ joiningId === b.id ? '...' : (activeBattle ? 'Busy' : 'Play Now') }}
                        </button>
                      }
                      <div class="fee-col right">
                        <small>Prize</small>
                        <strong class="prize">₹{{ b.winningPrize }}</strong>
                      </div>
                    </div>
                  </div>
                }
              </section>

              <section class="battles-section">
                <h2 class="block-title">Waiting to Start</h2>
                <p class="block-sub">Opponent joined — creator must enter Ludo King room code</p>
                @if (loadingMatched) { <div class="spinner">Loading...</div> }
                @else if (!filteredMatched.length) { <p class="empty">No battles waiting to start</p> }
                @for (b of filteredMatched; track b.id) {
                  <div class="battle-item card matched-item">
                    <div class="battle-top">
                      <span class="live-dot matched-dot">● MATCHED</span>
                      <span>{{ b.creator?.name || b.creator?.mobile }} vs {{ b.joiner?.name || b.joiner?.mobile }}</span>
                    </div>
                    <div class="battle-mid center">
                      <div class="fee-col">
                        <small>Entry</small>
                        <strong>₹{{ b.entryFee }}</strong>
                      </div>
                      @if (isCreator(b)) {
                        <button class="btn btn-primary btn-sm" (click)="openRoom(b.id)">Start</button>
                      } @else {
                        <button class="btn btn-outline btn-sm" (click)="openRoom(b.id)">Waiting…</button>
                      }
                      <div class="fee-col">
                        <small>Prize</small>
                        <strong class="prize">₹{{ b.winningPrize }}</strong>
                      </div>
                    </div>
                    @if (b.startDeadlineAt) {
                      <div class="match-timer">Start within {{ startCountdown(b) }}</div>
                    }
                  </div>
                }
              </section>

              <section class="battles-section">
                <h2 class="block-title">Live Battles</h2>
                @if (loadingRunning) { <div class="spinner">Loading...</div> }
                @else if (!filteredRunning.length) { <p class="empty">No battles running right now</p> }
                @for (b of filteredRunning; track b.id) {
                  <div
                    class="battle-item live card clickable"
                    (click)="onLiveClick(b)"
                  >
                    <div class="battle-top">
                      <span class="live-dot">● {{ b.status === 'pending_verification' ? 'VERIFY' : 'LIVE' }}</span>
                      <span>{{ b.creator?.name || b.creator?.mobile }} vs {{ b.joiner?.name || b.joiner?.mobile }}</span>
                    </div>
                    <div class="battle-mid center">
                      <div class="fee-col">
                        <small>Entry</small>
                        <strong>₹{{ b.entryFee }}</strong>
                      </div>
                      @if (isMine(b)) {
                        <button class="btn btn-outline btn-sm" (click)="openRoom(b.id); $event.stopPropagation()">Enter</button>
                      } @else {
                        <span class="vs">VS</span>
                      }
                      <div class="fee-col">
                        <small>Prize</small>
                        <strong class="prize">₹{{ b.winningPrize }}</strong>
                      </div>
                    </div>
                  </div>
                }
              </section>
            </div>

            <aside class="col-side">
              <section class="battles-section challenges-section">
                <h2 class="block-title">Challenges</h2>
                <p class="block-sub">Incoming challenges you can accept, and challenges you sent</p>
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
                        <button class="btn btn-primary btn-sm" [disabled]="joiningId === b.id || !!activeBattle" (click)="joinBattle(b.id)">
                          {{ joiningId === b.id ? '...' : (activeBattle ? 'Busy' : 'Accept') }}
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
                <p class="block-sub">Ranked by wins · Challenge a player to a private battle</p>
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
                          <button class="btn btn-outline btn-sm" [disabled]="!!activeBattle" (click)="openChallenge(p)">
                            {{ activeBattle ? 'Busy' : 'Challenge' }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
              </section>
            </aside>
          </div>
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

      @if (deleteBattleId) {
        <div class="modal-backdrop" (click)="closeDelete()"></div>
        <div class="modal card" (click)="$event.stopPropagation()">
          <h3>Delete Battle?</h3>
          <p class="block-sub">Your entry fee will be refunded to your wallet.</p>
          <div class="modal-actions">
            <button class="btn btn-outline" [disabled]="!!joiningId" (click)="closeDelete()">Go Back</button>
            <button class="btn btn-danger" [disabled]="!!joiningId" (click)="confirmDelete()">
              {{ joiningId === deleteBattleId ? 'Deleting...' : 'Yes, Delete' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .battles-page { padding-top: 4px; }

    .battles-layout {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .col-main, .col-side {
      min-width: 0;
    }

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
      height: 180px;
      border: 1.5px solid color-mix(in srgb, var(--accent) 70%, #a855f7);
      box-shadow: 0 8px 32px color-mix(in srgb, var(--accent) 25%, transparent);
    }
    .banner-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
    .banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.2) 100%);
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
    .active-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      border-color: rgba(250, 204, 21, 0.55);
      background: rgba(250, 204, 21, 0.08);
    }
    .active-banner strong {
      display: block;
      color: #facc15;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .active-banner p {
      margin: 0;
      font-size: 13px;
      color: var(--text-muted);
      max-width: 420px;
      line-height: 1.45;
    }
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
    .battle-item { margin-bottom: 14px; }
    .battle-item.live { border-color: rgba(250, 204, 21, 0.55); }
    .battle-item.live.clickable { cursor: pointer; }
    .battle-item.matched-item { border-color: rgba(96, 165, 250, 0.55); }
    .matched-dot { color: #60a5fa !important; }
    .match-timer {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #93c5fd;
      margin-top: 8px;
    }
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
    .battles-section .block-title { color: #fff; }
    .col-side .block-title { text-align: left; }
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
      background: rgba(0, 0, 0, 0.72);
      z-index: 1000;
    }
    .modal {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 1010;
      width: min(420px, calc(100vw - 32px));
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

    @media (max-width: 899px) {
      .game-banner { height: 150px; margin-bottom: 16px; }
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
      .col-side .block-title { text-align: center; }
    }

    @media (min-width: 900px) {
      .game-banner { height: 220px; }
      .banner-overlay h1 { font-size: 34px; }
      .battles-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
        gap: 24px;
        align-items: start;
      }
      .col-side {
        position: sticky;
        top: calc(var(--header-height) + 16px);
      }
    }
  `],
})
export class BattlesComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private battleService = inject(BattleService);
  private auth = inject(AuthService);
  private settingsService = inject(SettingsService);

  game: GameCard | undefined;
  gameSlug = '';
  entryFee = 100;
  previewPrize: number | null = null;
  openBattles: Battle[] = [];
  matchedBattles: Battle[] = [];
  runningBattles: Battle[] = [];
  challenges: Battle[] = [];
  leaderboard: LeaderboardPlayer[] = [];
  loadingOpen = true;
  loadingMatched = true;
  loadingRunning = true;
  loadingChallenges = true;
  loadingLeaderboard = true;
  creating = false;
  joiningId = '';
  battleMsg = '';
  battleSuccess = false;

  challengeTarget: LeaderboardPlayer | null = null;
  deleteBattleId: string | null = null;
  challengeFee = 100;
  challengePreviewPrize: number | null = null;
  challenging = false;
  challengeMsg = '';
  activeBattle: Battle | null = null;
  private serverSkewMs = 0;

  private refreshTimer?: ReturnType<typeof setInterval>;
  private tickTimer?: ReturnType<typeof setInterval>;
  /** tick counter so countdown pipes refresh */
  clockTick = 0;

  get filteredOpen() {
    return this.openBattles.filter((b) => b.gameType === this.gameSlug);
  }

  get filteredMatched() {
    return this.matchedBattles.filter((b) => b.gameType === this.gameSlug);
  }

  get filteredRunning() {
    return this.runningBattles.filter((b) => b.gameType === this.gameSlug);
  }

  get filteredChallenges() {
    return this.challenges.filter((b) => b.gameType === this.gameSlug);
  }

  get activeBattleLabel(): string {
    const s = this.activeBattle?.status;
    if (s === 'open') return 'open';
    if (s === 'matched') return 'matched';
    if (s === 'running') return 'live';
    if (s === 'pending_verification') return 'pending';
    return 'active';
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      if (this.tickTimer) clearInterval(this.tickTimer);

      this.gameSlug = params.get('gameSlug') || '';
      this.game = getGameBySlug(this.gameSlug);
      this.loadingOpen = true;
      this.loadingMatched = true;
      this.loadingRunning = true;
      this.loadingChallenges = true;
      this.loadingLeaderboard = true;

      if (this.game?.status === 'live') {
        this.loadBattles();
        this.onEntryFeeChange();
        void this.setupBattlePolling();
        this.tickTimer = setInterval(() => {
          this.clockTick++;
        }, 1000);
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
    if (this.tickTimer) clearInterval(this.tickTimer);
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
    this.battleService.getActiveBattle().subscribe({
      next: (r) => {
        this.activeBattle = r.battle || null;
      },
      error: () => {
        this.activeBattle = null;
      },
    });
    this.battleService.getOpenBattles().subscribe({
      next: (r) => {
        this.openBattles = r.battles;
        this.loadingOpen = false;
      },
      error: () => (this.loadingOpen = false),
    });
    this.battleService.getMatchedBattles().subscribe({
      next: (r) => {
        this.matchedBattles = r.battles;
        this.loadingMatched = false;
        if (r.serverTime) {
          this.serverSkewMs = new Date(r.serverTime).getTime() - Date.now();
        }
      },
      error: () => (this.loadingMatched = false),
    });
    this.battleService.getRunningBattles().subscribe({
      next: (r) => {
        this.runningBattles = r.battles;
        this.loadingRunning = false;
        if (r.serverTime) {
          this.serverSkewMs = new Date(r.serverTime).getTime() - Date.now();
        }
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

  /** Uses clockTick so Angular refreshes the label each second */
  startCountdown(b: Battle): string {
    void this.clockTick;
    if (!b.startDeadlineAt) return '—';
    const left = Math.max(0, new Date(b.startDeadlineAt).getTime() - (Date.now() + this.serverSkewMs));
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
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
    if (this.activeBattle) {
      this.battleSuccess = false;
      this.battleMsg = 'You already have an active battle. Finish or cancel it first.';
      return;
    }
    this.creating = true;
    this.battleMsg = '';
    this.battleService.createBattle(this.entryFee, this.gameSlug).subscribe({
      next: (r) => {
        this.battleSuccess = true;
        this.battleMsg = r.message || 'Battle created — waiting for an opponent';
        this.applyWallet(r);
        this.creating = false;
        this.loadBattles();
      },
      error: (e) => {
        this.battleSuccess = false;
        this.battleMsg = e.error?.message || 'Failed';
        this.creating = false;
        if (e.error?.activeBattleId) {
          this.loadBattles();
        }
      },
    });
  }

  isMine(b: Battle) {
    const me = this.auth.getUser()?.id;
    return !!me && (b.creator?.id === me || b.joiner?.id === me);
  }

  isCreator(b: Battle) {
    const me = this.auth.getUser()?.id;
    return !!me && b.creator?.id === me;
  }

  openRoom(id: string) {
    void this.router.navigate(['/battle', id]);
  }

  onLiveClick(b: Battle) {
    if (b.status === 'running' || b.status === 'pending_verification') {
      this.openRoom(b.id);
    }
  }

  askDelete(id: string) {
    this.deleteBattleId = id;
  }

  closeDelete() {
    if (this.joiningId) return;
    this.deleteBattleId = null;
  }

  confirmDelete() {
    if (!this.deleteBattleId) return;
    this.deleteOpen(this.deleteBattleId);
  }

  deleteOpen(id: string) {
    this.joiningId = id;
    this.battleService.cancelBattle(id).subscribe({
      next: (r) => {
        this.applyWallet(r);
        this.loadBattles();
        this.joiningId = '';
        this.deleteBattleId = null;
      },
      error: (e) => {
        alert(e.error?.message || 'Failed to delete');
        this.joiningId = '';
      },
    });
  }

  openChallenge(player: LeaderboardPlayer) {
    if (this.activeBattle) {
      this.battleSuccess = false;
      this.battleMsg = 'You already have an active battle. Finish or cancel it before challenging someone.';
      return;
    }
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
    if (this.activeBattle && this.activeBattle.id !== id) {
      alert('You already have an active battle. Finish or cancel it before joining another.');
      return;
    }
    this.joiningId = id;
    this.battleService.joinBattle(id).subscribe({
      next: (r) => {
        this.applyWallet(r);
        this.joiningId = '';
        void this.router.navigate(['/battle', r.battle.id]);
      },
      error: (e) => {
        alert(e.error?.message || 'Failed to join');
        this.joiningId = '';
        if (e.error?.code === 'ACTIVE_BATTLE') this.loadBattles();
      },
    });
  }
}
