import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, ReferralService } from '../../core/services/wallet.service';
import { SettingsService } from '../../core/services/settings.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page profile-page">
      @if (user) {
        <div class="profile-card">
          <div class="avatar-wrap">
            <div class="avatar">{{ initials }}</div>
            <span class="online"></span>
          </div>
          <div class="info">
            <div class="name-row">
              <h2>{{ user.name || 'Player' }}</h2>
              <button type="button" class="edit-btn" (click)="startEdit()" aria-label="Edit">✎</button>
            </div>
            <span class="elite">👑 ELITE PLAYER</span>
            <p class="phone">+91 {{ user.mobile }}</p>
          </div>
        </div>

        <div class="vip-bar">👑 VIP — Keep Playing & Win Exclusive Rewards</div>

        @if (!user.kycVerified) {
          <div class="kyc-cta">
            <div>
              <strong>Complete KYC</strong>
              <small>Complete KYC to Secure Your Account</small>
            </div>
            <button type="button" class="kyc-btn" (click)="openKyc()">Complete KYC</button>
          </div>
        } @else {
          <div class="kyc-ok">✓ KYC Verified</div>
        }

        <div class="stats">
          <div class="stat blue">
            <span class="ico">🏆</span>
            <small>WON</small>
            <strong>{{ stats.battlesWon }}</strong>
          </div>
          <div class="stat red">
            <span class="ico">💔</span>
            <small>LOST</small>
            <strong>{{ stats.battlesLost }}</strong>
          </div>
          <div class="stat purple">
            <span class="ico">🎮</span>
            <small>PLAYED</small>
            <strong>{{ stats.battlesPlayed }}</strong>
          </div>
          <div class="stat green">
            <span class="ico">🎁</span>
            <small>REFERRAL EARN</small>
            <strong>₹{{ stats.referralEarnings }}</strong>
          </div>
          <div class="stat teal">
            <span class="ico">💰</span>
            <small>MONEY WON</small>
            <strong>₹{{ stats.moneyWon }}</strong>
          </div>
          <div class="stat orange">
            <span class="ico">📉</span>
            <small>MONEY LOST</small>
            <strong>₹{{ stats.moneyLost }}</strong>
          </div>
        </div>

        @if (editMode) {
          <div class="edit-panel">
            <h3>Edit Profile</h3>
            <div class="form-group">
              <label>Full Name</label>
              <input [(ngModel)]="editName" />
            </div>
            <div class="form-group">
              <label>UPI ID</label>
              <input [(ngModel)]="editUpiId" placeholder="yourname@upi" />
            </div>
            <div class="form-group">
              <label>Account Holder</label>
              <input [(ngModel)]="editAccountHolder" />
            </div>
            <div class="form-group">
              <label>Bank Name</label>
              <input [(ngModel)]="editBankName" />
            </div>
            <div class="form-group">
              <label>Account Number</label>
              <input [(ngModel)]="editAccountNumber" />
            </div>
            <div class="form-group">
              <label>IFSC</label>
              <input [(ngModel)]="editIfsc" />
            </div>
            <div class="edit-actions">
              <button type="button" class="ghost" (click)="cancelEdit()">Cancel</button>
              <button type="button" class="save" [disabled]="saving" (click)="saveProfile()">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        }

        <h3 class="qa-title">QUICK ACTIONS</h3>
        <div class="actions">
          @if (!user.kycVerified) {
            <button type="button" class="action" (click)="openKyc()">
              <span>🛡️</span> Complete KYC <i>›</i>
            </button>
          }
          <a class="action" routerLink="/history">
            <span>🕐</span> History <i>›</i>
          </a>
          <a class="action" routerLink="/support">
            <span>🎧</span> Customer Support <i>›</i>
          </a>
          <button type="button" class="action" (click)="openWhatsApp()">
            <span>💬</span> Help & Live Chat <i>›</i>
          </button>
          <a class="action" routerLink="/wallet">
            <span>💳</span> My Wallet <i>›</i>
          </a>
          <a class="action" routerLink="/refer">
            <span>🎁</span> Refer & Earn <i>›</i>
          </a>
          <button type="button" class="action danger" (click)="logout()">
            <span>🚪</span> Logout <i>›</i>
          </button>
        </div>
      }

      @if (error) { <div class="alert error">{{ error }}</div> }
      @if (message) { <div class="alert success">{{ message }}</div> }

      @if (kycOpen) {
        <div class="modal-backdrop" (click)="closeKyc()"></div>
        <div class="kyc-modal" role="dialog" aria-modal="true">
          <button type="button" class="modal-close" (click)="closeKyc()">✕</button>
          <div class="modal-head">
            <div class="phone-ico">📱</div>
            <div>
              <small>INSTANT VERIFY</small>
              <h2>INSTANT AADHAAR VERIFY</h2>
              <p>OTP on linked mobile — no uploads</p>
            </div>
          </div>

          <div class="steps">
            <span class="step" [class.active]="kycStep === 1">🔏 Aadhaar</span>
            <span class="line"></span>
            <span class="step" [class.active]="kycStep === 2">🔑 OTP</span>
          </div>

          <div class="info-box">
            ⚡ <strong>Live OTP verification</strong>
            <span>Instant approval — no document upload needed.</span>
          </div>

          @if (kycStep === 1) {
            <label class="field-label">AADHAAR NUMBER</label>
            <input
              class="aadhaar-input"
              type="tel"
              maxlength="12"
              inputmode="numeric"
              [(ngModel)]="aadhaarNumber"
              placeholder="12-digit Aadhaar"
            />
            <p class="field-help">
              OTP goes to the mobile number linked with your Aadhaar.
              @if (aadhaarMaskedMobile) {
                <span> Destination: {{ aadhaarMaskedMobile }}</span>
              }
            </p>
            <button type="button" class="send-otp" [disabled]="kycBusy" (click)="sendAadhaarOtp()">
              📱 {{ kycBusy ? 'Sending...' : 'Send Aadhaar OTP' }}
            </button>
          } @else {
            <label class="field-label">ENTER OTP</label>
            <input
              class="aadhaar-input"
              type="tel"
              maxlength="6"
              inputmode="numeric"
              [(ngModel)]="kycOtp"
              placeholder="6-digit OTP"
            />
            <p class="field-help">Enter the OTP sent to your Aadhaar-linked mobile.</p>
            <button type="button" class="send-otp" [disabled]="kycBusy" (click)="verifyAadhaarOtp()">
              {{ kycBusy ? 'Verifying...' : 'Verify & Submit KYC' }}
            </button>
            <button type="button" class="back-link" (click)="kycStep = 1">← Change Aadhaar</button>
          }

          @if (kycError) { <div class="alert error">{{ kycError }}</div> }
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page { padding-top: 4px; }

    .profile-card {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 12px;
    }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 800; color: #fff;
      border: 2px solid rgba(250,204,21,0.6);
      box-shadow: 0 0 16px rgba(236,72,153,0.35);
    }
    .online {
      position: absolute; right: 2px; bottom: 2px;
      width: 14px; height: 14px; border-radius: 50%;
      background: #22c55e; border: 2px solid #0a0614;
    }
    .info { flex: 1; min-width: 0; }
    .name-row { display: flex; align-items: center; gap: 8px; }
    .name-row h2 { font-size: 22px; font-weight: 800; color: #fff; }
    .edit-btn {
      width: 32px; height: 32px; border: none; border-radius: 10px;
      background: linear-gradient(135deg, #f472b6, #fb923c);
      color: #fff; cursor: pointer; font-size: 14px;
    }
    .elite {
      display: inline-block; margin-top: 4px;
      font-size: 11px; font-weight: 800; color: #facc15;
      letter-spacing: 0.04em;
    }
    .phone { color: #c4b5fd; font-size: 13px; margin-top: 4px; }

    .vip-bar {
      background: linear-gradient(90deg, #6d28d9, #9333ea);
      color: #fff; font-size: 12px; font-weight: 700;
      padding: 10px 14px; border-radius: 12px; margin-bottom: 12px;
    }

    .kyc-cta {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      background: rgba(251,146,60,0.12);
      border: 1px solid rgba(251,146,60,0.4);
      border-radius: 14px; padding: 14px; margin-bottom: 14px;
    }
    .kyc-cta strong { display: block; color: #fdba74; margin-bottom: 2px; }
    .kyc-cta small { color: #e5e5e5; font-size: 12px; }
    .kyc-btn {
      border: none; border-radius: 999px; padding: 10px 14px;
      background: linear-gradient(90deg, #fb923c, #ec4899);
      color: #fff; font-weight: 800; font-size: 12px; cursor: pointer;
      white-space: nowrap; font-family: inherit;
    }
    .kyc-ok {
      background: rgba(34,197,94,0.15); color: #86efac;
      border-radius: 12px; padding: 12px; margin-bottom: 14px; font-weight: 700;
    }

    .stats {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;
    }
    .stat {
      border-radius: 14px; padding: 12px 8px; text-align: center;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .stat.blue { background: rgba(37,99,235,0.2); }
    .stat.purple { background: rgba(124,58,237,0.2); }
    .stat.green { background: rgba(34,197,94,0.15); }
    .stat.red { background: rgba(239,68,68,0.15); }
    .stat.teal { background: rgba(20,184,166,0.15); }
    .stat.orange { background: rgba(249,115,22,0.15); }
    .stat .ico { display: block; font-size: 18px; margin-bottom: 4px; }
    .stat small { display: block; font-size: 9px; letter-spacing: 0.04em; color: #94a3b8; margin-bottom: 4px; font-weight: 700; }
    .stat strong { font-size: 15px; color: #fff; }

    .qa-title {
      font-size: 11px; letter-spacing: 0.08em; color: #94a3b8;
      margin: 8px 0 10px; font-weight: 800;
    }
    .actions {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(168,85,247,0.25);
      border-radius: 14px; overflow: hidden; margin-bottom: 12px;
    }
    .action {
      width: 100%; display: flex; align-items: center; gap: 10px;
      padding: 14px; border: none; border-bottom: 1px solid rgba(255,255,255,0.06);
      background: transparent; color: #fff; font-size: 14px; font-weight: 700;
      text-decoration: none; cursor: pointer; font-family: inherit; text-align: left;
    }
    .action:last-child { border-bottom: none; }
    .action i { margin-left: auto; color: #94a3b8; font-style: normal; }
    .action.danger { color: #f87171; }

    .edit-panel {
      background: #12081f; border: 1px solid rgba(34,211,238,0.25);
      border-radius: 14px; padding: 14px; margin-bottom: 14px;
    }
    .edit-panel h3 { margin-bottom: 10px; }
    .form-group { margin-bottom: 10px; }
    .form-group label { display: block; font-size: 12px; color: #c4b5fd; margin-bottom: 4px; }
    .form-group input, .aadhaar-input {
      width: 100%; padding: 11px 12px; border-radius: 10px;
      border: 1px solid rgba(34,211,238,0.35); background: #0a0614; color: #fff;
      font-family: inherit;
    }
    .edit-actions { display: flex; gap: 8px; }
    .edit-actions button {
      flex: 1; padding: 11px; border-radius: 10px; border: none;
      font-weight: 800; cursor: pointer; font-family: inherit;
    }
    .ghost { background: transparent; border: 1px solid rgba(255,255,255,0.2) !important; color: #fff; }
    .save { background: linear-gradient(90deg, #22d3ee, #a855f7); color: #041016; }

    .hist {
      background: rgba(255,255,255,0.04); border-radius: 10px;
      padding: 10px 12px; margin-bottom: 6px; font-size: 13px;
    }
    .empty-hist { color: #94a3b8; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 400;
    }
    .kyc-modal {
      position: fixed; left: 12px; right: 12px; top: 50%; transform: translateY(-50%);
      z-index: 410; max-height: 88vh; overflow: auto;
      background: #0b1228;
      border: 1.5px solid #38bdf8;
      box-shadow: 0 0 28px rgba(56,189,248,0.35);
      border-radius: 18px; padding: 18px 16px 20px;
    }
    .modal-close {
      position: absolute; top: 12px; right: 12px;
      width: 32px; height: 32px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.25); background: transparent;
      color: #fff; cursor: pointer;
    }
    .modal-head { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px; padding-right: 28px; }
    .phone-ico {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(56,189,248,0.15); display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    .modal-head small { color: #38bdf8; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; }
    .modal-head h2 { font-size: 20px; font-weight: 800; margin: 2px 0 4px; color: #fff; }
    .modal-head p { color: #94a3b8; font-size: 12px; }

    .steps {
      display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
    }
    .step {
      font-size: 12px; font-weight: 700; color: #94a3b8;
      padding: 6px 10px; border-radius: 999px;
    }
    .step.active {
      background: rgba(56,189,248,0.15); color: #67e8f9;
      border: 1px solid rgba(56,189,248,0.5);
      box-shadow: 0 0 12px rgba(56,189,248,0.25);
    }
    .line { flex: 1; height: 2px; background: rgba(56,189,248,0.35); }

    .info-box {
      display: flex; flex-direction: column; gap: 2px;
      border: 1px solid rgba(56,189,248,0.4);
      border-radius: 12px; padding: 12px; margin-bottom: 14px;
      color: #e2e8f0; font-size: 12px; background: rgba(56,189,248,0.08);
    }
    .info-box strong { color: #67e8f9; }

    .field-label {
      display: block; font-size: 11px; font-weight: 800; letter-spacing: 0.06em;
      color: #38bdf8; margin-bottom: 6px;
    }
    .aadhaar-input { margin-bottom: 6px; }
    .field-help { color: #94a3b8; font-size: 12px; margin-bottom: 12px; }
    .send-otp {
      width: 100%; border: none; border-radius: 999px; padding: 14px;
      background: linear-gradient(90deg, #fb923c, #ec4899);
      color: #fff; font-size: 15px; font-weight: 800;
      cursor: pointer; font-family: inherit;
    }
    .send-otp:disabled { opacity: 0.6; cursor: not-allowed; }
    .back-link {
      display: block; width: 100%; margin-top: 10px; background: none; border: none;
      color: #67e8f9; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
    }

    .alert { padding: 10px 12px; border-radius: 10px; margin-top: 10px; font-size: 13px; }
    .alert.error { background: rgba(239,68,68,0.15); color: #fda4af; }
    .alert.success { background: rgba(34,197,94,0.15); color: #86efac; }
  `],
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private referralService = inject(ReferralService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  user: User | null = null;
  editMode = false;
  saving = false;
  editName = '';
  editUpiId = '';
  editAccountHolder = '';
  editAccountNumber = '';
  editIfsc = '';
  editBankName = '';
  aadhaarNumber = '';
  aadhaarMaskedMobile = '';
  kycOtp = '';
  kycOpen = false;
  kycStep: 1 | 2 = 1;
  kycBusy = false;
  kycError = '';
  totalReferrals = 0;
  stats = {
    battlesWon: 0,
    battlesLost: 0,
    battlesPlayed: 0,
    referralEarnings: 0,
    moneyWon: 0,
    moneyLost: 0,
  };
  supportWhatsApp = '';
  error = '';
  message = '';

  get initials(): string {
    const name = this.user?.name?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'P';
    }
    return (this.user?.mobile || 'P').slice(-2);
  }

  ngOnInit() {
    this.auth.user$.subscribe((u) => {
      this.user = u;
      if (u) {
        this.stats.referralEarnings = u.referralEarnings || this.stats.referralEarnings;
        this.totalReferrals = u.referralCount || this.totalReferrals;
      }
    });
    this.auth.fetchProfile().subscribe();
    this.profileService.getStats().subscribe({
      next: (r) => {
        const p = r.profile as User;
        if (p) {
          this.user = { ...this.auth.getUser(), ...p } as User;
          this.auth.updateUser(this.user);
          this.stats = {
            battlesWon: p.gamesWon || 0,
            battlesLost: p.gamesLost || 0,
            battlesPlayed: p.gamesPlayed || 0,
            referralEarnings: p.referralEarnings || 0,
            moneyWon: p.totalWon || 0,
            moneyLost: p.totalLost || 0,
          };
          this.totalReferrals = p.referralCount || 0;
        }
      },
    });
    this.referralService.getReferralInfo().subscribe({
      next: (r) => {
        this.totalReferrals = r.referral.totalReferrals || 0;
        this.stats.referralEarnings = r.referral.totalEarnings || this.stats.referralEarnings;
      },
    });
    this.settingsService.getSettings().subscribe({
      next: (r) => (this.supportWhatsApp = r.settings.supportWhatsApp || ''),
    });

    this.route.queryParamMap.subscribe((params) => {
      if (params.get('kyc') === '1') {
        const openWhenReady = () => {
          if (this.user && !this.user.kycVerified) this.openKyc();
        };
        if (this.user) openWhenReady();
        else setTimeout(openWhenReady, 300);
        void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      }
    });
  }

  openKyc() {
    this.kycOpen = true;
    this.kycStep = 1;
    this.kycError = '';
    this.kycOtp = '';
    this.aadhaarMaskedMobile = '';
  }

  closeKyc() {
    this.kycOpen = false;
    this.kycBusy = false;
    this.kycError = '';
  }

  sendAadhaarOtp() {
    this.kycError = '';
    if (!/^\d{12}$/.test(this.aadhaarNumber.trim())) {
      this.kycError = 'Enter a valid 12-digit Aadhaar number';
      return;
    }
    this.kycBusy = true;
    this.profileService.sendAadhaarOtp(this.aadhaarNumber.trim()).subscribe({
      next: (r) => {
        this.kycBusy = false;
        this.kycStep = 2;
        this.aadhaarMaskedMobile = r.maskedMobile || '';
        this.message = '';
      },
      error: (e) => {
        this.kycBusy = false;
        this.kycError = e.error?.message || 'Failed to send Aadhaar OTP';
      },
    });
  }

  verifyAadhaarOtp() {
    this.kycError = '';
    if (!/^\d{6}$/.test(this.kycOtp.trim())) {
      this.kycError = 'Enter the 6-digit OTP';
      return;
    }
    this.kycBusy = true;
    this.profileService.verifyAadhaarOtp(this.kycOtp.trim()).subscribe({
      next: (r) => {
        this.kycBusy = false;
        this.closeKyc();
        this.message = r.message || 'Aadhaar verified successfully';
        this.auth.fetchProfile().subscribe();
      },
      error: (e) => {
        this.kycBusy = false;
        this.kycError = e.error?.message || 'KYC verification failed';
      },
    });
  }

  startEdit() {
    if (!this.user) return;
    this.editName = this.user.name || '';
    this.editUpiId = this.user.bankDetails?.upiId || '';
    this.editAccountHolder = this.user.bankDetails?.accountHolder || '';
    this.editAccountNumber = this.user.bankDetails?.accountNumber || '';
    this.editIfsc = this.user.bankDetails?.ifsc || '';
    this.editBankName = this.user.bankDetails?.bankName || '';
    this.editMode = true;
    this.error = '';
    this.message = '';
  }

  cancelEdit() {
    this.editMode = false;
    this.error = '';
  }

  saveProfile() {
    this.error = '';
    this.message = '';
    this.saving = true;
    this.auth
      .updateProfile({
        name: this.editName.trim(),
        upiId: this.editUpiId.trim(),
        accountHolder: this.editAccountHolder.trim(),
        accountNumber: this.editAccountNumber.trim(),
        ifsc: this.editIfsc.trim(),
        bankName: this.editBankName.trim(),
      })
      .subscribe({
        next: (r) => {
          this.user = r.user;
          this.message = r.message;
          this.editMode = false;
          this.saving = false;
        },
        error: (e) => {
          this.error = e.error?.message || 'Failed to update profile';
          this.saving = false;
        },
      });
  }

  openWhatsApp() {
    const open = (raw: string) => {
      const number = (raw || '').replace(/\D/g, '');
      if (!number) {
        alert('WhatsApp support number is not configured. Set it in Admin → Settings.');
        return;
      }
      window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer');
    };

    if (this.supportWhatsApp) {
      open(this.supportWhatsApp);
      return;
    }

    this.settingsService.getSettings().subscribe({
      next: (r) => {
        this.supportWhatsApp = r.settings.supportWhatsApp || '';
        open(this.supportWhatsApp);
      },
      error: () => alert('Unable to load WhatsApp support number.'),
    });
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
