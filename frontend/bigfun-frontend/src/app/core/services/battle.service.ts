import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Battle, HomeData } from '../models';

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

  createBattle(entryFee: number, gameType = 'ludo-classic') {
    return this.http.post<{ success: boolean; battle: Battle; balance: number; message: string }>(
      `${environment.apiUrl}/battles`,
      { entryFee, gameType }
    );
  }

  getOpenBattles() {
    return this.http.get<{ success: boolean; battles: Battle[] }>(`${environment.apiUrl}/battles/open`);
  }

  getRunningBattles() {
    return this.http.get<{ success: boolean; battles: Battle[] }>(`${environment.apiUrl}/battles/running`);
  }

  joinBattle(id: string) {
    return this.http.post<{ success: boolean; battle: Battle; message: string }>(
      `${environment.apiUrl}/battles/${id}/join`,
      {}
    );
  }

  getMyBattles() {
    return this.http.get<{ success: boolean; battles: Battle[] }>(`${environment.apiUrl}/battles/my`);
  }
}
