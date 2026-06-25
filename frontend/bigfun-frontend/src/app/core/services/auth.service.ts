import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private userSubject = new BehaviorSubject<User | null>(this.loadUser());
  user$ = this.userSubject.asObservable();

  private loadUser(): User | null {
    const raw = localStorage.getItem('bigfun_user');
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('bigfun_token');
  }

  getToken(): string | null {
    return localStorage.getItem('bigfun_token');
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  sendOtp(mobile: string, purpose: 'login' | 'register' = 'login') {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/auth/send-otp`, {
      mobile,
      purpose,
    });
  }

  login(mobile: string, password: string) {
    return this.http
      .post<{ success: boolean; token: string; user: User }>(`${environment.apiUrl}/auth/login`, {
        mobile,
        password,
      })
      .pipe(tap((res) => this.setSession(res.token, res.user)));
  }

  register(data: { mobile: string; password: string; otp: string; referralCode?: string; name?: string }) {
    return this.http
      .post<{ success: boolean; token: string; user: User }>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap((res) => this.setSession(res.token, res.user)));
  }

  validateReferral(code: string) {
    return this.http.get<{ success: boolean; referral: { code: string; referrerName: string; bonus: number } }>(
      `${environment.apiUrl}/auth/referral/${code}`
    );
  }

  fetchProfile(): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(`${environment.apiUrl}/auth/profile`).pipe(
      tap((res) => {
        this.userSubject.next(res.user);
        localStorage.setItem('bigfun_user', JSON.stringify(res.user));
      })
    );
  }

  updateProfile(data: {
    name?: string;
    upiId?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
  }) {
    return this.http.put<{ success: boolean; message: string; user: User }>(`${environment.apiUrl}/auth/profile`, data).pipe(
      tap((res) => {
        this.userSubject.next(res.user);
        localStorage.setItem('bigfun_user', JSON.stringify(res.user));
      })
    );
  }

  logout(): Observable<{ success: boolean; message: string }> {
    if (!this.isLoggedIn()) {
      this.clearSession();
      return of({ success: true, message: 'Logged out' });
    }

    return this.http
      .post<{ success: boolean; message: string }>(`${environment.apiUrl}/auth/logout`, {})
      .pipe(
        catchError(() => of({ success: true, message: 'Logged out locally' })),
        tap(() => this.clearSession())
      );
  }

  updateUser(user: User): void {
    this.userSubject.next(user);
    localStorage.setItem('bigfun_user', JSON.stringify(user));
  }

  updateWalletBalances(data: {
    balance: number;
    bonusBalance: number;
    totalBalance: number;
    income?: number;
  }): void {
    const user = this.getUser();
    if (!user) {
      return;
    }

    this.updateUser({
      ...user,
      balance: data.balance,
      bonusBalance: data.bonusBalance,
      totalBalance: data.totalBalance,
      income: data.income ?? user.income,
    });
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem('bigfun_token', token);
    localStorage.setItem('bigfun_user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem('bigfun_token');
    localStorage.removeItem('bigfun_user');
    this.userSubject.next(null);
  }
}
