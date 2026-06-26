import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppSettings } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private cache: AppSettings | null = null;

  getSettings(): Observable<{ success: boolean; settings: AppSettings }> {
    if (this.cache) {
      return new Observable((subscriber) => {
        subscriber.next({ success: true, settings: this.cache! });
        subscriber.complete();
      });
    }

    return this.http
      .get<{ success: boolean; settings: AppSettings }>(`${environment.apiUrl}/settings`)
      .pipe(tap((response) => {
        this.cache = response.settings;
      }));
  }

  clearCache(): void {
    this.cache = null;
  }
}
