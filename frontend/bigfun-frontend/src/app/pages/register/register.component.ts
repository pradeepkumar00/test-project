import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-logo">
        <span>🎮</span>
        <h1>Register</h1>
        @if (referralBonus) {
          <p class="refer-bonus">Referral bonus: ₹{{ referralBonus }}</p>
        }
      </div>

      @if (error) { <div class="alert error">{{ error }}</div> }
      @if (message) { <div class="alert success">{{ message }}</div> }

      <div class="form-group">
        <label>Mobile Number</label>
        <input type="tel" maxlength="10" [(ngModel)]="mobile" placeholder="10-digit mobile" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" [(ngModel)]="password" placeholder="Min 6 characters" />
      </div>
      <div class="form-group">
        <label>OTP</label>
        <div class="otp-row">
          <input type="text" maxlength="6" [(ngModel)]="otp" placeholder="6-digit OTP" />
          <button class="btn btn-outline" [disabled]="otpSending" (click)="sendOtp()">
            {{ otpSending ? '...' : 'Send OTP' }}
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>Referral Code (optional)</label>
        <input type="text" [(ngModel)]="referralCode" placeholder="Referral code" />
      </div>
      <div class="form-group">
        <label>Name (optional)</label>
        <input type="text" [(ngModel)]="name" placeholder="Your name" />
      </div>

      <button class="btn btn-gold btn-block" [disabled]="loading" (click)="register()">
        {{ loading ? 'Registering...' : 'Register' }}
      </button>

      <p class="auth-link">Already have account? <a routerLink="/login">Login</a></p>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      padding: 40px var(--page-padding);
      max-width: 480px;
      margin: 0 auto;
      width: 100%;
    }
    .auth-logo {
      text-align: center; margin-bottom: 28px;
      span { font-size: 52px; }
      h1 { font-size: 32px; margin: 10px 0; font-weight: 800; }
    }
    .refer-bonus { color: var(--gold); font-size: 15px; }
    .otp-row { display: flex; gap: 10px; input { flex: 1; } button { white-space: nowrap; } }
    .auth-link { text-align: center; margin-top: 24px; color: var(--text-muted); font-size: 15px; }
    @media (max-width: 768px) {
      .auth-page {
        padding: 24px var(--page-padding);
        padding-top: calc(24px + env(safe-area-inset-top, 0px));
      }
      .auth-logo span { font-size: 44px; }
      .auth-logo h1 { font-size: 28px; }
      .otp-row {
        flex-direction: column;
        button { width: 100%; }
      }
    }
  `],
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mobile = '';
  password = '';
  otp = '';
  referralCode = '';
  name = '';
  referralBonus = 0;
  loading = false;
  otpSending = false;
  error = '';
  message = '';

  ngOnInit() {
    const refer = this.route.snapshot.queryParamMap.get('refer');
    if (refer) {
      this.referralCode = refer;
      this.auth.validateReferral(refer).subscribe({
        next: (res) => (this.referralBonus = res.referral.bonus),
      });
    }
  }

  sendOtp() {
    if (this.mobile.length !== 10) {
      this.error = 'Enter valid 10-digit mobile';
      return;
    }
    this.error = '';
    this.otpSending = true;
    this.auth.sendOtp(this.mobile, 'register').subscribe({
      next: (res) => {
        this.message = res.message + ' (check server console in dev)';
        this.otpSending = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to send OTP';
        this.otpSending = false;
      },
    });
  }

  register() {
    this.error = '';
    this.loading = true;
    this.auth
      .register({
        mobile: this.mobile,
        password: this.password,
        otp: this.otp,
        referralCode: this.referralCode || undefined,
        name: this.name || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: (e) => {
          this.error = e.error?.message || 'Registration failed';
          this.loading = false;
        },
        complete: () => (this.loading = false),
      });
  }
}
