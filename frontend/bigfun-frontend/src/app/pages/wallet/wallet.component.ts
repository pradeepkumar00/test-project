import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { WalletSyncService } from '../../core/services/wallet-sync.service';
import { DepositQr, PaymentDetails } from '../../core/models';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2 class="section-title">Wallet</h2>

      <div class="tabs">
        <button [class.active]="tab === 'deposit'" (click)="tab = 'deposit'">Add Money</button>
        <button [class.active]="tab === 'withdraw'" (click)="tab = 'withdraw'">Withdraw</button>
      </div>

      @if (tab === 'deposit') {
        <p class="sub">{{ payment?.instructions || 'Enter amount, generate QR, pay, then submit transaction ID.' }}</p>

        <div class="deposit-layout">
          <div class="deposit-form card">
            <div class="form-group">
              <label>Enter Amount (min ₹{{ payment?.minDeposit || 100 }})</label>
              <input
                type="number"
                [(ngModel)]="amount"
                (ngModelChange)="onAmountChange()"
                placeholder="e.g. 500"
                [disabled]="generatingQr"
              />
            </div>
            <button
              class="btn btn-primary btn-block"
              [disabled]="generatingQr || amount < (payment?.minDeposit || 100)"
              (click)="generateQr()"
            >
              {{ generatingQr ? 'Generating QR...' : 'Add & Generate QR' }}
            </button>

            @if (depositQr) {
              <div class="qr-panel">
                <p class="qr-amount">Pay exactly <strong>₹{{ depositQr.amount | number:'1.2-2' }}</strong></p>
                <img [src]="depositQr.qrDataUrl" alt="UPI QR Code" class="qr-image" />
                <p class="qr-note">Scan with PhonePe, GPay, Paytm or any UPI app</p>
                <p class="upi-id">UPI: {{ depositQr.upiId }}</p>
                <p class="order-id">Ref: {{ depositQr.orderId }}</p>
                <button class="btn btn-outline btn-block" (click)="copyUpi()">Copy UPI ID</button>
                <p class="expiry">QR valid for {{ depositQr.expiresInMinutes }} minutes</p>
              </div>
            }
          </div>

          <div class="deposit-form card">
            <h3 class="step-title">After Payment</h3>
            <div class="form-group">
              <label>Transaction ID / UTR Number</label>
              <input
                type="text"
                [(ngModel)]="utrNumber"
                placeholder="12-digit UTR from payment app"
                [disabled]="!depositQr"
              />
            </div>
            <button
              class="btn btn-gold btn-block"
              [disabled]="submitting || !depositQr || !utrNumber.trim()"
              (click)="submitDeposit()"
            >
              {{ submitting ? 'Submitting...' : 'Submit Deposit Request' }}
            </button>
            <p class="hint">Your request will be sent to admin for verification</p>
          </div>
        </div>

        <h3 class="section-title mt">Recent Deposits</h3>
        @for (d of deposits; track $index) {
          <div class="deposit-item card">
            <div>
              <strong>₹{{ d.amount }}</strong>
              @if (d.orderId) { <small class="ref"> · {{ d.orderId }}</small> }
            </div>
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
  `,
  styles: [`
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .tabs button {
      flex: 1; padding: 14px; border: 1px solid var(--border); border-radius: 12px;
      background: var(--bg-card); color: var(--text-muted); cursor: pointer; font-weight: 600; font-size: 15px;
    }
    .tabs button.active { border-color: var(--primary); color: var(--primary-light); background: rgba(124, 58, 237, 0.12); }
    .sub { color: var(--text-muted); font-size: 15px; margin-bottom: 20px; line-height: 1.5; }
    .deposit-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    @media (min-width: 768px) {
      .deposit-layout { grid-template-columns: 1fr 1fr; align-items: start; }
    }
    .step-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .qr-panel {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      text-align: center;
    }
    .qr-amount { font-size: 15px; margin-bottom: 12px; color: var(--text-muted); }
    .qr-amount strong { color: var(--gold); font-size: 22px; }
    .qr-image {
      width: 220px;
      height: 220px;
      border-radius: 14px;
      background: #fff;
      padding: 10px;
      margin: 0 auto 12px;
      display: block;
    }
    .qr-note { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
    .upi-id { font-size: 14px; margin: 8px 0; word-break: break-all; }
    .order-id { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
    .expiry { font-size: 12px; color: var(--secondary); margin-top: 10px; }
    .hint { font-size: 13px; color: var(--text-muted); margin-top: 12px; text-align: center; }
    .mt { margin-top: 28px; }
    .deposit-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 15px; }
    .ref { color: var(--text-muted); font-size: 12px; }
    .status { font-size: 13px; text-transform: capitalize; }
    .status.pending { color: var(--gold); }
    .status.approved { color: var(--success); }
    .status.rejected { color: var(--danger); }

    @media (max-width: 768px) {
      .tabs button { padding: 12px 10px; font-size: 14px; }
      .sub { font-size: 14px; }
      .qr-image {
        width: min(220px, 100%);
        height: auto;
        aspect-ratio: 1;
      }
      .deposit-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
    }
  `],
})
export class WalletComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private auth = inject(AuthService);
  private walletSync = inject(WalletSyncService);
  private walletSub?: Subscription;

  tab: 'deposit' | 'withdraw' = 'deposit';
  payment: PaymentDetails | null = null;
  depositQr: DepositQr | null = null;
  amount = 500;
  utrNumber = '';
  withdrawAmount = 110;
  withdrawMethod = 'UPI';
  upiId = '';
  withdrawPassword = '';
  generatingQr = false;
  submitting = false;
  withdrawing = false;
  error = '';
  message = '';
  deposits: { amount: number; status: string; orderId?: string }[] = [];

  ngOnInit() {
    this.walletService.getPaymentDetails().subscribe({
      next: (r) => (this.payment = r.payment),
    });
    this.loadDeposits();

    this.walletSub = this.walletSync.walletUpdate$.subscribe((update) => {
      if (update.reason === 'deposit_approved' || update.reason === 'balance_sync') {
        this.loadDeposits();
        if (update.reason === 'deposit_approved') {
          this.message = 'Deposit approved! Wallet balance updated.';
        }
      }
    });
  }

  ngOnDestroy() {
    this.walletSub?.unsubscribe();
  }

  onAmountChange() {
    this.depositQr = null;
    this.utrNumber = '';
  }

  generateQr() {
    this.error = '';
    this.message = '';
    this.generatingQr = true;
    this.depositQr = null;

    this.walletService.generateDepositQr(this.amount).subscribe({
      next: (r) => {
        this.depositQr = r.depositQr;
        this.amount = r.depositQr.amount;
        this.generatingQr = false;
        this.message = `QR generated for ₹${r.depositQr.amount}. Scan and pay the exact amount.`;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to generate QR';
        this.generatingQr = false;
      },
    });
  }

  loadDeposits() {
    this.walletService.getDeposits().subscribe({
      next: (r) =>
        (this.deposits = r.deposits as { amount: number; status: string; orderId?: string }[]),
    });
  }

  copyUpi() {
    const upi = this.depositQr?.upiId || this.payment?.upiId;
    if (upi) {
      navigator.clipboard.writeText(upi);
      this.message = 'UPI ID copied!';
    }
  }

  submitDeposit() {
    if (!this.depositQr) {
      this.error = 'Generate QR code first';
      return;
    }

    this.error = '';
    this.message = '';
    this.submitting = true;

    this.walletService.submitDeposit(this.depositQr.amount, this.utrNumber.trim(), this.depositQr.orderId).subscribe({
      next: (r) => {
        this.message = r.message;
        this.utrNumber = '';
        this.depositQr = null;
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
