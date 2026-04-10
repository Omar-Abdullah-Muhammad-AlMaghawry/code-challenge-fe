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
  // Real intraday stats from Finnhub quote (0 for EGX static data)
  open:          number;
  dayHigh:       number;
  dayLow:        number;
  prevClose:     number;
}

export interface HistoryPoint {
  timestamp: number; // Unix seconds
  price:     number;
}

@Injectable({ providedIn: 'root' })
export class StockService extends BaseHttpService {
  getStocks(search?: string, market?: string): Observable<Stock[]> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    if (market && market !== 'ALL') params['market'] = market;
    return this.get<Stock[]>('/stocks', params);
  }

  getHistory(symbol: string, period: string): Observable<HistoryPoint[]> {
    return this.get<HistoryPoint[]>(`/stocks/${symbol}/history`, { period });
  }
}
