import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BattleService } from '../../core/services/battle.service';
import { AuthService } from '../../core/services/auth.service';
import { Battle } from '../../core/models';
import { getGameBySlug } from '../../core/constants/games';

@Component({
  selector: 'app-battle-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page history-page">
      <div class="head">
        <h2>Battle History</h2>
        <p>Your created, joined, and completed battles</p>
      </div>

      <div class="filters">
        <button type="button" [class.active]="filter === 'all'" (click)="setFilter('all')">All</button>
        <button type="button" [class.active]="filter === 'open'" (click)="setFilter('open')">Open</button>
        <button type="button" [class.active]="filter === 'running'" (click)="setFilter('running')">Live</button>
        <button type="button" [class.active]="filter === 'completed'" (click)="setFilter('completed')">Completed</button>
        <button type="button" [class.active]="filter === 'cancelled'" (click)="setFilter('cancelled')">Cancelled</button>
      </div>

      @if (loading) {
        <p class="empty">Loading battles...</p>
      } @else if (!filtered.length) {
        <div class="empty-card">
          <p>No battles found</p>
          <a routerLink="/home" class="play-link">Play Ludo Classic →</a>
        </div>
      } @else {
        @for (b of filtered; track b.id) {
          <div class="battle-card" [attr.data-status]="b.status">
            <div class="row top">
              <span class="game">{{ gameName(b.gameType) }}</span>
              <span class="status" [ngClass]="b.status">{{ b.status }}</span>
            </div>

            <div class="row players">
              <div>
                <small>You vs</small>
                <strong>{{ opponentName(b) }}</strong>
              </div>
              <div class="right">
                <small>Entry</small>
                <strong>₹{{ b.entryFee }}</strong>
              </div>
            </div>

            <div class="row meta">
              <span>Prize ₹{{ b.winningPrize }}</span>
              <span>{{ b.createdAt | date:'medium' }}</span>
            </div>

            @if (b.status === 'completed') {
              <div class="result" [class.win]="isWinner(b)" [class.loss]="!isWinner(b) && !!b.winner">
                {{ isWinner(b) ? 'You Won 🎉' : 'You Lost' }}
                @if (winnerLabel(b); as w) {
                  <small>Winner: {{ w }}</small>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .history-page { padding-top: 4px; }

    .head h2 {
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
    }
    .head p {
      color: #94a3b8;
      font-size: 13px;
      margin-bottom: 14px;
    }

    .filters {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
      margin-bottom: 14px;
    }
    .filters button {
      flex-shrink: 0;
      border: 1px solid rgba(34, 211, 238, 0.3);
      background: rgba(255,255,255,0.04);
      color: #cbd5e1;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }
    .filters button.active {
      background: rgba(34, 211, 238, 0.18);
      color: #67e8f9;
      border-color: #22d3ee;
    }

    .empty, .empty-card {
      color: #94a3b8;
      text-align: center;
      padding: 28px 12px;
    }
    .empty-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(168,85,247,0.25);
      border-radius: 14px;
    }
    .play-link {
      display: inline-block;
      margin-top: 10px;
      color: #67e8f9;
      font-weight: 700;
      text-decoration: none;
    }

    .battle-card {
      background: #12081f;
      border: 1px solid rgba(34, 211, 238, 0.25);
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 10px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
    }
    .row.top { margin-bottom: 10px; }
    .game { font-weight: 800; color: #f8fafc; font-size: 14px; }
    .status {
      text-transform: capitalize;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 999px;
    }
    .status.open { background: rgba(56,189,248,0.15); color: #7dd3fc; }
    .status.running { background: rgba(250,204,21,0.15); color: #facc15; }
    .status.completed { background: rgba(34,197,94,0.15); color: #4ade80; }
    .status.cancelled { background: rgba(239,68,68,0.15); color: #f87171; }

    .players { margin-bottom: 8px; }
    .players small { display: block; color: #94a3b8; font-size: 11px; margin-bottom: 2px; }
    .players strong { color: #fff; font-size: 15px; }
    .players .right { text-align: right; }

    .meta {
      color: #94a3b8;
      font-size: 12px;
      margin-bottom: 6px;
    }

    .result {
      margin-top: 8px;
      padding: 10px 12px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      background: rgba(148,163,184,0.12);
      color: #e2e8f0;
    }
    .result.win { background: rgba(34,197,94,0.15); color: #86efac; }
    .result.loss { background: rgba(239,68,68,0.12); color: #fda4af; }
    .result small { display: block; font-weight: 600; opacity: 0.85; margin-top: 2px; }
  `],
})
export class BattleHistoryComponent implements OnInit {
  private battleService = inject(BattleService);
  private auth = inject(AuthService);

  battles: Battle[] = [];
  filter: 'all' | 'open' | 'running' | 'completed' | 'cancelled' = 'all';
  loading = true;
  private myId = '';

  get filtered(): Battle[] {
    if (this.filter === 'all') return this.battles;
    return this.battles.filter((b) => b.status === this.filter);
  }

  ngOnInit() {
    this.myId = String(this.auth.getUser()?.id || '');
    this.battleService.getMyBattles().subscribe({
      next: (r) => {
        this.battles = r.battles || [];
        this.loading = false;
      },
      error: () => {
        this.battles = [];
        this.loading = false;
      },
    });
  }

  setFilter(filter: typeof this.filter) {
    this.filter = filter;
  }

  gameName(slug: string) {
    return getGameBySlug(slug)?.name || slug;
  }

  opponentName(b: Battle): string {
    const creatorId = String(b.creator?.id || '');
    const joinerId = String(b.joiner?.id || '');
    if (creatorId === this.myId) {
      return b.joiner?.name || b.joiner?.mobile || 'Waiting...';
    }
    if (joinerId === this.myId) {
      return b.creator?.name || b.creator?.mobile || 'Opponent';
    }
    return b.joiner?.name || b.creator?.name || 'Opponent';
  }

  winnerId(b: Battle): string {
    if (!b.winner) return '';
    if (typeof b.winner === 'string') return String(b.winner);
    return String(b.winner.id || '');
  }

  isWinner(b: Battle): boolean {
    const wid = this.winnerId(b);
    return !!wid && wid === this.myId;
  }

  winnerLabel(b: Battle): string {
    if (!b.winner) return '';
    if (typeof b.winner === 'string') return b.winner;
    return b.winner.name || b.winner.mobile || '';
  }
}
