import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BattleService } from '../../core/services/battle.service';
import { AuthService } from '../../core/services/auth.service';
import { Battle, BattleClaim } from '../../core/models';

type ConfirmKind = 'lost' | 'cancel' | 'delete' | null;

@Component({
  selector: 'app-battle-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="room-page">
      <button class="back-btn" [routerLink]="backLink">← Back</button>

      @if (loading) {
        <div class="spinner">Loading battle...</div>
      } @else if (error && !battle) {
        <div class="alert error">{{ error }}</div>
      } @else if (battle) {
        @if (message) {
          <div class="alert success">{{ message }}</div>
        }
        @if (error) {
          <div class="alert error">{{ error }}</div>
        }

        <div class="room-layout">
          <div class="col-primary">
            <section class="vs-card card">
              <div class="vs-meta">
                <span>PLAYING FOR ₹{{ battle.entryFee }}</span>
                <span>PRIZE POOL ₹{{ battle.winningPrize }}</span>
              </div>
              <div class="vs-row">
                <div class="player">
                  <div class="avatar">{{ initials(battle.creator?.name) }}</div>
                  <strong>{{ battle.creator?.name || 'Player' }}</strong>
                  <small>₹{{ battle.entryFee }}</small>
                </div>
                <div class="vs-badge">VS</div>
                <div class="player">
                  @if (battle.joiner) {
                    <div class="avatar joiner">{{ initials(battle.joiner.name) }}</div>
                    <strong>{{ battle.joiner.name }}</strong>
                    <small>₹{{ battle.entryFee }}</small>
                  } @else {
                    <div class="avatar empty">?</div>
                    <strong>Waiting...</strong>
                    <small>Opponent</small>
                  }
                </div>
              </div>
            </section>

            @if (battle.status === 'open' || (battle.status === 'matched' && !isCreator)) {
              <section class="wait-block card">
                <div class="hourglass">⏳</div>
                <h2>{{ battle.status === 'open' ? 'WAITING FOR OPPONENT' : 'WAITING FOR START' }}</h2>
                <div class="timer">{{ timerLabel }}</div>
                <p class="muted">
                  {{ battle.status === 'open'
                    ? 'Estimated wait'
                    : 'Creator must start and share room code before timer ends or fees are refunded' }}
                </p>
              </section>
            }

            @if (battle.status === 'matched' && isCreator) {
              <section class="start-card card">
                <h2>Start Battle</h2>
                <p class="muted">Create a room in Ludo King, then enter the room code below</p>
                <div class="timer center-timer">{{ timerLabel }}</div>
                <p class="muted">Start before timer ends or both entry fees are refunded</p>
                <div class="field">
                  <label>Ludo King Room Code</label>
                  <input [(ngModel)]="roomCode" maxlength="20" placeholder="Enter room code" />
                </div>
                <button class="btn-start" [disabled]="busy || roomCode.trim().length < 4" (click)="start()">
                  {{ busy ? 'Starting...' : 'START' }}
                </button>
              </section>
            }

            @if (battle.roomCode && (battle.status === 'running' || battle.status === 'pending_verification')) {
              <section class="room-code-card card">
                <small>LUDO KING ROOM CODE</small>
                <strong>{{ battle.roomCode }}</strong>
                <button type="button" class="copy-btn" (click)="copyCode()">Copy</button>
              </section>
            }

            <section class="ludo-card card">
              <div class="ludo-copy">
                <h3>Play game in <span>Ludo King App</span></h3>
                <a
                  class="download-btn"
                  href="https://play.google.com/store/apps/details?id=com.ludo.king"
                  target="_blank"
                  rel="noopener"
                >
                  DOWNLOAD NOW
                </a>
              </div>
              <div class="ludo-art">🎲</div>
            </section>

            @if ((battle.status === 'running' || battle.status === 'pending_verification') && myResult) {
              <section class="pending card result-card" [class.conflict]="battle.resultConflict">
                <h3>You reported: {{ myResult | uppercase }}</h3>
                <p>{{ resultStatusText }}</p>
                @if (battle.conflictNote) {
                  <p class="conflict-note">{{ battle.conflictNote }}</p>
                }
                @if (myResult === 'won') {
                  <img
                    [src]="(isCreator ? battle.creatorClaim?.screenshotUrl : battle.joinerClaim?.screenshotUrl) || battle.resultScreenshotUrl"
                    alt="Result screenshot"
                    class="proof"
                  />
                }
              </section>
            }

            @if (battle.status === 'cancelled') {
              <section class="pending card">
                <h3>Battle Cancelled</h3>
                <p>{{ battle.cancelReason || 'Entry fees have been refunded to wallets.' }}</p>
                <button class="btn-ghost block-btn" [routerLink]="backLink">Back to battles</button>
              </section>
            }

            @if (battle.status === 'completed') {
              <section class="pending card success-box">
                <h3>✅ Battle Completed</h3>
                <p>Winner: {{ battle.winner && $any(battle.winner).name ? $any(battle.winner).name : '—' }}</p>
                <button class="btn-ghost block-btn" [routerLink]="backLink">Back to battles</button>
              </section>
            }

            @if (battle.status === 'open' && isCreator) {
              <button class="btn-cancel block" [disabled]="busy" (click)="openConfirm('delete')">Delete Battle</button>
            }
          </div>

          <aside class="col-side">
            @if (battle.status === 'running' || (battle.status === 'pending_verification' && !myResult)) {
              <section class="rules card">
                <h3>GAME RULES</h3>
                <ul>
                  <li>📹 Record every game</li>
                  <li>📸 Screenshot proof required to claim win</li>
                  <li>⚠️ Both claiming win = admin decides</li>
                  <li>✅ Admin verifies before payout</li>
                </ul>
              </section>

              @if (!(myResult && (battle.status === 'running' || battle.status === 'pending_verification'))) {
                <section class="status-actions card">
                  <h3>UPDATE GAME STATUS</h3>
                  @if (battle.status === 'pending_verification') {
                    <p class="muted">Opponent already submitted — enter your result</p>
                  }
                  <button class="btn-won" [disabled]="busy" (click)="openWon()">I WON</button>
                  <button class="btn-lost" [disabled]="busy" (click)="openConfirm('lost')">I LOST</button>
                  <button class="btn-cancel" [disabled]="busy" (click)="openConfirm('cancel')">CANCEL</button>
                </section>
              }
            } @else {
              <section class="rules card side-help">
                <h3>GAME RULES</h3>
                <ul>
                  <li>📹 Record every game</li>
                  <li>📸 Screenshot proof required to claim win</li>
                  <li>⚠️ Both claiming win = admin decides</li>
                  <li>✅ Admin verifies before payout</li>
                </ul>
              </section>
            }
          </aside>
        </div>
      }

      @if (showWonModal) {
        <div class="modal-backdrop" (click)="closeWon()"></div>
        <div class="modal card" (click)="$event.stopPropagation()">
          <h3>CONFIRM WIN</h3>
          <p>Upload Ludo King result screenshot for verification.</p>
          <input type="file" accept="image/*" (change)="onFile($event)" />
          @if (screenshotPreview) {
            <img [src]="screenshotPreview" class="proof" alt="Preview" />
          }
          @if (error) {
            <div class="alert error">{{ error }}</div>
          }
          <div class="modal-actions">
            <button class="btn-won" [disabled]="busy || !screenshotFile" (click)="submitWon()">
              {{ busy ? 'Uploading...' : 'YES, I WON' }}
            </button>
            <button class="btn-ghost" [disabled]="busy" (click)="closeWon()">CANCEL</button>
          </div>
        </div>
      }

      @if (confirmKind) {
        <div class="modal-backdrop" (click)="closeConfirm()"></div>
        <div class="modal card" (click)="$event.stopPropagation()">
          <div class="q-icon">?</div>
          <h3 class="grad-title">{{ confirmTitle }}</h3>
          <p>{{ confirmBody }}</p>
          @if (error) {
            <div class="alert error">{{ error }}</div>
          }
          <div class="modal-actions">
            <button
              class="btn-confirm"
              [class.danger]="confirmKind === 'lost' || confirmKind === 'delete' || confirmKind === 'cancel'"
              [disabled]="busy"
              (click)="submitConfirm()"
            >
              {{ busy ? 'Please wait...' : confirmOkLabel }}
            </button>
            <button class="btn-ghost" [disabled]="busy" (click)="closeConfirm()">GO BACK</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .room-page { padding: 4px 0 28px; width: 100%; }
    .back-btn {
      all: unset; cursor: pointer; color: var(--text-muted); font-weight: 600; margin-bottom: 16px; display: inline-block;
    }
    .back-btn:hover { color: var(--primary-light); }

    .room-layout {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .col-primary, .col-side { min-width: 0; }

    .vs-card { margin-bottom: 0; border: 1px solid rgba(167,139,250,0.45); }
    .vs-meta {
      display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      font-size: 13px; color: #facc15; margin-bottom: 18px; font-weight: 700;
    }
    .vs-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .player { flex: 1; text-align: center; }
    .avatar {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 10px;
      background: linear-gradient(135deg,#7c3aed,#2563eb); display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 22px; border: 2px solid rgba(250,204,21,0.5);
    }
    .avatar.joiner { background: linear-gradient(135deg,#db2777,#7c3aed); }
    .avatar.empty { background: #1e293b; border-style: dashed; color: var(--text-muted); }
    .player strong { display: block; font-size: 15px; }
    .player small { color: var(--text-muted); }
    .vs-badge {
      width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg,#a855f7,#ec4899);
      display: flex; align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0; font-size: 16px;
    }
    .wait-block { text-align: center; padding: 32px 16px; }
    .hourglass { font-size: 36px; margin-bottom: 8px; }
    .wait-block h2 { font-size: 16px; letter-spacing: 0.06em; margin-bottom: 10px; }
    .timer { font-size: 42px; font-weight: 800; color: #c4b5fd; }
    .center-timer { text-align: center; margin: 10px 0 4px; font-size: 36px; }
    .muted { color: var(--text-muted); font-size: 13px; margin-top: 6px; }
    .block-btn { width: 100%; margin-top: 12px; }
    .start-card, .room-code-card, .ludo-card, .pending, .rules, .status-actions { margin-bottom: 0; }
    .result-card { border-color: rgba(244, 63, 94, 0.45); }
    .result-card.conflict { border-color: rgba(249, 115, 22, 0.7); }
    .conflict-note {
      margin-top: 8px; padding: 10px; border-radius: 10px;
      background: rgba(249, 115, 22, 0.12); color: #fdba74; font-size: 13px; font-weight: 600;
    }
    .start-card h2 { margin-bottom: 6px; }
    .field { margin: 14px 0; }
    .field label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; font-weight: 700; }
    .field input {
      width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--border);
      background: var(--bg-input); color: #fff; font-size: 16px; font-weight: 700;
    }
    .btn-start, .btn-won, .btn-lost, .btn-cancel, .btn-confirm {
      width: 100%; border: none; border-radius: 14px; padding: 14px; font-weight: 800; font-size: 15px; cursor: pointer; margin-top: 8px;
    }
    .btn-start, .btn-won { background: linear-gradient(90deg,#10b981,#14b8a6); color: #fff; }
    .btn-lost, .btn-confirm.danger { background: linear-gradient(90deg,#9f1239,#be123c); color: #fff; }
    .btn-cancel { background: linear-gradient(90deg,#6d28d9,#7c3aed); color: #fff; }
    .btn-cancel.block { margin-top: 12px; }
    .btn-confirm { background: linear-gradient(90deg,#10b981,#14b8a6); color: #fff; flex: 1; margin-top: 0; }
    .btn-ghost {
      flex: 1; border: 1px solid var(--border); background: transparent; color: #fff; border-radius: 14px; padding: 12px; font-weight: 700; cursor: pointer;
    }
    .room-code-card { text-align: center; padding: 22px; }
    .room-code-card small { color: var(--text-muted); letter-spacing: 0.08em; }
    .room-code-card strong { display: block; font-size: 32px; margin: 10px 0; letter-spacing: 0.12em; color: #facc15; word-break: break-all; }
    .copy-btn {
      border: 1px solid var(--border); background: transparent; color: #fff; border-radius: 999px; padding: 8px 16px; cursor: pointer; font-weight: 700;
    }
    .ludo-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-color: rgba(167,139,250,0.5); }
    .ludo-copy h3 { font-size: 18px; margin-bottom: 12px; }
    .ludo-copy span { color: #facc15; }
    .download-btn {
      display: inline-block; background: #7c3aed; color: #fff; padding: 12px 18px; border-radius: 10px; font-weight: 700; font-size: 13px;
    }
    .ludo-art { font-size: 56px; }
    .rules h3, .status-actions h3 { font-size: 13px; margin-bottom: 12px; letter-spacing: 0.04em; }
    .rules ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: var(--text-muted); }
    .col-side { display: flex; flex-direction: column; gap: 16px; }
    .pending h3 { margin-bottom: 8px; }
    .proof { width: 100%; max-height: 280px; object-fit: contain; border-radius: 12px; margin-top: 10px; background: #000; }
    .success-box { border-color: rgba(16,185,129,0.4); }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.72); z-index: 1000;
    }
    .modal {
      position: fixed; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 1010;
      width: min(420px, calc(100vw - 28px)); padding: 22px; text-align: center;
      border: 1px solid rgba(236,72,153,0.5);
    }
    .q-icon {
      width: 48px; height: 48px; margin: 0 auto 10px; border-radius: 50%;
      background: rgba(124,58,237,0.3); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800;
    }
    .grad-title {
      background: linear-gradient(90deg,#fb923c,#ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      margin-bottom: 10px;
    }
    .modal-actions { display: flex; gap: 10px; margin-top: 16px; }
    .modal-actions .btn-won { flex: 1; margin-top: 0; }
    .alert { margin-bottom: 12px; }

    @media (min-width: 900px) {
      .room-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.85fr);
        gap: 24px;
        align-items: start;
      }
      .col-side {
        position: sticky;
        top: calc(var(--header-height) + 16px);
      }
      .vs-card { padding: 24px; }
      .avatar { width: 88px; height: 88px; font-size: 28px; }
      .player strong { font-size: 17px; }
      .vs-badge { width: 64px; height: 64px; font-size: 18px; }
      .room-code-card strong { font-size: 36px; }
      .ludo-card { padding: 22px 24px; }
    }
  `],
})
export class BattleRoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(BattleService);
  private auth = inject(AuthService);

  battle: Battle | null = null;
  loading = true;
  busy = false;
  error = '';
  message = '';
  roomCode = '';
  timerLabel = '4:00';
  showWonModal = false;
  confirmKind: ConfirmKind = null;
  screenshotFile: File | null = null;
  screenshotPreview = '';
  backLink = '/home';

  private poll?: ReturnType<typeof setInterval>;
  private tick?: ReturnType<typeof setInterval>;
  private startedMs = Date.now();
  private timeoutCancelRequested = false;
  private battleId = '';
  /** serverTime - localTime when last synced — keeps both users on the same countdown */
  private serverSkewMs = 0;

  get isCreator() {
    const me = this.auth.getUser()?.id;
    return !!me && this.battle?.creator?.id === me;
  }

  get isJoiner() {
    const me = this.auth.getUser()?.id;
    return !!me && this.battle?.joiner?.id === me;
  }

  get myClaim(): BattleClaim | null {
    if (!this.battle) return null;
    if (this.isCreator) return this.battle.creatorClaim || null;
    if (this.isJoiner) return this.battle.joinerClaim || null;
    return null;
  }

  get myResult(): string | null {
    return this.myClaim?.result || null;
  }

  get resultStatusText(): string {
    if (!this.battle) return '';
    if (this.battle.status === 'cancelled') {
      return this.battle.cancelReason || 'Battle cancelled.';
    }
    if (this.battle.resultConflict) {
      return 'Results conflict — waiting for admin decision.';
    }
    if (this.battle.conflictType === 'agreed_win_loss') {
      return 'Both results recorded. Waiting for admin to verify and pay.';
    }
    if (this.battle.status === 'pending_verification') {
      return 'Submitted for admin verification. Opponent can still submit if they have not.';
    }
    return 'Your result is saved. Waiting for opponent to submit theirs.';
  }

  get confirmTitle(): string {
    if (this.confirmKind === 'lost') return 'CONFIRM RESULT';
    if (this.confirmKind === 'delete') return 'DELETE BATTLE';
    return 'REQUEST CANCEL';
  }

  get confirmBody(): string {
    if (this.confirmKind === 'lost') {
      return 'Are you sure you lost this match? This cannot be undone.';
    }
    if (this.confirmKind === 'delete') {
      return 'Delete this open battle? Your entry fee will be refunded to your wallet.';
    }
    return 'Request to cancel this match? If the opponent also cancels (or reports loss), fees are refunded. If they claimed a win, admin will decide.';
  }

  get confirmOkLabel(): string {
    if (this.confirmKind === 'lost') return 'YES, I LOST';
    if (this.confirmKind === 'delete') return 'YES, DELETE';
    return 'YES, CANCEL';
  }

  ngOnInit() {
    this.route.paramMap.subscribe((p) => {
      this.battleId = p.get('id') || '';
      this.timeoutCancelRequested = false;
      this.load(this.battleId);
      if (this.poll) clearInterval(this.poll);
      this.poll = setInterval(() => this.load(this.battleId, true), 3000);
    });
    this.tick = setInterval(() => this.updateTimer(), 1000);
  }

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
    if (this.tick) clearInterval(this.tick);
  }

  initials(name?: string | null) {
    const n = (name || 'P').trim();
    return n.slice(0, 1).toUpperCase();
  }

  private applyWallet(r: { balance?: number; bonusBalance?: number; totalBalance?: number }) {
    const u = this.auth.getUser();
    if (!u) return;
    if (typeof r.balance === 'number') u.balance = r.balance;
    if (typeof r.bonusBalance === 'number') u.bonusBalance = r.bonusBalance;
    if (typeof r.totalBalance === 'number') u.totalBalance = r.totalBalance;
    this.auth.updateUser(u);
  }

  private nowMs() {
    return Date.now() + this.serverSkewMs;
  }

  private syncServerTime(serverTime?: string) {
    if (!serverTime) return;
    this.serverSkewMs = new Date(serverTime).getTime() - Date.now();
  }

  private updateTimer() {
    if (!this.battle || this.battle.status !== 'matched') {
      if (this.battle?.status === 'open') {
        const start = this.battle.createdAt ? new Date(this.battle.createdAt).getTime() : this.startedMs;
        const left = Math.max(0, 4 * 60 * 1000 - (this.nowMs() - start));
        const m = Math.floor(left / 60000);
        const s = Math.floor((left % 60000) / 1000);
        this.timerLabel = `${m}:${String(s).padStart(2, '0')}`;
      }
      return;
    }

    const deadline = this.battle.startDeadlineAt
      ? new Date(this.battle.startDeadlineAt).getTime()
      : (this.battle.matchedAt ? new Date(this.battle.matchedAt).getTime() : this.startedMs) + 4 * 60 * 1000;
    const left = Math.max(0, deadline - this.nowMs());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    this.timerLabel = `${m}:${String(s).padStart(2, '0')}`;

    if (left === 0) {
      this.expireUnstartedBattle();
    }
  }

  private expireUnstartedBattle() {
    if (!this.battle || this.battle.status !== 'matched' || this.timeoutCancelRequested || this.busy) {
      return;
    }
    this.timeoutCancelRequested = true;
    this.busy = true;
    this.api.cancelBattle(this.battle.id, 'Not started in time').subscribe({
      next: (r) => {
        this.applyBattle(r.battle);
        this.applyWallet(r);
        this.message = r.message || 'Battle cancelled — entry fees refunded';
        this.busy = false;
      },
      error: () => {
        this.load(this.battleId, true);
        this.busy = false;
      },
    });
  }

  private applyBattle(battle: Battle) {
    this.battle = { ...battle };
  }

  load(id: string, silent = false) {
    if (!id) return;
    if (!silent) this.loading = true;
    this.api.getBattle(id).subscribe({
      next: (r) => {
        this.syncServerTime(r.serverTime);
        this.applyBattle(r.battle);
        this.backLink = `/battles/${r.battle.gameType || 'ludo-classic'}`;
        this.loading = false;
        this.updateTimer();
        if (r.battle.status === 'cancelled' && r.battle.cancelReason) {
          this.message = r.battle.cancelReason;
        }
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to load battle';
        this.loading = false;
      },
    });
  }

  start() {
    if (!this.battle) return;
    this.busy = true;
    this.error = '';
    this.api.startBattle(this.battle.id, this.roomCode.trim()).subscribe({
      next: (r) => {
        this.applyBattle(r.battle);
        this.message = r.message;
        this.busy = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to start';
        this.busy = false;
      },
    });
  }

  copyCode() {
    if (!this.battle?.roomCode) return;
    void navigator.clipboard?.writeText(this.battle.roomCode);
    this.message = 'Room code copied';
  }

  openWon() {
    this.error = '';
    this.screenshotFile = null;
    this.screenshotPreview = '';
    this.confirmKind = null;
    this.showWonModal = true;
  }

  closeWon() {
    if (this.busy) return;
    this.showWonModal = false;
  }

  openConfirm(kind: Exclude<ConfirmKind, null>) {
    this.error = '';
    this.showWonModal = false;
    this.confirmKind = kind;
  }

  closeConfirm() {
    if (this.busy) return;
    this.confirmKind = null;
  }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.screenshotFile = file;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => (this.screenshotPreview = String(reader.result || ''));
      reader.readAsDataURL(file);
    } else {
      this.screenshotPreview = '';
    }
  }

  submitWon() {
    if (!this.battle || !this.screenshotFile) return;
    this.busy = true;
    this.error = '';
    this.api.reportResult(this.battle.id, 'won', this.screenshotFile).subscribe({
      next: (r) => {
        this.applyBattle(r.battle);
        this.message = r.message;
        this.applyWallet(r);
        this.showWonModal = false;
        this.busy = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to submit';
        this.busy = false;
      },
    });
  }

  submitConfirm() {
    if (!this.battle || !this.confirmKind) return;
    if (this.confirmKind === 'lost') {
      this.submitLost();
      return;
    }
    if (this.confirmKind === 'delete') {
      this.submitCancel('Deleted by creator');
      return;
    }
    // Running battle cancel = result claim (handles both-cancel / win-vs-cancel)
    this.submitResultCancel();
  }

  private submitLost() {
    if (!this.battle) return;
    this.busy = true;
    this.error = '';
    this.api.reportResult(this.battle.id, 'lost').subscribe({
      next: (r) => {
        this.applyBattle(r.battle);
        this.message = r.message || 'Loss recorded';
        this.applyWallet(r);
        this.confirmKind = null;
        this.busy = false;
        if (r.battle.status === 'cancelled') {
          void this.router.navigateByUrl(this.backLink);
        }
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to submit loss';
        this.busy = false;
      },
    });
  }

  private submitResultCancel() {
    if (!this.battle) return;
    this.busy = true;
    this.error = '';
    this.api.reportResult(this.battle.id, 'cancel').subscribe({
      next: (r) => {
        this.applyBattle(r.battle);
        this.message = r.message || 'Cancel request recorded';
        this.applyWallet(r);
        this.confirmKind = null;
        this.busy = false;
        if (r.battle.status === 'cancelled') {
          void this.router.navigateByUrl(this.backLink);
        }
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to request cancel';
        this.busy = false;
      },
    });
  }

  private submitCancel(reason: string) {
    if (!this.battle) return;
    this.busy = true;
    this.error = '';
    this.api.cancelBattle(this.battle.id, reason).subscribe({
      next: (r) => {
        this.applyWallet(r);
        this.confirmKind = null;
        this.busy = false;
        void this.router.navigateByUrl(this.backLink);
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to cancel';
        this.busy = false;
      },
    });
  }
}
