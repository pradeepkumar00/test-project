import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Battle,
  DashboardStats,
  Deposit,
  KycUser,
  Pagination,
  Transaction,
  User,
  Withdrawal,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getDashboard() {
    return this.http.get<{ success: boolean; stats: DashboardStats }>(`${this.base}/dashboard`);
  }

  getDeposits(page = 1, status = '') {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (status) params = params.set('status', status);
    return this.http.get<{ success: boolean; deposits: Deposit[]; pagination: Pagination }>(
      `${this.base}/deposits`,
      { params }
    );
  }

  approveDeposit(id: string) {
    return this.http.post(`${this.base}/deposits/${id}/approve`, {});
  }

  rejectDeposit(id: string, reason = '') {
    return this.http.post(`${this.base}/deposits/${id}/reject`, { reason });
  }

  getWithdrawals(page = 1, status = '') {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (status) params = params.set('status', status);
    return this.http.get<{ success: boolean; withdrawals: Withdrawal[]; pagination: Pagination }>(
      `${this.base}/withdrawals`,
      { params }
    );
  }

  approveWithdrawal(id: string) {
    return this.http.post(`${this.base}/withdrawals/${id}/approve`, {});
  }

  rejectWithdrawal(id: string, reason = '') {
    return this.http.post(`${this.base}/withdrawals/${id}/reject`, { reason });
  }

  getBattles(page = 1, status = '') {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (status) params = params.set('status', status);
    return this.http.get<{ success: boolean; battles: Battle[]; pagination: Pagination }>(
      `${this.base}/battles`,
      { params }
    );
  }

  cancelBattle(id: string, reason = '') {
    return this.http.post(`${this.base}/battles/${id}/cancel`, { reason });
  }

  completeBattle(id: string, winnerId: string) {
    return this.http.post(`${this.base}/battles/${id}/complete`, { winnerId });
  }

  deleteBattle(id: string) {
    return this.http.delete(`${this.base}/battles/${id}`);
  }

  getUsers(page = 1, search = '') {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (search) params = params.set('search', search);
    return this.http.get<{ success: boolean; users: User[]; pagination: Pagination }>(
      `${this.base}/users`,
      { params }
    );
  }

  toggleUserStatus(id: string, isActive: boolean) {
    return this.http.put(`${this.base}/users/${id}/status`, { isActive });
  }

  adjustBalance(id: string, amount: number, type: 'credit' | 'debit', reason = '') {
    return this.http.post(`${this.base}/users/${id}/balance`, { amount, type, reason });
  }

  getPendingKyc() {
    return this.http.get<{ success: boolean; users: KycUser[] }>(`${this.base}/kyc/pending`);
  }

  approveKyc(userId: string) {
    return this.http.post(`${this.base}/kyc/${userId}/approve`, {});
  }

  rejectKyc(userId: string, reason = '') {
    return this.http.post(`${this.base}/kyc/${userId}/reject`, { reason });
  }

  getTransactions(page = 1, type = '', userId = '') {
    let params = new HttpParams().set('page', page).set('limit', 30);
    if (type) params = params.set('type', type);
    if (userId) params = params.set('userId', userId);
    return this.http.get<{ success: boolean; transactions: Transaction[]; pagination: Pagination }>(
      `${this.base}/transactions`,
      { params }
    );
  }
}
