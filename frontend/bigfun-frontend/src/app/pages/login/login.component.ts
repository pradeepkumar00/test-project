import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-logo">
        <span>🎮</span>
        <h1>BIGFUN</h1>
        <p>Login to play & win</p>
      </div>

      @if (error) { <div class="alert error">{{ error }}</div> }

      <div class="form-group">
        <label>Mobile Number</label>
        <input type="tel" maxlength="10" [(ngModel)]="mobile" placeholder="10-digit mobile" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" [(ngModel)]="password" placeholder="Enter password" (keyup.enter)="login()" />
      </div>

      <button class="btn btn-gold btn-block" [disabled]="loading" (click)="login()">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>

      <p class="auth-link">
        Don't have an account?
        <a [routerLink]="['/register']" [queryParams]="referCode ? { refer: referCode } : {}">Register</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      padding: 40px 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .auth-logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .auth-logo span { font-size: 48px; }
    .auth-logo h1 { font-size: 32px; font-weight: 800; margin: 8px 0; }
    .auth-logo p { color: var(--text-muted); }
    .auth-link {
      text-align: center;
      margin-top: 20px;
      color: var(--text-muted);
      font-size: 14px;
    }
  `],
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mobile = '';
  password = '';
  loading = false;
  error = '';
  referCode = '';

  ngOnInit() {
    this.referCode = this.route.snapshot.queryParamMap.get('refer') || '';
    if (this.referCode) {
      this.router.navigate(['/register'], { queryParams: { refer: this.referCode } });
    }
  }

  login() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.mobile, this.password).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e) => {
        this.error = e.error?.message || 'Login failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
