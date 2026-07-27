import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Battle, HomeData, LeaderboardPlayer } from '../models';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);

  getHome() {
    return this.http.get<{ success: boolean; home: HomeData }>(`${environment.apiUrl}/home`);
  }
}

@Injectable({ providedIn: 'root' })
export class BattleService {
  private http = inject(HttpClient);

  previewPrize(entryFee: number) {
    return this.http.get<{ success: boolean; winningPrize: number; totalPool: number; platformFee: number }>(
      `${environment.apiUrl}/battles/prize-preview`,
      { params: { entryFee: entryFee.toString() } }
    );
  }

  createBattle(entryFee: number, gameType = 'ludo-classic', challengedUserId?: string) {
    const body: { entryFee: number; gameType: string; challengedUserId?: string } = {
      entryFee,
      gameType,
    };
    if (challengedUserId) body.challengedUserId = challengedUserId;
    return this.http.post<{
      success: boolean;
      battle: Battle;
      balance: number;
      bonusBalance?: number;
      totalBalance?: number;
      message: string;
    }>(`${environment.apiUrl}/battles`, body);
  }

  getOpenBattles() {
    return this.http.get<{ success: boolean; battles: Battle[] }>(`${environment.apiUrl}/battles/open`);
  }

  getRunningBattles() {
    return this.http.get<{ success: boolean; battles: Battle[] }>(`${environment.apiUrl}/battles/running`);
  }

  getChallenges(gameType?: string) {
    const params = gameType ? { gameType } : undefined;
    return this.http.get<{ success: boolean; battles: Battle[] }>(
      `${environment.apiUrl}/battles/challenges`,
      { params }
    );
  }

  getLeaderboard(limit = 50) {
    return this.http.get<{ success: boolean; leaderboard: LeaderboardPlayer[] }>(
      `${environment.apiUrl}/battles/leaderboard`,
      { params: { limit: limit.toString() } }
    );
  }

  joinBattle(id: string) {
    return this.http.post<{
      success: boolean;
      battle: Battle;
      message: string;
      balance?: number;
      bonusBalance?: number;
      totalBalance?: number;
    }>(`${environment.apiUrl}/battles/${id}/join`, {});
  }

  getMyBattles() {
    return this.http.get<{ success: boolean; battles: Battle[] }>(`${environment.apiUrl}/battles/my`);
  }
}
