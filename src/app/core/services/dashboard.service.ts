import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';

export interface Stat     { label: string; value: string; icon: string; color: string; }
export interface Activity { icon: string;  text: string;  time: string; color: string; }

@Injectable({ providedIn: 'root' })
export class DashboardService extends BaseHttpService {
  getStats(): Observable<Stat[]> {
    return this.get<Stat[]>('/dashboard/stats');
  }

  getActivity(): Observable<Activity[]> {
    return this.get<Activity[]>('/dashboard/activity');
  }
}
