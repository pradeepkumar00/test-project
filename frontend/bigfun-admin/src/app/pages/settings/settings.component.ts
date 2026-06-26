import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin.service';
import { formatMethodSelection, getPaymentMethodLogo } from '../../core/constants/payment-methods';
import { CurrencyOption, PlatformSettings } from '../../core/models';

type SettingsForm = Omit<
  PlatformSettings,
  'currencySymbol' | 'updatedAt' | 'minEntryFee' | 'maxEntryFee' | 'minDeposit' | 'minWithdraw' | 'referralBonus'
> & {
  minEntryFee: number | null;
  maxEntryFee: number | null;
  minDeposit: number | null;
  minWithdraw: number | null;
  referralBonus: number | null;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Platform Settings</h1>
        <p class="subtitle">Update payment and platform config without redeploying</p>
      </div>
    </div>

    @if (loading) {
      <div class="spinner">Loading settings...</div>
    } @else {
      <form class="settings-form card" (ngSubmit)="save()">
        <section>
          <h2>UPI &amp; Payments</h2>
          <div class="form-grid">
            <label>
              <span>UPI ID</span>
              <input
                [(ngModel)]="form.upiId"
                name="upiId"
                required
                placeholder="name@bank"
                [class.input-error]="fieldErrors['upiId']"
              />
              @if (fieldErrors['upiId']) {
                <small class="field-error">{{ fieldErrors['upiId'] }}</small>
              }
            </label>
            <label>
              <span>UPI Payee Name</span>
              <input
                [(ngModel)]="form.upiPayeeName"
                name="upiPayeeName"
                required
                [class.input-error]="fieldErrors['upiPayeeName']"
              />
              @if (fieldErrors['upiPayeeName']) {
                <small class="field-error">{{ fieldErrors['upiPayeeName'] }}</small>
              }
            </label>
            <label>
              <span>Payment Label</span>
              <input
                [(ngModel)]="form.paymentLabel"
                name="paymentLabel"
                required
                [class.input-error]="fieldErrors['paymentLabel']"
              />
              @if (fieldErrors['paymentLabel']) {
                <small class="field-error">{{ fieldErrors['paymentLabel'] }}</small>
              }
            </label>
            <label>
              <span>Support Email</span>
              <input
                [(ngModel)]="form.supportEmail"
                name="supportEmail"
                type="email"
                required
                [class.input-error]="fieldErrors['supportEmail']"
              />
              @if (fieldErrors['supportEmail']) {
                <small class="field-error">{{ fieldErrors['supportEmail'] }}</small>
              }
            </label>
          </div>
        </section>

        <section>
          <h2>Wallet Limits</h2>
          <div class="form-grid">
            <label>
              <span>Minimum Deposit</span>
              <input
                [(ngModel)]="form.minDeposit"
                name="minDeposit"
                type="number"
                min="1"
                step="1"
                required
                [class.input-error]="fieldErrors['minDeposit']"
              />
              @if (fieldErrors['minDeposit']) {
                <small class="field-error">{{ fieldErrors['minDeposit'] }}</small>
              }
            </label>
            <label>
              <span>Minimum Withdrawal</span>
              <input
                [(ngModel)]="form.minWithdraw"
                name="minWithdraw"
                type="number"
                min="1"
                step="1"
                required
                [class.input-error]="fieldErrors['minWithdraw']"
              />
              @if (fieldErrors['minWithdraw']) {
                <small class="field-error">{{ fieldErrors['minWithdraw'] }}</small>
              }
            </label>
            <label>
              <span>Referral Bonus</span>
              <input
                [(ngModel)]="form.referralBonus"
                name="referralBonus"
                type="number"
                min="0"
                step="1"
                required
                [class.input-error]="fieldErrors['referralBonus']"
              />
              @if (fieldErrors['referralBonus']) {
                <small class="field-error">{{ fieldErrors['referralBonus'] }}</small>
              }
            </label>
          </div>
        </section>

        <section>
          <h2>Battle Entry Fees</h2>
          <div class="form-grid">
            <label>
              <span>Minimum Entry Fee</span>
              <input
                [(ngModel)]="form.minEntryFee"
                name="minEntryFee"
                type="number"
                min="1"
                step="1"
                required
                [class.input-error]="fieldErrors['minEntryFee']"
              />
              @if (fieldErrors['minEntryFee']) {
                <small class="field-error">{{ fieldErrors['minEntryFee'] }}</small>
              }
            </label>
            <label>
              <span>Maximum Entry Fee</span>
              <input
                [(ngModel)]="form.maxEntryFee"
                name="maxEntryFee"
                type="number"
                min="1"
                step="1"
                required
                [class.input-error]="fieldErrors['maxEntryFee']"
              />
              @if (fieldErrors['maxEntryFee']) {
                <small class="field-error">{{ fieldErrors['maxEntryFee'] }}</small>
              }
            </label>
            <label>
              <span>Currency</span>
              <select [(ngModel)]="form.currency" name="currency" required>
                @for (c of currencies; track c.code) {
                  <option [value]="c.code">{{ c.code }} ({{ c.symbol }})</option>
                }
              </select>
            </label>
          </div>
        </section>

        <section>
          <h2>Payment &amp; Withdrawal Methods</h2>
          <p class="hint">Choose methods shown to users. Styling matches the currency dropdown.</p>
          <div class="form-grid">
            <label class="select-field" [class.has-error]="fieldErrors['paymentMethods']">
              <span>Payment Methods</span>
              <div class="styled-select" [class.open]="paymentDropdownOpen">
                <button
                  type="button"
                  class="select-control"
                  (click)="togglePaymentDropdown($event)"
                  [attr.aria-expanded]="paymentDropdownOpen"
                >
                  @if (form.paymentMethods.length === 1) {
                    <img [src]="methodLogo(form.paymentMethods[0])" [alt]="form.paymentMethods[0]" class="method-logo" />
                    <span class="select-value">{{ form.paymentMethods[0] }}</span>
                  } @else {
                    <span class="select-value">{{ paymentMethodsLabel }}</span>
                  }
                  <span class="chevron">▾</span>
                </button>
                @if (paymentDropdownOpen) {
                  <div class="select-panel" (click)="$event.stopPropagation()">
                    @for (m of paymentMethodOptions; track m) {
                      <button
                        type="button"
                        class="select-item"
                        [class.selected]="isPaymentSelected(m)"
                        (click)="togglePaymentMethod(m)"
                      >
                        <img [src]="methodLogo(m)" [alt]="m" class="method-logo" />
                        <span>{{ m }}</span>
                        @if (isPaymentSelected(m)) {
                          <span class="check">✓</span>
                        }
                      </button>
                    }
                  </div>
                }
              </div>
              @if (form.paymentMethods.length > 1) {
                <div class="selected-chips">
                  @for (m of form.paymentMethods; track m) {
                    <span class="chip">
                      <img [src]="methodLogo(m)" [alt]="m" class="chip-logo" />
                      {{ m }}
                    </span>
                  }
                </div>
              }
            </label>
            @if (fieldErrors['paymentMethods']) {
              <small class="field-error block-error">{{ fieldErrors['paymentMethods'] }}</small>
            }

            <label class="select-field" [class.has-error]="fieldErrors['withdrawMethods']">
              <span>Withdrawal Methods</span>
              <div class="styled-select" [class.open]="withdrawDropdownOpen">
                <button
                  type="button"
                  class="select-control"
                  (click)="toggleWithdrawDropdown($event)"
                  [attr.aria-expanded]="withdrawDropdownOpen"
                >
                  @if (form.withdrawMethods.length === 1) {
                    <img [src]="methodLogo(form.withdrawMethods[0])" [alt]="form.withdrawMethods[0]" class="method-logo" />
                    <span class="select-value">{{ form.withdrawMethods[0] }}</span>
                  } @else {
                    <span class="select-value">{{ withdrawMethodsLabel }}</span>
                  }
                  <span class="chevron">▾</span>
                </button>
                @if (withdrawDropdownOpen) {
                  <div class="select-panel" (click)="$event.stopPropagation()">
                    @for (m of withdrawMethodOptions; track m) {
                      <button
                        type="button"
                        class="select-item"
                        [class.selected]="isWithdrawSelected(m)"
                        (click)="toggleWithdrawMethod(m)"
                      >
                        <img [src]="methodLogo(m)" [alt]="m" class="method-logo" />
                        <span>{{ m }}</span>
                        @if (isWithdrawSelected(m)) {
                          <span class="check">✓</span>
                        }
                      </button>
                    }
                  </div>
                }
              </div>
              @if (form.withdrawMethods.length > 1) {
                <div class="selected-chips">
                  @for (m of form.withdrawMethods; track m) {
                    <span class="chip">
                      <img [src]="methodLogo(m)" [alt]="m" class="chip-logo" />
                      {{ m }}
                    </span>
                  }
                </div>
              }
            </label>
            @if (fieldErrors['withdrawMethods']) {
              <small class="field-error block-error">{{ fieldErrors['withdrawMethods'] }}</small>
            }
          </div>
        </section>

        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }
        @if (success) {
          <div class="alert alert-success">{{ success }}</div>
        }

        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    .subtitle {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }
    .settings-form {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      max-width: 820px;
    }
    section h2 {
      font-size: 16px;
      margin-bottom: 14px;
      color: var(--primary-light);
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    label span,
    .select-field > span {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .hint {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .styled-select {
      position: relative;
    }
    .select-control {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg-input);
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-align: left;
    }
    .styled-select.open .select-control,
    .select-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.25);
    }
    .select-value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chevron {
      color: var(--text-muted);
      font-size: 12px;
      flex-shrink: 0;
    }
    .styled-select.open .chevron {
      transform: rotate(180deg);
    }
    .select-panel {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 20;
      background: var(--bg-card-solid);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      max-height: 260px;
      overflow-y: auto;
      padding: 6px;
    }
    .select-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
    }
    .select-item:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .select-item.selected {
      background: rgba(124, 58, 237, 0.18);
      color: var(--primary-light);
    }
    .select-item .check {
      margin-left: auto;
      color: var(--primary-light);
      font-weight: 700;
    }
    .method-logo,
    .chip-logo {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .selected-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px 4px 6px;
      border-radius: 999px;
      background: rgba(124, 58, 237, 0.2);
      color: var(--primary-light);
      font-size: 12px;
      font-weight: 600;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }
    .alert {
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      font-size: 14px;
    }
    .alert-error {
      background: rgba(244, 63, 94, 0.15);
      color: #fda4af;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .alert-success {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .field-error {
      display: block;
      margin-top: 6px;
      color: #fda4af;
      font-size: 12px;
      line-height: 1.4;
    }
    .block-error {
      margin-top: -8px;
    }
    .input-error,
    .has-error .select-control {
      border-color: #f43f5e;
      box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.2);
    }
  `],
})
export class SettingsComponent implements OnInit {
  private api = inject(AdminApiService);

  loading = true;
  saving = false;
  error = '';
  success = '';
  currencies: CurrencyOption[] = [];
  paymentMethodOptions: string[] = [];
  withdrawMethodOptions: string[] = [];
  paymentDropdownOpen = false;
  withdrawDropdownOpen = false;
  fieldErrors: Record<string, string> = {};

  form: SettingsForm = {
    upiId: '',
    upiPayeeName: '',
    paymentLabel: '',
    minEntryFee: 10,
    maxEntryFee: 100000,
    minDeposit: 100,
    minWithdraw: 110,
    referralBonus: 50,
    currency: 'INR',
    supportEmail: '',
    paymentMethods: [],
    withdrawMethods: [],
  };

  get paymentMethodsLabel(): string {
    return formatMethodSelection(this.form.paymentMethods, 'Select payment methods');
  }

  get withdrawMethodsLabel(): string {
    return formatMethodSelection(this.form.withdrawMethods, 'Select withdrawal methods');
  }

  methodLogo = getPaymentMethodLogo;

  @HostListener('document:click')
  closeDropdowns() {
    this.paymentDropdownOpen = false;
    this.withdrawDropdownOpen = false;
  }

  ngOnInit() {
    this.load();
  }

  togglePaymentDropdown(event: Event) {
    event.stopPropagation();
    this.withdrawDropdownOpen = false;
    this.paymentDropdownOpen = !this.paymentDropdownOpen;
  }

  toggleWithdrawDropdown(event: Event) {
    event.stopPropagation();
    this.paymentDropdownOpen = false;
    this.withdrawDropdownOpen = !this.withdrawDropdownOpen;
  }

  isPaymentSelected(method: string): boolean {
    return this.form.paymentMethods.includes(method);
  }

  isWithdrawSelected(method: string): boolean {
    return this.form.withdrawMethods.includes(method);
  }

  togglePaymentMethod(method: string) {
    if (this.isPaymentSelected(method)) {
      this.form.paymentMethods = this.form.paymentMethods.filter((m) => m !== method);
    } else {
      this.form.paymentMethods = [...this.form.paymentMethods, method];
    }
  }

  toggleWithdrawMethod(method: string) {
    if (this.isWithdrawSelected(method)) {
      this.form.withdrawMethods = this.form.withdrawMethods.filter((m) => m !== method);
    } else {
      this.form.withdrawMethods = [...this.form.withdrawMethods, method];
    }
  }

  load() {
    this.loading = true;
    this.error = '';
    this.api.getPlatformSettings().subscribe({
      next: (res) => {
        const { settings } = res;
        this.currencies = res.currencies;
        this.paymentMethodOptions = res.paymentMethodOptions;
        this.withdrawMethodOptions = res.withdrawMethodOptions;
        this.form = {
          upiId: settings.upiId,
          upiPayeeName: settings.upiPayeeName,
          paymentLabel: settings.paymentLabel,
          minEntryFee: settings.minEntryFee,
          maxEntryFee: settings.maxEntryFee,
          minDeposit: settings.minDeposit,
          minWithdraw: settings.minWithdraw,
          referralBonus: settings.referralBonus,
          currency: settings.currency,
          supportEmail: settings.supportEmail,
          paymentMethods: [...settings.paymentMethods],
          withdrawMethods: [...settings.withdrawMethods],
        };
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load settings';
        this.loading = false;
      },
    });
  }

  save() {
    this.error = '';
    this.success = '';
    this.fieldErrors = {};

    const clientError = this.validateForm();
    if (clientError) {
      this.error = clientError;
      return;
    }

    this.saving = true;

    const payload = {
      ...this.form,
      minEntryFee: this.form.minEntryFee as number,
      maxEntryFee: this.form.maxEntryFee as number,
      minDeposit: this.form.minDeposit as number,
      minWithdraw: this.form.minWithdraw as number,
      referralBonus: this.form.referralBonus as number,
      paymentMethods: [...this.form.paymentMethods],
      withdrawMethods: [...this.form.withdrawMethods],
    };

    this.api.updatePlatformSettings(payload).subscribe({
      next: (res) => {
        this.success = res.message;
        this.form.paymentMethods = res.settings.paymentMethods;
        this.form.withdrawMethods = res.settings.withdrawMethods;
        this.saving = false;
      },
      error: (err) => {
        this.applyApiErrors(err.error);
        this.saving = false;
      },
    });
  }

  private validateForm(): string | null {
    const min = Number(this.form.minEntryFee);
    const max = Number(this.form.maxEntryFee);
    const minDeposit = Number(this.form.minDeposit);
    const minWithdraw = Number(this.form.minWithdraw);
    const referralBonus = Number(this.form.referralBonus);

    if (!this.form.upiId?.trim()) {
      this.fieldErrors['upiId'] = 'UPI ID is required';
    }
    if (!this.form.upiPayeeName?.trim()) {
      this.fieldErrors['upiPayeeName'] = 'UPI payee name is required';
    }
    if (!this.form.paymentLabel?.trim()) {
      this.fieldErrors['paymentLabel'] = 'Payment label is required';
    }
    if (!this.form.supportEmail?.trim()) {
      this.fieldErrors['supportEmail'] = 'Support email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.supportEmail.trim())) {
      this.fieldErrors['supportEmail'] = 'Enter a valid support email address';
    }

    if (this.form.minEntryFee == null) {
      this.fieldErrors['minEntryFee'] = 'Minimum entry fee is required';
    } else if (!Number.isFinite(min)) {
      this.fieldErrors['minEntryFee'] = 'Minimum entry fee must be a valid number';
    } else if (min < 1) {
      this.fieldErrors['minEntryFee'] = 'Minimum entry fee must be at least ₹1';
    }

    if (this.form.maxEntryFee == null) {
      this.fieldErrors['maxEntryFee'] = 'Maximum entry fee is required';
    } else if (!Number.isFinite(max)) {
      this.fieldErrors['maxEntryFee'] = 'Maximum entry fee must be a valid number';
    } else if (max < 1) {
      this.fieldErrors['maxEntryFee'] = 'Maximum entry fee must be at least ₹1';
    } else if (Number.isFinite(min) && max < min) {
      this.fieldErrors['maxEntryFee'] =
        `Maximum entry fee (₹${max}) must be greater than or equal to minimum entry fee (₹${min})`;
    }

    if (this.form.minDeposit == null) {
      this.fieldErrors['minDeposit'] = 'Minimum deposit is required';
    } else if (!Number.isFinite(minDeposit)) {
      this.fieldErrors['minDeposit'] = 'Minimum deposit must be a valid number';
    } else if (minDeposit < 1) {
      this.fieldErrors['minDeposit'] = 'Minimum deposit must be at least ₹1';
    }

    if (this.form.minWithdraw == null) {
      this.fieldErrors['minWithdraw'] = 'Minimum withdrawal is required';
    } else if (!Number.isFinite(minWithdraw)) {
      this.fieldErrors['minWithdraw'] = 'Minimum withdrawal must be a valid number';
    } else if (minWithdraw < 1) {
      this.fieldErrors['minWithdraw'] = 'Minimum withdrawal must be at least ₹1';
    } else if (Number.isFinite(minDeposit) && minWithdraw < minDeposit) {
      this.fieldErrors['minWithdraw'] =
        `Minimum withdrawal (₹${minWithdraw}) must be greater than or equal to minimum deposit (₹${minDeposit})`;
    }

    if (this.form.referralBonus == null) {
      this.fieldErrors['referralBonus'] = 'Referral bonus is required';
    } else if (!Number.isFinite(referralBonus)) {
      this.fieldErrors['referralBonus'] = 'Referral bonus must be a valid number';
    } else if (referralBonus < 0) {
      this.fieldErrors['referralBonus'] = 'Referral bonus cannot be negative';
    }

    if (!this.form.paymentMethods.length) {
      this.fieldErrors['paymentMethods'] = 'Select at least one payment method';
    }
    if (!this.form.withdrawMethods.length) {
      this.fieldErrors['withdrawMethods'] = 'Select at least one withdrawal method';
    }

    const messages = Object.values(this.fieldErrors);
    return messages.length ? messages[0] : null;
  }

  private applyApiErrors(body: { message?: string; errors?: { field: string; message: string }[] } | null) {
    this.fieldErrors = {};
    if (body?.errors?.length) {
      for (const item of body.errors) {
        this.fieldErrors[item.field] = item.message;
      }
      this.error = body.errors.map((item) => item.message).join(' ');
      return;
    }
    this.error = body?.message || 'Failed to save settings';
  }
}
