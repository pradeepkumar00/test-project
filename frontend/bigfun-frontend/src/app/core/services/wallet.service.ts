import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PaymentDetails, DepositQr, WalletDeposit, WalletWithdrawal } from '../models';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);

  getBalance() {
    return this.http.get<{ success: boolean; walletBalance: number; income: number; balance: { total: number } }>(
      `${environment.apiUrl}/wallet/balance`
    );
  }

  getPaymentDetails() {
    return this.http.get<{ success: boolean; payment: PaymentDetails }>(
      `${environment.apiUrl}/wallet/payment-details`
    );
  }

  generateDepositQr(amount: number) {
    return this.http.post<{ success: boolean; depositQr: DepositQr }>(
      `${environment.apiUrl}/wallet/deposit/generate-qr`,
      { amount }
    );
  }

  submitDeposit(amount: number, utrNumber: string, orderId?: string) {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/wallet/deposit/submit`, {
      amount,
      utrNumber,
      orderId,
    });
  }

  getDeposits() {
    return this.http.get<{ success: boolean; deposits: WalletDeposit[] }>(
      `${environment.apiUrl}/wallet/deposits`
    );
  }

  getWithdrawals() {
    return this.http.get<{ success: boolean; withdrawals: WalletWithdrawal[] }>(
      `${environment.apiUrl}/wallet/withdrawals`
    );
  }

  requestWithdraw(data: { amount: number; method: string; password: string; upiId?: string }) {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/wallet/withdraw`, data);
  }
}

@Injectable({ providedIn: 'root' })
export class ReferralService {
  private http = inject(HttpClient);

  getReferralInfo() {
    return this.http.get<{
      success: boolean;
      referral: { code: string; link: string; bonus: number; totalReferrals: number; totalEarnings: number };
    }>(`${environment.apiUrl}/referral/code`);
  }

  getReferralStats() {
    return this.http.get<{ success: boolean; stats: unknown; referredUsers: unknown[] }>(
      `${environment.apiUrl}/referral/stats`
    );
  }
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  getStats() {
    return this.http.get<{ success: boolean; profile: unknown }>(`${environment.apiUrl}/profile/stats`);
  }

  getHistory() {
    return this.http.get<{ success: boolean; transactions: unknown[]; battles: unknown[] }>(
      `${environment.apiUrl}/profile/history`
    );
  }

  submitKyc(panNumber: string, aadhaarNumber: string) {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/profile/kyc`, {
      panNumber,
      aadhaarNumber,
    });
  }
}
