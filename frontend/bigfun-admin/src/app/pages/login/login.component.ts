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
          <span>⚙️</span>
          <h1>BIGFUN Admin</h1>
          <p>Sign in to manage the platform</p>
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
        <button class="btn btn-gold" style="width:100%" [disabled]="loading" (click)="login()">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
        <p class="hint">Demo: 9999999999 / admin123</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .login-card { width: 100%; max-width: 400px; padding: 32px; }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo span { font-size: 40px; }
    .logo h1 { font-size: 24px; margin: 8px 0 4px; }
    .logo p { color: var(--text-muted); font-size: 14px; }
    .hint { text-align: center; margin-top: 16px; font-size: 12px; color: var(--text-muted); }
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
