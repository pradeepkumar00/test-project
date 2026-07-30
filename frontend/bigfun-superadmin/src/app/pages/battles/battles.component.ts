import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Battle, Pagination } from '../../core/models';

@Component({
  selector: 'app-battles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Battles</h1>
      <p class="page-sub">Win claims with screenshots appear under Pending verification</p>
    </div>

    <div class="filters">
      <select [(ngModel)]="statusFilter" (change)="load(1)">
        <option value="">All</option>
        <option value="open">Open</option>
        <option value="matched">Matched</option>
        <option value="running">Running</option>
        <option value="pending_verification">Pending verification</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    @if (loading) { <div class="spinner">Loading...</div> }
    @else if (!battles.length) { <div class="empty">No battles found</div> }
    @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Game</th>
              <th>Entry / Prize</th>
              <th>Creator</th>
              <th>Joiner</th>
              <th>Winner</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (b of battles; track b.id) {
              <tr>
                <td>{{ b.gameType }}</td>
                <td>₹{{ b.entryFee }} / ₹{{ b.winningPrize }}</td>
                <td>{{ b.creator.name }}<br /><small>{{ b.creator.mobile }}</small></td>
                <td>
                  @if (b.joiner) {
                    {{ b.joiner.name }}<br /><small>{{ b.joiner.mobile }}</small>
                  } @else { — }
                </td>
                <td>
                  @if (b.winner) {
                    {{ b.winner.name }}<br /><small>{{ b.winner.mobile }}</small>
                  } @else if (b.claimedWinner) {
                    <span class="muted">Claimed: {{ b.claimedWinner.name }}</span>
                  } @else { — }
                </td>
                <td><span class="badge badge-{{ b.status }}">{{ b.status }}</span></td>
                <td>{{ b.createdAt | date:'short' }}</td>
                <td>
                  @if (canManage) {
                    <div class="actions">
                      @if (b.status === 'pending_verification') {
                        <button class="btn btn-success btn-sm" (click)="openVerify(b)">Verify</button>
                      }
                      @if (b.status === 'open' || b.status === 'matched' || b.status === 'running' || b.status === 'pending_verification') {
                        <button class="btn btn-danger btn-sm" (click)="cancel(b.id)">Cancel</button>
                        @if ((b.status === 'running' || b.status === 'matched') && b.joiner) {
                          <button class="btn btn-success btn-sm" (click)="openComplete(b)">Complete</button>
                        }
                      }
                      @if (b.status === 'cancelled' || b.status === 'completed') {
                        <button class="btn btn-outline btn-sm" (click)="deleteBattle(b.id)">Delete</button>
                      }
                    </div>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (pagination) {
        <div class="pagination">
          <button class="btn btn-outline btn-sm" [disabled]="pagination.page <= 1" (click)="load(pagination.page - 1)">Prev</button>
          <span>Page {{ pagination.page }} / {{ pagination.pages }}</span>
          <button class="btn btn-outline btn-sm" [disabled]="pagination.page >= pagination.pages" (click)="load(pagination.page + 1)">Next</button>
        </div>
      }
    }

    @if (verifyBattle) {
      <div class="modal-backdrop" (click)="verifyBattle = null">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:560px">
          <h3>Verify Battle Result</h3>
          @if (verifyBattle.resultConflict) {
            <div class="conflict-banner">⚠️ CONFLICT — {{ verifyBattle.conflictNote || 'Players disagree. Review carefully.' }}</div>
          } @else if (verifyBattle.conflictNote) {
            <p class="muted">{{ verifyBattle.conflictNote }}</p>
          }
          <p>Claimed winner: {{ verifyBattle.claimedWinner?.name || (verifyBattle.resultConflict ? 'Select below' : '—') }}</p>
          <p>
            <small>
              Creator: <strong>{{ verifyBattle.creatorClaim?.result || '—' }}</strong>
              · Joiner: <strong>{{ verifyBattle.joinerClaim?.result || '—' }}</strong>
            </small>
          </p>
          @if (verifyBattle.roomCode) {
            <p><small>Room code: {{ verifyBattle.roomCode }}</small></p>
          }
          <div class="shots-row">
            @if (verifyBattle.creatorClaim?.screenshotUrl) {
              <div class="shot-wrap">
                <label>Creator screenshot</label>
                <a [href]="verifyBattle.creatorClaim?.screenshotUrl" target="_blank" rel="noopener">
                  <img [src]="verifyBattle.creatorClaim?.screenshotUrl" alt="Creator screenshot" />
                </a>
              </div>
            }
            @if (verifyBattle.joinerClaim?.screenshotUrl) {
              <div class="shot-wrap">
                <label>Joiner screenshot</label>
                <a [href]="verifyBattle.joinerClaim?.screenshotUrl" target="_blank" rel="noopener">
                  <img [src]="verifyBattle.joinerClaim?.screenshotUrl" alt="Joiner screenshot" />
                </a>
              </div>
            }
            @if (!verifyBattle.creatorClaim?.screenshotUrl && !verifyBattle.joinerClaim?.screenshotUrl && verifyBattle.resultScreenshotUrl) {
              <div class="shot-wrap">
                <label>Screenshot</label>
                <a [href]="verifyBattle.resultScreenshotUrl" target="_blank" rel="noopener">
                  <img [src]="verifyBattle.resultScreenshotUrl" alt="Battle result screenshot" />
                </a>
              </div>
            }
            @if (!verifyBattle.creatorClaim?.screenshotUrl && !verifyBattle.joinerClaim?.screenshotUrl && !verifyBattle.resultScreenshotUrl) {
              <p class="muted">No screenshot uploaded</p>
            }
          </div>
          <div class="form-group">
            <label>Winner to credit {{ verifyBattle.conflictType === 'both_won' ? '(required)' : '' }}</label>
            <select [(ngModel)]="winnerId">
              <option [value]="verifyBattle.creator.id">{{ verifyBattle.creator.name }} (Creator)</option>
              @if (verifyBattle.joiner) {
                <option [value]="verifyBattle.joiner.id">{{ verifyBattle.joiner.name }} (Joiner)</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Reject reason (if rejecting)</label>
            <input [(ngModel)]="rejectReason" placeholder="Optional reason" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="verifyBattle = null">Close</button>
            <button class="btn btn-danger" (click)="rejectVerify()">Reject</button>
            @if (verifyBattle.conflictType === 'win_vs_cancel' || verifyBattle.conflictType === 'both_won') {
              <button class="btn btn-outline" (click)="refundConflict()">Refund Both</button>
            }
            <button class="btn btn-success" (click)="approveVerify()">Approve & Pay</button>
          </div>
        </div>
      </div>
    }

    @if (completeBattle) {
      <div class="modal-backdrop" (click)="completeBattle = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Force Complete Battle</h3>
          <div class="form-group">
            <label>Winner</label>
            <select [(ngModel)]="winnerId">
              <option [value]="completeBattle.creator.id">{{ completeBattle.creator.name }} (Creator)</option>
              @if (completeBattle.joiner) {
                <option [value]="completeBattle.joiner.id">{{ completeBattle.joiner.name }} (Joiner)</option>
              }
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="completeBattle = null">Cancel</button>
            <button class="btn btn-success" (click)="complete()">Complete</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class BattlesComponent implements OnInit {
  private api = inject(AdminApiService);
  private auth = inject(AuthService);
  battles: Battle[] = [];
  pagination: Pagination | null = null;
  loading = true;
  statusFilter = 'pending_verification';
  completeBattle: Battle | null = null;
  verifyBattle: Battle | null = null;
  winnerId = '';
  rejectReason = '';
  canManage = this.auth.hasPermission('battles.manage');

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.api.getBattles(page, this.statusFilter).subscribe({
      next: (res) => {
        this.battles = res.battles;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  cancel(id: string) {
    if (!confirm('Cancel battle and refund entry fees?')) return;
    this.api.cancelBattle(id, 'Cancelled by admin').subscribe({ next: () => this.load(this.pagination?.page || 1) });
  }

  openComplete(b: Battle) {
    this.completeBattle = b;
    this.winnerId = b.creator.id;
  }

  openVerify(b: Battle) {
    this.verifyBattle = b;
    this.winnerId = b.claimedWinner?.id || (b.conflictType === 'both_won' ? '' : b.creator.id);
    this.rejectReason = '';
  }

  approveVerify() {
    if (!this.verifyBattle) return;
    if (!this.winnerId) {
      alert('Select a winner to credit');
      return;
    }
    this.api.verifyBattle(this.verifyBattle.id, true, this.winnerId).subscribe({
      next: () => {
        this.verifyBattle = null;
        this.load(this.pagination?.page || 1);
      },
      error: (e) => alert(e.error?.message || 'Verify failed'),
    });
  }

  rejectVerify() {
    if (!this.verifyBattle) return;
    this.api.verifyBattle(this.verifyBattle.id, false, undefined, this.rejectReason).subscribe({
      next: () => {
        this.verifyBattle = null;
        this.load(this.pagination?.page || 1);
      },
      error: (e) => alert(e.error?.message || 'Reject failed'),
    });
  }

  refundConflict() {
    if (!this.verifyBattle) return;
    if (!confirm('Cancel this battle and refund both players?')) return;
    const id = this.verifyBattle.id;
    this.api.cancelBattle(id, 'Admin refunded due to result conflict').subscribe({
      next: () => {
        this.verifyBattle = null;
        this.load(this.pagination?.page || 1);
      },
      error: (e) => alert(e.error?.message || 'Refund failed'),
    });
  }

  complete() {
    if (!this.completeBattle) return;
    this.api.completeBattle(this.completeBattle.id, this.winnerId).subscribe({
      next: () => {
        this.completeBattle = null;
        this.load(this.pagination?.page || 1);
      },
    });
  }

  deleteBattle(id: string) {
    if (!confirm('Delete this battle record?')) return;
    this.api.deleteBattle(id).subscribe({ next: () => this.load(this.pagination?.page || 1) });
  }
}
