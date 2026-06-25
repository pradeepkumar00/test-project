import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Admin } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private adminSubject = new BehaviorSubject<Admin | null>(this.loadAdmin());
  admin$ = this.adminSubject.asObservable();

  private loadAdmin(): Admin | null {
    const raw = localStorage.getItem('bigfun_admin');
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('bigfun_admin_token');
  }

  getToken(): string | null {
    return localStorage.getItem('bigfun_admin_token');
  }

  getAdmin(): Admin | null {
    return this.adminSubject.value;
  }

  isSuperAdmin(): boolean {
    return this.adminSubject.value?.role === 'superadmin';
  }

  login(mobile: string, password: string) {
    return this.http
      .post<{ success: boolean; token: string; admin: Admin }>(`${environment.apiUrl}/auth/login`, {
        mobile,
        password,
      })
      .pipe(tap((res) => this.setSession(res.token, res.admin)));
  }

  fetchProfile(): Observable<{ success: boolean; admin: Admin }> {
    return this.http.get<{ success: boolean; admin: Admin }>(`${environment.apiUrl}/auth/profile`).pipe(
      tap((res) => {
        this.adminSubject.next(res.admin);
        localStorage.setItem('bigfun_admin', JSON.stringify(res.admin));
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

  private setSession(token: string, admin: Admin): void {
    localStorage.setItem('bigfun_admin_token', token);
    localStorage.setItem('bigfun_admin', JSON.stringify(admin));
    this.adminSubject.next(admin);
  }

  private clearSession(): void {
    localStorage.removeItem('bigfun_admin_token');
    localStorage.removeItem('bigfun_admin');
    this.adminSubject.next(null);
  }
}
