import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import { Battle, Pagination } from '../../core/models';

@Component({
  selector: 'app-battles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Battles</h1>
    </div>

    <div class="filters">
      <select [(ngModel)]="statusFilter" (change)="load(1)">
        <option value="">All</option>
        <option value="open">Open</option>
        <option value="running">Running</option>
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
                <td><span class="badge badge-{{ b.status }}">{{ b.status }}</span></td>
                <td>{{ b.createdAt | date:'short' }}</td>
                <td>
                  <div class="actions">
                    @if (b.status === 'open' || b.status === 'running') {
                      <button class="btn btn-danger btn-sm" (click)="cancel(b.id)">Cancel</button>
                      @if (b.status === 'running' && b.joiner) {
                        <button class="btn btn-success btn-sm" (click)="openComplete(b)">Complete</button>
                      }
                    }
                    @if (b.status === 'cancelled' || b.status === 'completed') {
                      <button class="btn btn-outline btn-sm" (click)="deleteBattle(b.id)">Delete</button>
                    }
                  </div>
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
  battles: Battle[] = [];
  pagination: Pagination | null = null;
  loading = true;
  statusFilter = '';
  completeBattle: Battle | null = null;
  winnerId = '';

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
