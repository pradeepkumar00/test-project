import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HomeService, BattleService } from '../../core/services/battle.service';
import { AuthService } from '../../core/services/auth.service';
import { Battle } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, BottomNavComponent],
  template: `
    <app-header />
    <div class="page">
      <div class="welcome-banner">
        <span>Welcome 🤗</span>
      </div>

      @if (kycPending) {
        <div class="kyc-banner card">
          <div>
            <strong>Complete Your KYC</strong>
            <p>Verify your account to unlock all features</p>
          </div>
          <a routerLink="/profile" class="btn btn-gold btn-sm">Complete Now</a>
        </div>
      }

      <div class="section-title">Create a Battle</div>
      <div class="create-battle card">
        <input type="number" [(ngModel)]="entryFee" (ngModelChange)="onEntryFeeChange()" placeholder="Enter Coin" min="10" />
        @if (previewPrize) {
          <p class="preview">Winning Prize: ₹{{ previewPrize | number:'1.0-0' }}</p>
        }
        <button class="btn btn-gold btn-block" [disabled]="creating" (click)="createBattle()">
          {{ creating ? 'Creating...' : 'SET' }}
        </button>
        @if (battleMsg) { <div class="alert" [class.success]="battleSuccess" [class.error]="!battleSuccess">{{ battleMsg }}</div> }
      </div>

      <div class="section-title">Open Battles</div>
      @if (loadingOpen) { <div class="spinner">Loading...</div> }
      @else if (!openBattles.length) { <p class="empty">No open battles</p> }
      @for (b of openBattles; track b.id) {
        <div class="battle-card card">
          <p class="challenge">Challenge From {{ b.creator?.name || b.creator?.mobile }}</p>
          <div class="battle-row">
            <div>
              <span class="lbl">Entry Fee</span>
              <span class="amt">💵 {{ b.entryFee }}</span>
            </div>
            <button class="btn btn-gold" [disabled]="joiningId === b.id" (click)="joinBattle(b.id)">
              {{ joiningId === b.id ? '...' : 'Play' }}
            </button>
            <div class="right">
              <span class="lbl">Winning Prize</span>
              <span class="amt win">💵 {{ b.winningPrize }}</span>
            </div>
          </div>
        </div>
      }

      <div class="section-title">Running Battles</div>
      @if (loadingRunning) { <div class="spinner">Loading...</div> }
      @else if (!runningBattles.length) { <p class="empty">No running battles</p> }
      @for (b of runningBattles; track b.id) {
        <div class="battle-card running card">
          <p class="challenge">
            Game Play between {{ b.creator?.name || b.creator?.mobile }} & {{ b.joiner?.name || b.joiner?.mobile }}
          </p>
          <div class="battle-row">
            <div>
              <span class="lbl">Entry Fee</span>
              <span class="amt">💵 {{ b.entryFee }}</span>
            </div>
            <span class="vs">VS</span>
            <div class="right">
              <span class="lbl">Winning Prize</span>
              <span class="amt win">💵 {{ b.winningPrize }}</span>
            </div>
          </div>
        </div>
      }

      <div class="section-title">All Tournaments</div>
      <div class="tournaments">
        @for (t of tournaments; track t.slug) {
          <div class="tournament-card card">
            <span class="badge" [class.live]="t.status === 'live'">{{ t.status === 'live' ? 'Live' : 'Coming Soon' }}</span>
            <h3>{{ t.name }}</h3>
            @if (t.status === 'live') {
              <button class="btn btn-gold btn-block" (click)="entryFee = 100">PLAY NOW</button>
            }
          </div>
        }
      </div>
    </div>
    <app-bottom-nav />
  `,
  styles: [`
    .welcome-banner {
      background: var(--gold);
      color: #000;
      padding: 20px;
      border-radius: 14px;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .kyc-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    .kyc-banner p { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    }
    .btn-sm { padding: 8px 14px; font-size: 13px; white-space: nowrap; }
    .create-battle { margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; }
    .preview { color: var(--gold); font-size: 13px; }
    .battle-card { margin-bottom: 12px; }
    .battle-card.running { border-color: var(--gold); }
    .challenge { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
    .battle-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .lbl { display: block; font-size: 10px; color: var(--text-muted); }
    .amt { font-weight: 700; font-size: 16px; }
    .amt.win { color: var(--success); }
    .vs { font-weight: 800; color: var(--gold); font-size: 18px; }
    .right { text-align: right; }
    .empty { color: var(--text-muted); font-size: 14px; margin-bottom: 16px; }
    .tournament-card { position: relative; text-align: center; }
    .tournament-card h3 { font-size: 13px; margin: 12px 0; }
    .badge {
      position: absolute; top: 8px; right: 8px;
      font-size: 10px; padding: 2px 8px; border-radius: 10px;
      background: #555; color: #fff;
    }
    .badge.live { background: var(--gold); color: #000; }
  `],
})
export class HomeComponent implements OnInit {
  private homeService = inject(HomeService);
  private battleService = inject(BattleService);
  private auth = inject(AuthService);

  entryFee = 100;
  previewPrize: number | null = null;
  openBattles: Battle[] = [];
  runningBattles: Battle[] = [];
  tournaments: { slug: string; name: string; status: string }[] = [];
  kycPending = false;
  loadingOpen = true;
  loadingRunning = true;
  creating = false;
  joiningId = '';
  battleMsg = '';
  battleSuccess = false;

  ngOnInit() {
    this.loadHome();
    this.loadBattles();
    this.onEntryFeeChange();
    setInterval(() => this.loadBattles(), 15000);
  }

  onEntryFeeChange() {
    if (this.entryFee > 0) {
      this.battleService.previewPrize(this.entryFee).subscribe({
        next: (r) => (this.previewPrize = r.winningPrize),
      });
    }
  }

  loadHome() {
    this.homeService.getHome().subscribe({
      next: (res) => {
        this.tournaments = res.home.tournaments;
        this.kycPending = res.home.kyc.status !== 'verified';
        const u = this.auth.getUser();
        if (u) {
          u.totalBalance = res.home.walletBalance;
          u.income = res.home.income;
          this.auth.updateUser(u);
        }
      },
    });
  }

  loadBattles() {
    this.battleService.getOpenBattles().subscribe({
      next: (r) => { this.openBattles = r.battles; this.loadingOpen = false; },
      error: () => (this.loadingOpen = false),
    });
    this.battleService.getRunningBattles().subscribe({
      next: (r) => { this.runningBattles = r.battles; this.loadingRunning = false; },
      error: () => (this.loadingRunning = false),
    });
  }

  createBattle() {
    this.creating = true;
    this.battleMsg = '';
    this.battleService.createBattle(this.entryFee).subscribe({
      next: (r) => {
        this.battleSuccess = true;
        this.battleMsg = r.message;
        this.auth.fetchProfile().subscribe();
        this.loadBattles();
        this.creating = false;
      },
      error: (e) => {
        this.battleSuccess = false;
        this.battleMsg = e.error?.message || 'Failed';
        this.creating = false;
      },
    });
  }

  joinBattle(id: string) {
    this.joiningId = id;
    this.battleService.joinBattle(id).subscribe({
      next: () => {
        this.auth.fetchProfile().subscribe();
        this.loadBattles();
        this.joiningId = '';
      },
      error: (e) => {
        alert(e.error?.message || 'Failed to join');
        this.joiningId = '';
      },
    });
  }
}
