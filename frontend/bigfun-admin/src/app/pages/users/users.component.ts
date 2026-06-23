import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Pagination, User } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Users</h1>
    </div>

    <div class="filters">
      <input style="width:220px" [(ngModel)]="search" placeholder="Search name or mobile" (keyup.enter)="load(1)" />
      <button class="btn btn-outline" (click)="load(1)">Search</button>
    </div>

    @if (loading) { <div class="spinner">Loading...</div> }
    @else if (!users.length) { <div class="empty">No users found</div> }
    @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Balance</th>
              <th>Referral</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users; track u._id) {
              <tr>
                <td>{{ u.name }}</td>
                <td>{{ u.mobile }}</td>
                <td>₹{{ u.balance }}</td>
                <td>{{ u.referralCode }}</td>
                <td>
                  <span class="badge" [class.badge-approved]="u.isActive" [class.badge-rejected]="!u.isActive">
                    {{ u.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>{{ u.createdAt | date:'mediumDate' }}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-outline btn-sm" (click)="toggleStatus(u)">
                      {{ u.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    @if (isSuperAdmin) {
                      <button class="btn btn-gold btn-sm" (click)="openBalance(u)">Adjust Balance</button>
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

    @if (balanceUser) {
      <div class="modal-backdrop" (click)="balanceUser = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Adjust Balance — {{ balanceUser.name }}</h3>
          <div class="form-group">
            <label>Type</label>
            <select [(ngModel)]="balanceType">
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          <div class="form-group">
            <label>Amount</label>
            <input type="number" [(ngModel)]="balanceAmount" min="0.01" step="0.01" />
          </div>
          <div class="form-group">
            <label>Reason</label>
            <input [(ngModel)]="balanceReason" placeholder="Optional reason" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="balanceUser = null">Cancel</button>
            <button class="btn btn-gold" (click)="adjustBalance()">Apply</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UsersComponent implements OnInit {
  private api = inject(AdminApiService);
  private auth = inject(AuthService);
  users: User[] = [];
  pagination: Pagination | null = null;
  loading = true;
  search = '';
  isSuperAdmin = this.auth.isSuperAdmin();
  balanceUser: User | null = null;
  balanceType: 'credit' | 'debit' = 'credit';
  balanceAmount = 0;
  balanceReason = '';

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.api.getUsers(page, this.search).subscribe({
      next: (res) => {
        this.users = res.users;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  toggleStatus(u: User) {
    this.api.toggleUserStatus(u._id, !u.isActive).subscribe({ next: () => this.load(this.pagination?.page || 1) });
  }

  openBalance(u: User) {
    this.balanceUser = u;
    this.balanceType = 'credit';
    this.balanceAmount = 0;
    this.balanceReason = '';
  }

  adjustBalance() {
    if (!this.balanceUser || this.balanceAmount <= 0) return;
    this.api.adjustBalance(this.balanceUser._id, this.balanceAmount, this.balanceType, this.balanceReason).subscribe({
      next: () => {
        this.balanceUser = null;
        this.load(this.pagination?.page || 1);
      },
    });
  }
}
