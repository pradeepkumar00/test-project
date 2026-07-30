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

            <button class="send-btn whatsapp-btn" [disabled]="loading" (click)="sendOtp()">
              <span class="wa-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </span>
              {{ loading ? 'Sending on WhatsApp...' : 'Send OTP on WhatsApp' }}
            </button>
          } @else {
            <div class="field">
              <label>Mobile (+91)</label>
              <div class="mobile-readonly">{{ mobile }}</div>
            </div>

            <div class="field">
              <label>Enter WhatsApp OTP</label>
              <input
                type="tel"
                maxlength="6"
                inputmode="numeric"
                [(ngModel)]="otp"
                placeholder="6-digit OTP"
                (keyup.enter)="verifyOtp()"
              />
            </div>

            <p class="otp-hint">Check WhatsApp on +91 {{ mobile }} for your code.</p>

            <button class="send-btn whatsapp-btn" [disabled]="loading" (click)="verifyOtp()">
              {{ loading ? 'Verifying...' : 'Verify & Login' }}
            </button>

            <div class="otp-actions">
              <button type="button" class="link-btn" (click)="changeNumber()">Change number</button>
              <button type="button" class="link-btn" [disabled]="otpSending" (click)="resendOtp()">
                {{ otpSending ? 'Sending...' : 'Resend on WhatsApp' }}
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
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      background: transparent;
      color: #fff;
    }

    .topbar { display: none; }

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
      width: 100%;
      max-width: 420px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-card {
      width: 100%;
      max-width: 380px;
      background:
        linear-gradient(165deg, rgba(18, 10, 36, 0.92), rgba(6, 3, 18, 0.96)) padding-box,
        linear-gradient(135deg, #22d3ee, #a855f7, #ec4899, #f59e0b) border-box;
      border: 1px solid transparent;
      border-radius: 24px;
      padding: 28px 22px 32px;
      box-shadow:
        0 25px 70px rgba(0, 0, 0, 0.55),
        0 0 50px rgba(168, 85, 247, 0.2);
      text-align: center;
      backdrop-filter: blur(12px);
    }

    .sticker {
      width: min(100%, 200px);
      height: auto;
      margin: 0 auto 18px;
      display: block;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.45));
    }

    .field {
      text-align: left;
      margin-bottom: 18px;
    }

    .field label {
      display: block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 8px;
      color: #facc15;
    }

    .field input {
      width: 100%;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 12px;
      padding: 14px 14px;
      color: #fff;
      font-size: 16px;
      outline: none;
      box-shadow: none;
    }

    .field input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    .field input:focus {
      border-color: #22d3ee;
      box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2);
    }

    .mobile-readonly {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(168, 85, 247, 0.25);
      border-radius: 12px;
      padding: 14px;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.8);
    }

    .send-btn {
      width: 100%;
      border: none;
      border-radius: 999px;
      padding: 14px 18px;
      margin-top: 8px;
      font-size: 16px;
      font-weight: 800;
      color: #fff;
      cursor: pointer;
      background: linear-gradient(90deg, #f97316 0%, #ec4899 55%, #a855f7 100%);
      box-shadow: 0 10px 28px rgba(236, 72, 153, 0.35);
    }

    .send-btn.whatsapp-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(90deg, #128C7E 0%, #25D366 100%);
      box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
    }

    .wa-icon {
      display: inline-flex;
      align-items: center;
    }

    .otp-hint {
      margin: -4px 0 12px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.65);
      text-align: center;
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
        this.error = e.error?.message || 'Failed to send WhatsApp OTP';
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
        this.error = e.error?.message || 'Failed to resend WhatsApp OTP';
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
