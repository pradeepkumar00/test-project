import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card card">
        <div class="logo">
          <div class="brand-mark">S</div>
          <h1>Superadmin Portal</h1>
          <p>Masti Ludo — manage admins &amp; platform access</p>
        </div>
        @if (error) { <div class="alert error">{{ error }}</div> }
        <div class="form-group">
          <label>Mobile Number</label>
          <input type="tel" maxlength="10" [(ngModel)]="mobile" placeholder="10-digit mobile" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" [(ngModel)]="password" placeholder="Password" (keyup.enter)="login()" />
        </div>
        <button class="btn btn-primary" style="width:100%" [disabled]="loading" (click)="login()">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
        <p class="note">Staff admins must use the Admin portal (port 5201).</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 36px;
      box-shadow: 0 16px 48px rgba(245, 158, 11, 0.12);
    }
    @media (max-width: 480px) {
      .login-card { padding: 24px 18px; }
      .logo h1 { font-size: 22px; }
    }
    .logo { text-align: center; margin-bottom: 28px; }
    .brand-mark {
      width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 14px;
      background: linear-gradient(135deg, #f59e0b, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: 900; color: #fff;
    }
    .logo h1 { font-size: 24px; font-weight: 800; margin-bottom: 6px; color: #fbbf24; }
    .logo p { color: var(--text-muted); font-size: 14px; }
    .note { margin-top: 16px; text-align: center; color: var(--text-muted); font-size: 12px; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  mobile = '';
  password = '';
  loading = false;
  error = '';

  login() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.mobile, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error = e.error?.message || 'Login failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
