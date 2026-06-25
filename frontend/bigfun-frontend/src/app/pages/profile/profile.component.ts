import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/wallet.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      @if (user) {
        <div class="profile-header card">
          <div class="avatar">👤</div>
          <div class="header-info">
            <h2>{{ user.name || 'User' }}</h2>
            <p>{{ user.mobile }}</p>
            @if (user.referralCode) {
              <p class="referral">Referral: {{ user.referralCode }}</p>
            }
          </div>
          @if (!editMode) {
            <button class="btn btn-outline btn-sm edit-btn" (click)="startEdit()">Edit Profile</button>
          }
        </div>

        @if (editMode) {
          <div class="edit-form card">
            <h3 class="form-title">Edit Profile</h3>

            <div class="form-group">
              <label>Full Name</label>
              <input [(ngModel)]="editName" placeholder="Your name" />
            </div>
            <div class="form-group">
              <label>UPI ID</label>
              <input [(ngModel)]="editUpiId" placeholder="yourname@upi" />
            </div>
            <div class="form-group">
              <label>Account Holder Name</label>
              <input [(ngModel)]="editAccountHolder" placeholder="Name as per bank" />
            </div>
            <div class="form-group">
              <label>Bank Name</label>
              <input [(ngModel)]="editBankName" placeholder="Bank name" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Account Number</label>
                <input [(ngModel)]="editAccountNumber" placeholder="Account number" />
              </div>
              <div class="form-group">
                <label>IFSC Code</label>
                <input [(ngModel)]="editIfsc" placeholder="IFSC" />
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-ghost" [disabled]="saving" (click)="cancelEdit()">Cancel</button>
              <button class="btn btn-primary" [disabled]="saving" (click)="saveProfile()">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        }

        <div class="stats-row">
          <div class="stat card">
            <span class="num">{{ user.gamesWon || 0 }}</span>
            <span class="stat-label">Won</span>
          </div>
          <div class="stat card">
            <span class="num">{{ user.gamesPlayed || 0 }}</span>
            <span class="stat-label">Games</span>
          </div>
        </div>

        @if (!editMode && user.bankDetails?.upiId) {
          <div class="bank-summary card">
            <strong>Payment Details</strong>
            <p>UPI: {{ user.bankDetails?.upiId }}</p>
            @if (user.bankDetails?.accountHolder) {
              <p>Account: {{ user.bankDetails?.accountHolder }}</p>
            }
          </div>
        }

        <div class="kyc card">
          <div class="kyc-info">
            <strong>KYC Status</strong>
            <span class="badge" [class.verified]="user.kycVerified">{{ user.kycVerified ? 'Verified' : 'Pending' }}</span>
          </div>
          @if (!user.kycVerified) {
            <div class="form-group">
              <label>PAN Number</label>
              <input [(ngModel)]="panNumber" placeholder="PAN" />
            </div>
            <div class="form-group">
              <label>Aadhaar Number</label>
              <input [(ngModel)]="aadhaarNumber" placeholder="Aadhaar" />
            </div>
            <button class="btn btn-gold btn-block" (click)="submitKyc()">Complete KYC</button>
          }
        </div>

        <div class="menu">
          <button class="menu-item card" (click)="showHistory = !showHistory">📜 History</button>
          <button class="menu-item card" routerLink="/wallet">💰 My Wallet</button>
          <button class="menu-item card" routerLink="/refer">🎁 Refer & Earn</button>
          <button class="menu-item card danger" (click)="logout()">🚪 Logout</button>
        </div>

        @if (showHistory && history.length) {
          <h3 class="section-title">Recent History</h3>
          @for (h of history.slice(0, 10); track $index) {
            <div class="history-item card">{{ h.type }} — ₹{{ h.amount }}</div>
          }
        }
      }

      @if (error) { <div class="alert error">{{ error }}</div> }
      @if (message) { <div class="alert success">{{ message }}</div> }
    </div>
  `,
  styles: [`
    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .header-info { flex: 1; min-width: 160px; }
    .avatar {
      font-size: 52px;
      width: 72px;
      height: 72px;
      background: var(--bg-input);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    h2 { font-size: 22px; }
    p { color: var(--text-muted); font-size: 15px; }
    .referral { font-size: 13px; color: var(--primary-light); margin-top: 4px; }
    .edit-btn { margin-left: auto; }

    .edit-form { margin-bottom: 20px; }
    .form-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0;
    }
    @media (min-width: 600px) {
      .form-row { grid-template-columns: 1fr 1fr; gap: 14px; }
    }
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .stats-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px; }
    .stat { text-align: center; padding: 20px; }
    .num { display: block; font-size: 28px; font-weight: 700; color: var(--gold); }
    .stat-label { font-size: 13px; color: var(--text-muted); }

    .bank-summary {
      margin-bottom: 20px;
      font-size: 14px;
    }
    .bank-summary strong { display: block; margin-bottom: 8px; }
    .bank-summary p { margin-bottom: 4px; }

    .kyc { margin-bottom: 20px; }
    .kyc-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .badge { font-size: 13px; padding: 6px 12px; border-radius: 10px; background: var(--gold); color: #000; }
    .badge.verified { background: var(--success); color: #fff; }
    .menu { display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 600px) {
      .menu { grid-template-columns: 1fr 1fr; }
    }
    .menu-item {
      text-align: left;
      font-size: 16px;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text);
      padding: 16px 18px;
      border-radius: 16px;
    }
    .menu-item.danger { color: var(--danger); }
    .history-item { margin-bottom: 10px; font-size: 14px; }

    @media (max-width: 768px) {
      .profile-header {
        gap: 14px;
      }
      .edit-btn {
        width: 100%;
        margin-left: 0;
        margin-top: 4px;
      }
      .form-actions {
        flex-direction: column-reverse;
      }
      .form-actions .btn {
        width: 100%;
      }
      .avatar {
        width: 60px;
        height: 60px;
        font-size: 44px;
      }
      h2 { font-size: 20px; }
      .num { font-size: 24px; }
    }
  `],
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  user: User | null = null;
  editMode = false;
  saving = false;
  editName = '';
  editUpiId = '';
  editAccountHolder = '';
  editAccountNumber = '';
  editIfsc = '';
  editBankName = '';
  panNumber = '';
  aadhaarNumber = '';
  showHistory = false;
  history: { type: string; amount: number }[] = [];
  error = '';
  message = '';

  ngOnInit() {
    this.auth.user$.subscribe((u) => (this.user = u));
    this.auth.fetchProfile().subscribe();
    this.profileService.getStats().subscribe({
      next: (r) => {
        const p = r.profile as User;
        if (p) {
          this.user = { ...this.auth.getUser(), ...p } as User;
          this.auth.updateUser(this.user);
        }
      },
    });
    this.profileService.getHistory().subscribe({
      next: (r) => (this.history = r.transactions as { type: string; amount: number }[]),
    });
  }

  startEdit() {
    if (!this.user) return;
    this.editName = this.user.name || '';
    this.editUpiId = this.user.bankDetails?.upiId || '';
    this.editAccountHolder = this.user.bankDetails?.accountHolder || '';
    this.editAccountNumber = this.user.bankDetails?.accountNumber || '';
    this.editIfsc = this.user.bankDetails?.ifsc || '';
    this.editBankName = this.user.bankDetails?.bankName || '';
    this.editMode = true;
    this.error = '';
    this.message = '';
  }

  cancelEdit() {
    this.editMode = false;
    this.error = '';
  }

  saveProfile() {
    this.error = '';
    this.message = '';
    this.saving = true;

    this.auth
      .updateProfile({
        name: this.editName.trim(),
        upiId: this.editUpiId.trim(),
        accountHolder: this.editAccountHolder.trim(),
        accountNumber: this.editAccountNumber.trim(),
        ifsc: this.editIfsc.trim(),
        bankName: this.editBankName.trim(),
      })
      .subscribe({
        next: (r) => {
          this.user = r.user;
          this.message = r.message;
          this.editMode = false;
          this.saving = false;
        },
        error: (e) => {
          this.error = e.error?.message || 'Failed to update profile';
          this.saving = false;
        },
      });
  }

  submitKyc() {
    this.profileService.submitKyc(this.panNumber, this.aadhaarNumber).subscribe({
      next: (r) => alert(r.message),
    });
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
