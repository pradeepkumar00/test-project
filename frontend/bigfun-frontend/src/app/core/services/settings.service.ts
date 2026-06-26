import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AppSettings } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);

  getSettings() {
    return this.http.get<{ success: boolean; settings: AppSettings }>(`${environment.apiUrl}/settings`);
  }
}
