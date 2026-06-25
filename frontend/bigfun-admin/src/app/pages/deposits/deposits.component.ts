import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
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
      <div class="modal-backdrop" (click)="rejectId = ''">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Reject Deposit</h3>
          <div class="form-group">
            <label>Reason (optional)</label>
            <input [(ngModel)]="rejectReason" placeholder="Reason for rejection" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="rejectId = ''">Cancel</button>
            <button class="btn btn-danger" (click)="reject()">Reject</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DepositsComponent implements OnInit {
  private api = inject(AdminApiService);
  deposits: Deposit[] = [];
  pagination: Pagination | null = null;
  loading = true;
  statusFilter = 'pending';
  actionId = '';
  rejectId = '';
  rejectReason = '';

  ngOnInit() { this.load(1); }

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
    this.rejectReason = '';
  }

  reject() {
    this.api.rejectDeposit(this.rejectId, this.rejectReason).subscribe({
      next: () => {
        this.rejectId = '';
        this.load(this.pagination?.page || 1);
      },
    });
  }
}
