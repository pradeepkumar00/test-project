import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import {
  DEFAULT_DEPOSIT_REJECTION_REASONS,
  OTHER_REJECTION_REASON,
  resolveRejectionReason,
} from '../../core/constants/rejection-reasons';
import { Deposit, Pagination } from '../../core/models';

@Component({
  selector: 'app-deposits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Deposits</h1>
    </div>

    <div class="filters">
      <select [(ngModel)]="statusFilter" (change)="load(1)">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    @if (loading) { <div class="spinner">Loading...</div> }
    @else if (!deposits.length) { <div class="empty">No deposits found</div> }
    @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Order ID</th>
              <th>UTR</th>
              <th>Method</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (d of deposits; track d._id) {
              <tr>
                <td>
                  <strong>{{ d.user.name }}</strong><br />
                  <small>{{ d.user.mobile }}</small>
                </td>
                <td>₹{{ d.amount }}</td>
                <td><small>{{ d.orderId }}</small></td>
                <td>{{ d.utrNumber }}</td>
                <td>{{ d.paymentMethod }}</td>
                <td><span class="badge badge-{{ d.status }}">{{ d.status }}</span></td>
                <td>
                  @if (d.rejectReason) {
                    <small class="reject-reason">{{ d.rejectReason }}</small>
                  } @else {
                    <small class="muted">—</small>
                  }
                </td>
                <td>{{ d.createdAt | date:'short' }}</td>
                <td>
                  @if (d.status === 'pending') {
                    <div class="actions">
                      <button class="btn btn-success btn-sm" [disabled]="actionId === d._id" (click)="approve(d._id)">Approve</button>
                      <button class="btn btn-danger btn-sm" [disabled]="actionId === d._id" (click)="openReject(d._id)">Reject</button>
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
      <div class="modal-backdrop" (click)="closeReject()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Reject Deposit</h3>
          <div class="form-group">
            <label>Rejection reason</label>
            <select [(ngModel)]="rejectReasonSelect">
              <option value="">Select a reason</option>
              @for (reason of rejectionReasons; track reason) {
                <option [value]="reason">{{ reason }}</option>
              }
            </select>
          </div>
          @if (rejectReasonSelect === otherReasonLabel) {
            <div class="form-group">
              <label>Custom reason</label>
              <input [(ngModel)]="rejectReasonCustom" placeholder="Enter rejection reason" />
            </div>
          }
          @if (rejectError) {
            <p class="reject-error">{{ rejectError }}</p>
          }
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="closeReject()">Cancel</button>
            <button class="btn btn-danger" [disabled]="rejecting" (click)="reject()">
              {{ rejecting ? 'Rejecting...' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .reject-reason { color: #fda4af; line-height: 1.4; display: block; max-width: 220px; }
    .muted { color: var(--text-muted); }
    .reject-error { color: #fda4af; font-size: 13px; margin-bottom: 12px; }
  `],
})
export class DepositsComponent implements OnInit {
  private api = inject(AdminApiService);
  deposits: Deposit[] = [];
  pagination: Pagination | null = null;
  loading = true;
  statusFilter = 'pending';
  actionId = '';
  rejectId = '';
  rejectReasonSelect = '';
  rejectReasonCustom = '';
  rejectError = '';
  rejecting = false;
  rejectionReasons = DEFAULT_DEPOSIT_REJECTION_REASONS;
  otherReasonLabel = OTHER_REJECTION_REASON;

  ngOnInit() {
    this.loadRejectionReasons();
    this.load(1);
  }

  loadRejectionReasons() {
    this.api.getRejectionReasons().subscribe({
      next: (res) => {
        if (res.depositReasons?.length) {
          this.rejectionReasons = res.depositReasons;
        }
      },
    });
  }

  load(page: number) {
    this.loading = true;
    this.api.getDeposits(page, this.statusFilter).subscribe({
      next: (res) => {
        this.deposits = res.deposits;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  approve(id: string) {
    this.actionId = id;
    this.api.approveDeposit(id).subscribe({
      next: () => this.load(this.pagination?.page || 1),
      complete: () => (this.actionId = ''),
    });
  }

  openReject(id: string) {
    this.rejectId = id;
    this.rejectReasonSelect = '';
    this.rejectReasonCustom = '';
    this.rejectError = '';
  }

  closeReject() {
    this.rejectId = '';
    this.rejectError = '';
  }

  reject() {
    const reason = resolveRejectionReason(this.rejectReasonSelect, this.rejectReasonCustom);
    if (!reason) {
      this.rejectError =
        this.rejectReasonSelect === this.otherReasonLabel
          ? 'Please enter a custom rejection reason'
          : 'Please select a rejection reason';
      return;
    }

    this.rejecting = true;
    this.rejectError = '';
    this.api.rejectDeposit(this.rejectId, reason).subscribe({
      next: () => {
        this.closeReject();
        this.load(this.pagination?.page || 1);
        this.rejecting = false;
      },
      error: (err) => {
        this.rejectError = err.error?.message || 'Failed to reject deposit';
        this.rejecting = false;
      },
    });
  }
}
