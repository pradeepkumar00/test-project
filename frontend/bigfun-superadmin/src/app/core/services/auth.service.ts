import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Admin } from '../models';

const TOKEN_KEY = 'bigfun_superadmin_token';
const ADMIN_KEY = 'bigfun_superadmin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private adminSubject = new BehaviorSubject<Admin | null>(this.loadAdmin());
  admin$ = this.adminSubject.asObservable();

  private loadAdmin(): Admin | null {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getAdmin(): Admin | null {
    return this.adminSubject.value;
  }

  isSuperAdmin(): boolean {
    return this.adminSubject.value?.role === 'superadmin';
  }

  /** Superadmin portal always has full access. */
  hasPermission(_permission?: string): boolean {
    return this.isSuperAdmin();
  }

  login(mobile: string, password: string) {
    return this.http
      .post<{ success: boolean; token: string; admin: Admin }>(`${environment.apiUrl}/auth/login`, {
        mobile,
        password,
      })
      .pipe(
        map((res) => {
          if (res.admin?.role !== 'superadmin') {
            throw { error: { message: 'Superadmin access only' } };
          }
          return res;
        }),
        tap((res) => this.setSession(res.token, res.admin)),
        catchError((err) => throwError(() => err))
      );
  }

  fetchProfile(): Observable<{ success: boolean; admin: Admin }> {
    return this.http.get<{ success: boolean; admin: Admin }>(`${environment.apiUrl}/auth/profile`).pipe(
      tap((res) => {
        if (res.admin?.role !== 'superadmin') {
          this.clearSession();
          return;
        }
        this.adminSubject.next(res.admin);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin));
      }),
      catchError((err) => {
        if (err.status === 401 || err.status === 403) this.clearSession();
        return throwError(() => err);
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
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    this.adminSubject.next(admin);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    this.adminSubject.next(null);
  }
}
