import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Stat     { label: string; value: string; icon: string; color: string; }
interface Activity { icon: string;  text: string;  time: string; color: string; }
interface Stock {
  symbol:        string;
  name:          string;
  price:         number;
  change:        number;
  changePercent: number;
  market:        string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  username     = this.authService.getUser();
  stats        = signal<Stat[]>([]);
  activity     = signal<Activity[]>([]);
  allStocks    = signal<Stock[]>([]);
  stocksLoading = signal(true);
  stocksError  = signal('');

  searchTerm   = '';
  marketFilter = 'ALL';

  filteredStocks = computed(() => {
    const term   = this.searchTerm.toLowerCase();
    const market = this.marketFilter;
    return this.allStocks().filter(s => {
      const matchesMarket = market === 'ALL' || s.market === market;
      const matchesSearch = !term || s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term);
      return matchesMarket && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.http.get<Stat[]>(`${environment.apiUrl}/dashboard/stats`).subscribe(data => this.stats.set(data));
    this.http.get<Activity[]>(`${environment.apiUrl}/dashboard/activity`).subscribe(data => this.activity.set(data));
    this.loadStocks();
  }

  loadStocks(): void {
    this.stocksLoading.set(true);
    this.stocksError.set('');
    this.http.get<Stock[]>(`${environment.apiUrl}/stocks`).subscribe({
      next:  data => { this.allStocks.set(data); this.stocksLoading.set(false); },
      error: ()   => { this.stocksError.set('Failed to load stocks.'); this.stocksLoading.set(false); },
    });
  }

  onSearch(value: string): void    { this.searchTerm = value; }
  onMarket(value: string): void    { this.marketFilter = value; }
  absChange(n: number): string     { return Math.abs(n).toFixed(2); }
  absPercent(n: number): string    { return Math.abs(n).toFixed(2); }
  formatPrice(n: number): string   { return n.toFixed(2); }
}
