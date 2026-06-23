import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

  logout(): void {
    localStorage.removeItem('bigfun_token');
    localStorage.removeItem('bigfun_user');
    this.userSubject.next(null);
  }

  updateUser(user: User): void {
    this.userSubject.next(user);
    localStorage.setItem('bigfun_user', JSON.stringify(user));
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem('bigfun_token', token);
    localStorage.setItem('bigfun_user', JSON.stringify(user));
    this.userSubject.next(user);
  }
}
