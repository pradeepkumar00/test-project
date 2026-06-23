import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import { Pagination, Transaction } from '../../core/models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Transactions</h1>
    </div>

    <div class="filters">
      <select [(ngModel)]="typeFilter" (change)="load(1)">
        <option value="">All types</option>
        <option value="deposit">Deposit</option>
        <option value="withdraw">Withdraw</option>
        <option value="bet">Bet</option>
        <option value="win">Win</option>
        <option value="refund">Refund</option>
        <option value="admin_adjustment">Admin Adjustment</option>
        <option value="referral_bonus">Referral Bonus</option>
      </select>
    </div>

    @if (loading) { <div class="spinner">Loading...</div> }
    @else if (!transactions.length) { <div class="empty">No transactions found</div> }
    @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            @for (t of transactions; track t._id) {
              <tr>
                <td>
                  <strong>{{ t.user.name }}</strong><br />
                  <small>{{ t.user.mobile }}</small>
                </td>
                <td>{{ t.type }}</td>
                <td>₹{{ t.amount }}</td>
                <td>₹{{ t.balanceBefore }} → ₹{{ t.balanceAfter }}</td>
                <td><span class="badge badge-{{ t.status }}">{{ t.status }}</span></td>
                <td>{{ t.createdAt | date:'short' }}</td>
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
  `,
})
export class TransactionsComponent implements OnInit {
  private api = inject(AdminApiService);
  transactions: Transaction[] = [];
  pagination: Pagination | null = null;
  loading = true;
  typeFilter = '';

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.api.getTransactions(page, this.typeFilter).subscribe({
      next: (res) => {
        this.transactions = res.transactions;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
