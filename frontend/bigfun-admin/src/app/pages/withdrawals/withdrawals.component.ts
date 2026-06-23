import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import { Pagination, Withdrawal } from '../../core/models';

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Withdrawals</h1>
    </div>

    <div class="filters">
      <select [(ngModel)]="statusFilter" (change)="load(1)">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    @if (loading) { <div class="spinner">Loading...</div> }
    @else if (!withdrawals.length) { <div class="empty">No withdrawals found</div> }
    @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (w of withdrawals; track w._id) {
              <tr>
                <td>
                  <strong>{{ w.user.name }}</strong><br />
                  <small>{{ w.user.mobile }} · Bal: ₹{{ w.user.balance }}</small>
                </td>
                <td>₹{{ w.amount }}</td>
                <td>{{ w.method }} {{ w.upiId ? '· ' + w.upiId : '' }}</td>
                <td><span class="badge badge-{{ w.status }}">{{ w.status }}</span></td>
                <td>{{ w.createdAt | date:'short' }}</td>
                <td>
                  @if (w.status === 'pending') {
                    <div class="actions">
                      <button class="btn btn-success btn-sm" (click)="approve(w._id)">Approve</button>
                      <button class="btn btn-danger btn-sm" (click)="openReject(w._id)">Reject</button>
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

    @if (rejectId) {
      <div class="modal-backdrop" (click)="rejectId = ''">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Reject Withdrawal</h3>
          <div class="form-group">
            <label>Reason (optional)</label>
            <input [(ngModel)]="rejectReason" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="rejectId = ''">Cancel</button>
            <button class="btn btn-danger" (click)="reject()">Reject & Refund</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class WithdrawalsComponent implements OnInit {
  private api = inject(AdminApiService);
  withdrawals: Withdrawal[] = [];
  pagination: Pagination | null = null;
  loading = true;
  statusFilter = 'pending';
  rejectId = '';
  rejectReason = '';

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.api.getWithdrawals(page, this.statusFilter).subscribe({
      next: (res) => {
        this.withdrawals = res.withdrawals;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  approve(id: string) {
    this.api.approveWithdrawal(id).subscribe({ next: () => this.load(this.pagination?.page || 1) });
  }

  openReject(id: string) {
    this.rejectId = id;
    this.rejectReason = '';
  }

  reject() {
    this.api.rejectWithdrawal(this.rejectId, this.rejectReason).subscribe({
      next: () => {
        this.rejectId = '';
        this.load(this.pagination?.page || 1);
      },
    });
  }
}
