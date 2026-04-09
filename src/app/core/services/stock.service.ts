import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';

export interface Stock {
  symbol:        string;
  name:          string;
  price:         number;
  change:        number;
  changePercent: number;
  market:        string;
}

@Injectable({ providedIn: 'root' })
export class StockService extends BaseHttpService {
  getStocks(search?: string, market?: string): Observable<Stock[]> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    if (market && market !== 'ALL') params['market'] = market;
    return this.get<Stock[]>('/stocks', params);
  }
}
