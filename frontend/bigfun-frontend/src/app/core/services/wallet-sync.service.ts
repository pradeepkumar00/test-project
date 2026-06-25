import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, firstValueFrom, Subscription, interval } from 'rxjs';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut, Auth } from 'firebase/auth';
import { getDatabase, ref, onValue, off, Database } from 'firebase/database';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { WalletSyncPayload } from '../models/firebase.model';

const POLL_INTERVAL_MS = environment.walletPollIntervalMs ?? 5000;

@Injectable({ providedIn: 'root' })
export class WalletSyncService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
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

      if (environment.firebase?.enabled) {
        await this.startFirebase(normalizedUserId);
        this.mode = 'firebase';
      } else {
        this.startPolling();
        this.mode = 'poll';
        await this.refreshBalance('initial');
      }
    } catch (error) {
      console.warn('[WalletSync] Firebase unavailable, falling back to polling:', error);
      this.startPolling();
      this.mode = 'poll';
      await this.refreshBalance('initial');
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

  private normalizeUserId(userId: string | number | { toString(): string }): string {
    return String(userId).trim();
  }

  private async startFirebase(userId: string): Promise<void> {
    const firebase = environment.firebase;
    if (!firebase?.enabled) {
      throw new Error('Firebase is not enabled');
    }

    this.ensureFirebaseApp(firebase);
    await this.signIn();
    this.listen(userId);
  }

  private startPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(POLL_INTERVAL_MS).subscribe(() => {
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

  private ensureFirebaseApp(firebase: NonNullable<typeof environment.firebase>) {
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
