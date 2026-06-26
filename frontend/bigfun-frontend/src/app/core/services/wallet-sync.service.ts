import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, firstValueFrom, Subscription, interval } from 'rxjs';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut, Auth } from 'firebase/auth';
import { getDatabase, ref, onValue, off, Database } from 'firebase/database';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';
import { RealtimeSyncConfig } from '../models';
import { WalletSyncPayload } from '../models/firebase.model';

@Injectable({ providedIn: 'root' })
export class WalletSyncService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private zone = inject(NgZone);

  private app: FirebaseApp | null = null;
  private firebaseAuth: Auth | null = null;
  private database: Database | null = null;
  private walletRef: ReturnType<typeof ref> | null = null;
  private listener: ((snapshot: import('firebase/database').DataSnapshot) => void) | null = null;
  private pollSub?: Subscription;
  private visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      void this.refreshBalance('visibility');
    }
  };
  private activeUserId: string | null = null;
  private starting = false;
  private lastTotalBalance: number | null = null;
  private mode: 'firebase' | 'poll' | null = null;
  private realtimeConfig: RealtimeSyncConfig | null = null;

  private walletUpdateSubject = new Subject<WalletSyncPayload>();
  walletUpdate$ = this.walletUpdateSubject.asObservable();

  async start(userId: string): Promise<void> {
    const normalizedUserId = this.normalizeUserId(userId);
    if (!normalizedUserId) {
      return;
    }

    if (this.activeUserId === normalizedUserId && this.mode) {
      return;
    }

    if (this.starting) {
      return;
    }

    this.starting = true;

    try {
      await this.stop();
      this.activeUserId = normalizedUserId;
      this.lastTotalBalance = this.authService.getUser()?.totalBalance ?? null;

      const realtime = await this.loadRealtimeConfig();

      if (realtime.firebaseEnabled) {
        if (!realtime.firebase) {
          throw new Error('Firebase is enabled but client config is missing');
        }
        await this.startFirebase(normalizedUserId, realtime.firebase);
        this.mode = 'firebase';
        return;
      }

      if (realtime.walletPollingEnabled && realtime.walletPollIntervalMs > 0) {
        this.startPolling(realtime.walletPollIntervalMs);
        this.mode = 'poll';
        await this.refreshBalance('initial');
        return;
      }

      console.warn('[WalletSync] Realtime sync disabled in server config');
    } catch (error) {
      console.error('[WalletSync] Failed to start wallet sync:', error);
    } finally {
      this.starting = false;
    }
  }

  async stop(): Promise<void> {
    if (this.walletRef && this.listener) {
      off(this.walletRef, 'value', this.listener);
    }

    this.walletRef = null;
    this.listener = null;
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
    document.removeEventListener('visibilitychange', this.visibilityHandler);

    if (this.firebaseAuth) {
      try {
        await signOut(this.firebaseAuth);
      } catch {
        // ignore sign-out errors during cleanup
      }
    }

    this.activeUserId = null;
    this.mode = null;
    this.lastTotalBalance = null;
  }

  getRealtimeConfig(): RealtimeSyncConfig | null {
    return this.realtimeConfig;
  }

  private async loadRealtimeConfig(): Promise<RealtimeSyncConfig> {
    if (this.realtimeConfig) {
      return this.realtimeConfig;
    }

    const response = await firstValueFrom(this.settingsService.getSettings());
    this.realtimeConfig = response.settings.realtime;
    return this.realtimeConfig;
  }

  private normalizeUserId(userId: string | number | { toString(): string }): string {
    return String(userId).trim();
  }

  private async startFirebase(
    userId: string,
    firebase: NonNullable<RealtimeSyncConfig['firebase']>
  ): Promise<void> {
    this.ensureFirebaseApp(firebase);
    await this.signIn();
    this.listen(userId);
  }

  private startPolling(intervalMs: number): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(intervalMs).subscribe(() => {
      void this.refreshBalance('poll');
    });
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private async refreshBalance(source: 'initial' | 'poll' | 'visibility'): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{
          success: boolean;
          walletBalance: number;
          income: number;
          balance: { main: number; bonus: number; total: number };
        }>(`${environment.apiUrl}/wallet/balance`)
      );

      const totalBalance = response.walletBalance ?? response.balance.total;
      const balance = response.balance.main;
      const bonusBalance = response.balance.bonus;
      const income = response.income;
      const changed = this.lastTotalBalance === null || this.lastTotalBalance !== totalBalance;

      if (!changed) {
        return;
      }

      const increased = this.lastTotalBalance !== null && totalBalance > this.lastTotalBalance;
      this.lastTotalBalance = totalBalance;

      this.zone.run(() => {
        this.authService.updateWalletBalances({
          balance,
          bonusBalance,
          totalBalance,
          income,
        });

        this.walletUpdateSubject.next({
          balance,
          bonusBalance,
          totalBalance,
          income,
          reason: increased ? 'deposit_approved' : 'balance_sync',
          updatedAt: Date.now(),
        });
      });
    } catch (error) {
      if (source === 'initial') {
        console.warn('[WalletSync] Failed to refresh wallet balance:', error);
      }
    }
  }

  private ensureFirebaseApp(firebase: NonNullable<RealtimeSyncConfig['firebase']>) {
    if (this.app) {
      return;
    }

    this.app = initializeApp({
      apiKey: firebase.apiKey,
      authDomain: firebase.authDomain,
      databaseURL: firebase.databaseURL,
      projectId: firebase.projectId,
    });
    this.firebaseAuth = getAuth(this.app);
    this.database = getDatabase(this.app);
  }

  private async signIn(): Promise<void> {
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; firebaseToken: string }>(`${environment.apiUrl}/auth/firebase-token`)
    );

    if (!response?.firebaseToken || !this.firebaseAuth) {
      throw new Error('Firebase token unavailable');
    }

    await signInWithCustomToken(this.firebaseAuth, response.firebaseToken);
  }

  private listen(userId: string): void {
    if (!this.database) {
      return;
    }

    this.walletRef = ref(this.database, `wallets/${userId}`);
    this.listener = (snapshot) => {
      const payload = snapshot.val() as WalletSyncPayload | null;
      if (!payload) {
        return;
      }

      const changed =
        this.lastTotalBalance === null || this.lastTotalBalance !== payload.totalBalance;
      if (!changed) {
        return;
      }

      this.lastTotalBalance = payload.totalBalance;

      this.zone.run(() => {
        this.authService.updateWalletBalances({
          balance: payload.balance,
          bonusBalance: payload.bonusBalance,
          totalBalance: payload.totalBalance,
          income: payload.income,
        });
        this.walletUpdateSubject.next(payload);
      });
    };

    onValue(this.walletRef, this.listener);
  }
}
