import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WalletService } from '../../core/services/wallet.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { WalletSyncService } from '../../core/services/wallet-sync.service';
import { DepositQr, PaymentDetails, WalletDeposit, WalletWithdrawal } from '../../core/models';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page balance-page">
      <div class="panel">
        <h2>My Balance</h2>
        <p class="sub">Manage your funds and winnings</p>

        <div class="total-box">
          <span>TOTAL BALANCE</span>
          <strong>₹{{ totalBalance | number:'1.0-2' }}</strong>
        </div>

        <div class="fund-card deposit">
          <div class="fund-left">
            <div class="fund-icon deposit-ico">💰</div>
            <div>
              <small>Deposit Cash</small>
              <strong>₹{{ depositedCash | number:'1.0-2' }}</strong>
            </div>
          </div>
          <button type="button" class="add-btn" (click)="openPanel('deposit')">+ Add Cash</button>
        </div>

        <div class="fund-card winning">
          <div class="fund-left">
            <div class="fund-icon win-ico">🏆</div>
            <div>
              <small>Winning Cash</small>
              <strong>₹{{ winningCash | number:'1.0-2' }}</strong>
            </div>
          </div>
          <button type="button" class="withdraw-btn" (click)="openPanel('withdraw')">Withdraw</button>
        </div>
      </div>

      @if (activePanel) {
        <div class="sheet-backdrop" (click)="closePanel()"></div>
        <div class="sheet">
          <div class="sheet-head">
            <h3>{{ activePanel === 'deposit' ? 'Add Cash' : 'Withdraw' }}</h3>
            <button type="button" class="close" (click)="closePanel()">✕</button>
          </div>

          @if (activePanel === 'deposit') {
            <p class="hint">{{ payment?.instructions || 'Enter amount, generate QR, pay, then submit UTR.' }}</p>
            <div class="form-group">
              <label>Enter Amount (min ₹{{ payment?.minDeposit || 100 }})</label>
              <input type="number" [(ngModel)]="amount" (ngModelChange)="onAmountChange()" [disabled]="generatingQr" />
            </div>
            <button class="btn-primary" [disabled]="generatingQr || amount < (payment?.minDeposit || 100)" (click)="generateQr()">
              {{ generatingQr ? 'Generating QR...' : 'Generate QR' }}
            </button>

            @if (depositQr) {
              <div class="qr-box">
                <p>Pay exactly <strong>₹{{ depositQr.amount | number:'1.2-2' }}</strong></p>
                <img [src]="depositQr.qrDataUrl" alt="UPI QR" />
                <p class="muted">UPI: {{ depositQr.upiId }}</p>
                <button class="btn-outline" (click)="copyUpi()">Copy UPI ID</button>
              </div>
              <div class="form-group">
                <label>Transaction ID / UTR</label>
                <input type="text" [(ngModel)]="utrNumber" placeholder="12-digit UTR" />
              </div>
              <button class="btn-primary" [disabled]="submitting || !utrNumber.trim()" (click)="submitDeposit()">
                {{ submitting ? 'Submitting...' : 'Submit Deposit' }}
              </button>
            }

            <h4 class="list-title">Recent Deposits</h4>
            @for (d of deposits; track d._id) {
              <div class="row-item">
                <div>
                  <strong>₹{{ d.amount }}</strong>
                  <small>{{ d.createdAt | date:'medium' }}</small>
                  @if (d.status === 'rejected' && d.rejectReason) {
                    <small class="reject">{{ d.rejectReason }}</small>
                  }
                </div>
                <span class="status" [ngClass]="d.status">{{ d.status }}</span>
              </div>
            }
          } @else {
            <p class="hint">Minimum withdrawal ₹{{ minWithdraw }}.</p>
            <div class="form-group">
              <label>Withdraw Amount</label>
              <input type="number" [(ngModel)]="withdrawAmount" [min]="minWithdraw" />
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
            <button class="btn-primary green" [disabled]="withdrawing" (click)="submitWithdraw()">
              {{ withdrawing ? 'Submitting...' : 'Request Withdrawal' }}
            </button>

            <h4 class="list-title">Recent Withdrawals</h4>
            @for (w of withdrawals; track w._id) {
              <div class="row-item">
                <div>
                  <strong>₹{{ w.amount }}</strong>
                  <small>{{ w.method }} · {{ w.createdAt | date:'medium' }}</small>
                  @if (w.status === 'rejected' && w.rejectReason) {
                    <small class="reject">{{ w.rejectReason }}</small>
                  }
                </div>
                <span class="status" [ngClass]="w.status">{{ w.status }}</span>
              </div>
            }
          }

          @if (error) { <div class="alert error">{{ error }}</div> }
          @if (message) { <div class="alert success">{{ message }}</div> }
        </div>
      }
    </div>
  `,
  styles: [`
    .balance-page { padding-top: 4px; }
    .panel {
      background: #fff;
      color: #111;
      border-radius: 22px;
      padding: 20px 16px 22px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
    }
    .panel h2 { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
    .sub { color: #6b7280; font-size: 13px; margin-bottom: 16px; }

    .total-box {
      background: #f3f4f6;
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 14px;
      text-align: center;
    }
    .total-box span {
      display: block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .total-box strong { font-size: 32px; color: #16a34a; font-weight: 800; }

    .fund-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: #eef6ff;
      border-radius: 16px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .fund-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .fund-icon {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; background: #fff;
    }
    .fund-left small { display: block; color: #64748b; font-size: 12px; font-weight: 600; }
    .fund-left strong { font-size: 22px; font-weight: 800; color: #0f172a; }

    .add-btn, .withdraw-btn {
      border: none; border-radius: 999px; padding: 10px 14px;
      font-weight: 800; font-size: 13px; cursor: pointer; white-space: nowrap;
      font-family: inherit;
    }
    .add-btn { background: #7c3aed; color: #fff; }
    .withdraw-btn { background: #22c55e; color: #fff; }

    .sheet-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 300;
    }
    .sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 310;
      max-height: 85vh; overflow: auto;
      background: #12081f; color: #fff;
      border-radius: 20px 20px 0 0;
      padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
      border-top: 1px solid rgba(34,211,238,0.25);
    }
    .sheet-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .sheet-head h3 { font-size: 18px; }
    .close {
      width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);
      background: transparent; color: #fff; cursor: pointer;
    }
    .hint { color: #a3a3b8; font-size: 13px; margin-bottom: 12px; }
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; font-size: 12px; color: #c4b5fd; margin-bottom: 6px; font-weight: 700; }
    .form-group input, .form-group select {
      width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(34,211,238,0.3);
      background: #0a0614; color: #fff; font-family: inherit;
    }
    .btn-primary, .btn-outline {
      width: 100%; border: none; border-radius: 12px; padding: 12px; font-weight: 800;
      cursor: pointer; font-family: inherit; margin-bottom: 10px;
    }
    .btn-primary { background: linear-gradient(90deg, #7c3aed, #22d3ee); color: #fff; }
    .btn-primary.green { background: #22c55e; color: #041016; }
    .btn-outline { background: transparent; border: 1px solid rgba(34,211,238,0.4); color: #67e8f9; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

    .qr-box { text-align: center; margin: 12px 0; }
    .qr-box img { width: 200px; height: 200px; background: #fff; border-radius: 12px; padding: 8px; }
    .muted { color: #a3a3b8; font-size: 12px; margin: 8px 0; }

    .list-title { margin: 16px 0 8px; font-size: 14px; color: #c4b5fd; }
    .row-item {
      display: flex; justify-content: space-between; gap: 10px;
      padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.04);
      margin-bottom: 8px; font-size: 13px;
    }
    .row-item small { display: block; color: #94a3b8; margin-top: 2px; }
    .reject { color: #fda4af !important; }
    .status { text-transform: capitalize; font-weight: 700; }
    .status.pending { color: #facc15; }
    .status.approved, .status.completed { color: #4ade80; }
    .status.rejected { color: #f87171; }
    .alert { padding: 10px 12px; border-radius: 10px; margin-top: 10px; font-size: 13px; }
    .alert.error { background: rgba(239,68,68,0.15); color: #fda4af; }
    .alert.success { background: rgba(34,197,94,0.15); color: #86efac; }
  `],
})
export class WalletComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private settingsService = inject(SettingsService);
  private auth = inject(AuthService);
  private walletSync = inject(WalletSyncService);
  private walletSub?: Subscription;
  private userSub?: Subscription;

  activePanel: 'deposit' | 'withdraw' | null = null;
  payment: PaymentDetails | null = null;
  depositQr: DepositQr | null = null;
  amount = 500;
  utrNumber = '';
  withdrawAmount = 110;
  minWithdraw = 110;
  withdrawMethod = 'UPI';
  upiId = '';
  withdrawPassword = '';
  generatingQr = false;
  submitting = false;
  withdrawing = false;
  error = '';
  message = '';
  deposits: WalletDeposit[] = [];
  withdrawals: WalletWithdrawal[] = [];
  depositedCash = 0;
  winningCash = 0;
  totalBalance = 0;

  ngOnInit() {
    this.userSub = this.auth.user$.subscribe((u) => {
      this.depositedCash = u?.balance ?? 0;
      this.winningCash = u?.income ?? u?.bonusBalance ?? 0;
      this.totalBalance = this.depositedCash + (u?.bonusBalance ?? 0);
      if (u?.bankDetails?.upiId && !this.upiId) this.upiId = u.bankDetails.upiId;
    });

    this.walletService.getPaymentDetails().subscribe({ next: (r) => (this.payment = r.payment) });
    this.settingsService.getSettings().subscribe({
      next: (r) => {
        this.minWithdraw = r.settings.minWithdraw;
        if (this.withdrawAmount < this.minWithdraw) this.withdrawAmount = this.minWithdraw;
      },
    });
    this.loadDeposits();
    this.loadWithdrawals();

    this.walletSub = this.walletSync.walletUpdate$.subscribe((update) => {
      if (update.reason === 'deposit_approved' || update.reason === 'balance_sync') {
        this.loadDeposits();
        this.loadWithdrawals();
        if (update.reason === 'deposit_approved') this.message = 'Deposit approved! Wallet updated.';
      }
    });
  }

  ngOnDestroy() {
    this.walletSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  openPanel(panel: 'deposit' | 'withdraw') {
    this.activePanel = panel;
    this.error = '';
    this.message = '';
  }

  closePanel() {
    this.activePanel = null;
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
        this.message = `QR generated for ₹${r.depositQr.amount}`;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to generate QR';
        this.generatingQr = false;
      },
    });
  }

  loadDeposits() {
    this.walletService.getDeposits().subscribe({ next: (r) => (this.deposits = r.deposits) });
  }

  loadWithdrawals() {
    this.walletService.getWithdrawals().subscribe({ next: (r) => (this.withdrawals = r.withdrawals) });
  }

  copyUpi() {
    const upi = this.depositQr?.upiId || this.payment?.upiId;
    if (upi) {
      navigator.clipboard.writeText(upi);
      this.message = 'UPI ID copied!';
    }
  }

  submitDeposit() {
    if (!this.depositQr) return;
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
          this.loadWithdrawals();
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
