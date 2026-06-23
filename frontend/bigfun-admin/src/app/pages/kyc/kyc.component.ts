import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import { KycUser } from '../../core/models';

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Pending KYC</h1>
    </div>

    @if (loading) { <div class="spinner">Loading...</div> }
    @else if (!users.length) { <div class="empty">No pending KYC submissions</div> }
    @else {
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>PAN</th>
              <th>Aadhaar</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users; track u._id) {
              <tr>
                <td>{{ u.name }}</td>
                <td>{{ u.mobile }}</td>
                <td>{{ u.kyc.panNumber }}</td>
                <td>{{ maskAadhaar(u.kyc.aadhaarNumber) }}</td>
                <td>{{ u.createdAt | date:'short' }}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-success btn-sm" (click)="approve(u._id)">Approve</button>
                    <button class="btn btn-danger btn-sm" (click)="openReject(u._id)">Reject</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (rejectId) {
      <div class="modal-backdrop" (click)="rejectId = ''">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Reject KYC</h3>
          <div class="form-group">
            <label>Reason (optional)</label>
            <input [(ngModel)]="rejectReason" />
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
export class KycComponent implements OnInit {
  private api = inject(AdminApiService);
  users: KycUser[] = [];
  loading = true;
  rejectId = '';
  rejectReason = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getPendingKyc().subscribe({
      next: (res) => {
        this.users = res.users;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  maskAadhaar(a: string) {
    if (!a || a.length < 4) return a;
    return 'XXXX XXXX ' + a.slice(-4);
  }

  approve(id: string) {
    this.api.approveKyc(id).subscribe({ next: () => this.load() });
  }

  openReject(id: string) {
    this.rejectId = id;
    this.rejectReason = '';
  }

  reject() {
    this.api.rejectKyc(this.rejectId, this.rejectReason).subscribe({
      next: () => {
        this.rejectId = '';
        this.load();
      },
    });
  }
}
