import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Battle,
  CurrencyOption,
  DashboardStats,
  Deposit,
  KycUser,
  Pagination,
  PlatformSettings,
  Transaction,
  User,
  Withdrawal,
  Admin,
  AdminPermission,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getDashboard() {
    return this.http.get<{ success: boolean; stats: DashboardStats }>(`${this.base}/dashboard`);
  }

  getRejectionReasons() {
    return this.http.get<{
      success: boolean;
      depositReasons: string[];
      withdrawalReasons: string[];
    }>(`${this.base}/rejection-reasons`);
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

  verifyBattle(id: string, approve: boolean, winnerId?: string, reason = '') {
    return this.http.post(`${this.base}/battles/${id}/verify`, { approve, winnerId, reason });
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

  getPlatformSettings() {
    return this.http.get<{
      success: boolean;
      settings: PlatformSettings;
      currencies: CurrencyOption[];
      paymentMethodOptions: string[];
      withdrawMethodOptions: string[];
    }>(`${this.base}/settings`);
  }

  updatePlatformSettings(settings: Omit<PlatformSettings, 'currencySymbol' | 'updatedAt'>) {
    return this.http.put<{ success: boolean; message: string; settings: PlatformSettings }>(
      `${this.base}/settings`,
      settings
    );
  }

  getPermissionCatalog() {
    return this.http.get<{ success: boolean; permissions: AdminPermission[] }>(
      `${this.base}/permissions`
    );
  }

  getAdmins() {
    return this.http.get<{ success: boolean; admins: Admin[] }>(`${this.base}/admins`);
  }

  createAdmin(data: { mobile: string; password: string; name?: string; permissions: string[] }) {
    return this.http.post<{ success: boolean; message: string; admin: Admin }>(
      `${this.base}/admins`,
      data
    );
  }

  updateAdmin(
    id: string,
    data: Partial<{ name: string; permissions: string[]; isActive: boolean; password: string }>
  ) {
    return this.http.put<{ success: boolean; message: string; admin: Admin }>(
      `${this.base}/admins/${id}`,
      data
    );
  }

  deleteAdmin(id: string) {
    return this.http.delete<{ success: boolean; message: string; deletedId: string }>(
      `${this.base}/admins/${id}`
    );
  }
}
