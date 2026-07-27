import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-shell">
      <header class="topbar">
        <img src="/assets/brand/masti-ludo-sticker.png" alt="Masti Ludo" class="topbar-logo" />
      </header>

      <main class="login-main">
        <div class="login-card">
          <img
            src="/assets/brand/masti-ludo-sticker.png"
            alt="Masti Ludo"
            class="sticker"
          />

          @if (error) {
            <div class="alert error">{{ error }}</div>
          }
          @if (message) {
            <div class="alert success">{{ message }}</div>
          }

          @if (step === 'mobile') {
            <div class="field">
              <label>Mobile (+91)</label>
              <input
                type="tel"
                maxlength="10"
                inputmode="numeric"
                [(ngModel)]="mobile"
                placeholder="Enter mobile number"
                (keyup.enter)="sendOtp()"
              />
            </div>

            <div class="referral-section">
              @if (!showReferral) {
                <button type="button" class="referral-toggle" (click)="showReferral = true">
                  Have a referral code?
                </button>
              } @else {
                <div class="field referral-field">
                  <label>Referral Code</label>
                  <input
                    type="text"
                    [(ngModel)]="referralCode"
                    placeholder="Enter referral code"
                    maxlength="20"
                  />
                  <button type="button" class="referral-hide" (click)="hideReferral()">
                    Hide
                  </button>
                </div>
              }
            </div>

            <button class="send-btn" [disabled]="loading" (click)="sendOtp()">
              {{ loading ? 'Sending...' : 'Send Otp' }}
            </button>
          } @else {
            <div class="field">
              <label>Mobile (+91)</label>
              <div class="mobile-readonly">{{ mobile }}</div>
            </div>

            <div class="field">
              <label>Enter OTP</label>
              <input
                type="tel"
                maxlength="6"
                inputmode="numeric"
                [(ngModel)]="otp"
                placeholder="6-digit OTP"
                (keyup.enter)="verifyOtp()"
              />
            </div>

            <button class="send-btn" [disabled]="loading" (click)="verifyOtp()">
              {{ loading ? 'Verifying...' : 'Verify & Login' }}
            </button>

            <div class="otp-actions">
              <button type="button" class="link-btn" (click)="changeNumber()">Change number</button>
              <button type="button" class="link-btn" [disabled]="otpSending" (click)="resendOtp()">
                {{ otpSending ? 'Sending...' : 'Resend OTP' }}
              </button>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background:
        linear-gradient(135deg, rgba(13, 84, 72, 0.4) 0%, transparent 42%),
        linear-gradient(315deg, rgba(8, 54, 48, 0.5) 0%, transparent 48%),
        #000000;
      color: #fff;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      padding-top: calc(10px + env(safe-area-inset-top, 0px));
      background: #000;
      border-bottom: 1px solid rgba(250, 204, 21, 0.25);
    }

    .topbar-logo {
      height: 36px;
      width: auto;
      object-fit: contain;
    }

    .referral-section {
      margin: -8px 0 18px;
      text-align: left;
    }

    .referral-toggle {
      background: none;
      border: none;
      color: #facc15;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .referral-field {
      position: relative;
      margin-bottom: 0;
    }

    .referral-hide {
      position: absolute;
      right: 0;
      top: 0;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.45);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }

    .login-main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px 16px 40px;
    }

    .login-card {
      width: 100%;
      max-width: 360px;
      background: linear-gradient(180deg, #111111 0%, #000000 100%);
      border: 1px solid rgba(250, 204, 21, 0.3);
      border-radius: 18px;
      padding: 22px 20px 28px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
      text-align: center;
    }

    .sticker {
      width: min(100%, 280px);
      height: auto;
      margin: 4px auto 22px;
      display: block;
      filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.45));
    }

    .field {
      text-align: left;
      margin-bottom: 22px;
    }

    .field label {
      display: block;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #f3f4f6;
    }

    .field input {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 2px solid rgba(255, 255, 255, 0.92);
      border-radius: 0;
      padding: 8px 2px 10px;
      color: #fff;
      font-size: 17px;
      outline: none;
      box-shadow: none;
    }

    .field input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    .field input:focus {
      border-bottom-color: #facc15;
      box-shadow: none;
    }

    .mobile-readonly {
      border-bottom: 2px solid rgba(255, 255, 255, 0.35);
      padding: 8px 2px 10px;
      font-size: 17px;
      color: rgba(255, 255, 255, 0.8);
    }

    .send-btn {
      width: 100%;
      border: none;
      border-radius: 999px;
      padding: 14px 18px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 45%, #38bdf8 100%);
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
    }

    .send-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .otp-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 16px;
    }

    .link-btn {
      background: none;
      border: none;
      color: #facc15;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }

    .link-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .alert {
      text-align: left;
      margin-bottom: 14px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 13px;
    }

    .alert.error {
      background: rgba(244, 63, 94, 0.15);
      color: #fda4af;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }

    .alert.success {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    @media (min-width: 768px) {
      .login-card {
        max-width: 400px;
        padding: 28px 28px 34px;
      }
      .sticker {
        width: 300px;
      }
    }
  `],
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  step: 'mobile' | 'otp' = 'mobile';
  mobile = '';
  otp = '';
  referralCode = '';
  showReferral = false;
  loading = false;
  otpSending = false;
  error = '';
  message = '';

  ngOnInit() {
    const refer = this.route.snapshot.queryParamMap.get('refer') || '';
    if (refer) {
      this.referralCode = refer;
      this.showReferral = true;
    }
  }

  hideReferral() {
    this.showReferral = false;
    this.referralCode = '';
  }

  sendOtp() {
    this.error = '';
    this.message = '';

    if (!/^[6-9]\d{9}$/.test(this.mobile)) {
      this.error = 'Enter a valid 10-digit mobile number';
      return;
    }

    this.loading = true;
    this.auth.sendOtp(this.mobile, 'login').subscribe({
      next: (res) => {
        this.message = res.message;
        this.step = 'otp';
        this.loading = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to send OTP';
        this.loading = false;
      },
    });
  }

  resendOtp() {
    this.error = '';
    this.message = '';
    this.otpSending = true;
    this.auth.sendOtp(this.mobile, 'login').subscribe({
      next: (res) => {
        this.message = res.message;
        this.otpSending = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to resend OTP';
        this.otpSending = false;
      },
    });
  }

  changeNumber() {
    this.step = 'mobile';
    this.otp = '';
    this.error = '';
    this.message = '';
  }

  verifyOtp() {
    this.error = '';
    this.message = '';

    if (!/^\d{6}$/.test(this.otp)) {
      this.error = 'Enter the 6-digit OTP';
      return;
    }

    this.loading = true;
    this.auth.loginWithOtp(this.mobile, this.otp, this.referralCode || undefined).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e) => {
        this.error = e.error?.message || 'OTP verification failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
