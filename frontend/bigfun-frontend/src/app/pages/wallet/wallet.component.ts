import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { PaymentDetails } from '../../core/models';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, BottomNavComponent],
  template: `
    <app-header />
    <div class="page">
      <div class="tabs">
        <button [class.active]="tab === 'deposit'" (click)="tab = 'deposit'">Add Money</button>
        <button [class.active]="tab === 'withdraw'" (click)="tab = 'withdraw'">Withdraw</button>
      </div>

      @if (tab === 'deposit') {
        <p class="sub">Pay via UPI, then submit amount and UTR number for admin approval.</p>

        @if (payment) {
          <div class="payment-box card">
            <div class="upi-label">{{ payment.label }}</div>
            <div class="qr-placeholder">📱 Scan QR / Pay via UPI</div>
            <p class="upi-id">UPI ID: {{ payment.upiId }}</p>
            <button class="btn btn-outline btn-block" (click)="copyUpi()">📋 Copy UPI ID</button>
          </div>
        }

        <div class="form-group">
          <label>Enter Amount (min ₹{{ payment?.minDeposit || 100 }})</label>
          <input type="number" [(ngModel)]="amount" placeholder="Amount" />
        </div>
        <div class="form-group">
          <label>Enter UTR Number</label>
          <input type="text" [(ngModel)]="utrNumber" placeholder="UTR from payment app" />
        </div>
        <button class="btn btn-gold btn-block" [disabled]="submitting" (click)="submitDeposit()">
          {{ submitting ? 'Submitting...' : 'Submit Deposit' }}
        </button>

        <h3 class="section-title mt">Recent Deposits</h3>
        @for (d of deposits; track $index) {
          <div class="deposit-item card">
            <span>₹{{ d.amount }}</span>
            <span class="status" [ngClass]="d.status">{{ d.status }}</span>
          </div>
        }
      }

      @if (tab === 'withdraw') {
        <p class="sub">Minimum withdrawal ₹110. Amount will be sent after admin approval.</p>
        <div class="form-group">
          <label>Withdraw Amount</label>
          <input type="number" [(ngModel)]="withdrawAmount" placeholder="Amount" />
        </div>
        <div class="form-group">
          <label>Method</label>
          <select [(ngModel)]="withdrawMethod">
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        <div class="form-group">
          <label>UPI ID</label>
          <input type="text" [(ngModel)]="upiId" placeholder="yourname@upi" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" [(ngModel)]="withdrawPassword" placeholder="Confirm with password" />
        </div>
        <button class="btn btn-gold btn-block" [disabled]="withdrawing" (click)="submitWithdraw()">
          {{ withdrawing ? 'Submitting...' : 'Request Withdrawal' }}
        </button>
      }

      @if (error) { <div class="alert error">{{ error }}</div> }
      @if (message) { <div class="alert success">{{ message }}</div> }
    </div>
    <app-bottom-nav />
  `,
  styles: [`
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .tabs button {
      flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: 10px;
      background: var(--bg-card); color: var(--text-muted); cursor: pointer; font-weight: 600;
    }
    .tabs button.active { border-color: var(--gold); color: var(--gold); }
    .sub { color: var(--text-muted); font-size: 14px; margin-bottom: 16px; }
    .payment-box { text-align: center; margin-bottom: 20px; }
    .upi-label { background: var(--gold); color: #000; padding: 8px; border-radius: 8px; font-weight: 600; margin-bottom: 12px; }
    .qr-placeholder { font-size: 48px; padding: 20px; background: #fff; border-radius: 12px; margin: 12px 0; }
    .upi-id { font-size: 14px; margin: 8px 0; word-break: break-all; }
    .mt { margin-top: 24px; }
    .deposit-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .status { font-size: 12px; text-transform: capitalize; }
    .status.pending { color: var(--gold); }
    .status.approved { color: var(--success); }
    .status.rejected { color: var(--danger); }
  `],
})
export class WalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private auth = inject(AuthService);

  tab: 'deposit' | 'withdraw' = 'deposit';
  payment: PaymentDetails | null = null;
  amount = 1000;
  utrNumber = '';
  withdrawAmount = 110;
  withdrawMethod = 'UPI';
  upiId = '';
  withdrawPassword = '';
  submitting = false;
  withdrawing = false;
  error = '';
  message = '';
  deposits: { amount: number; status: string }[] = [];

  ngOnInit() {
    this.walletService.getPaymentDetails().subscribe({
      next: (r) => (this.payment = r.payment),
    });
    this.loadDeposits();
  }

  loadDeposits() {
    this.walletService.getDeposits().subscribe({
      next: (r) => (this.deposits = r.deposits as { amount: number; status: string }[]),
    });
  }

  copyUpi() {
    if (this.payment?.upiId) {
      navigator.clipboard.writeText(this.payment.upiId);
      this.message = 'UPI ID copied!';
    }
  }

  submitDeposit() {
    this.error = '';
    this.message = '';
    this.submitting = true;
    this.walletService.submitDeposit(this.amount, this.utrNumber).subscribe({
      next: (r) => {
        this.message = r.message;
        this.utrNumber = '';
        this.loadDeposits();
        this.auth.fetchProfile().subscribe();
        this.submitting = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed';
        this.submitting = false;
      },
    });
  }

  submitWithdraw() {
    this.error = '';
    this.message = '';
    this.withdrawing = true;
    this.walletService
      .requestWithdraw({
        amount: this.withdrawAmount,
        method: this.withdrawMethod,
        password: this.withdrawPassword,
        upiId: this.upiId,
      })
      .subscribe({
        next: (r) => {
          this.message = r.message;
          this.withdrawPassword = '';
          this.auth.fetchProfile().subscribe();
          this.withdrawing = false;
        },
        error: (e) => {
          this.error = e.error?.message || 'Withdrawal failed';
          this.withdrawing = false;
        },
      });
  }
}
