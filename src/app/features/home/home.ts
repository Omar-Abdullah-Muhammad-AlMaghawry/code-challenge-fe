import { Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { StockService, Stock } from '../../core/services/stock.service';
import { DashboardService, Stat, Activity } from '../../core/services/dashboard.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private authService      = inject(AuthService);
  private stockService     = inject(StockService);
  private dashboardService = inject(DashboardService);

  username = this.authService.getUser();

  stats        = signal<Stat[]>([]);
  activity     = signal<Activity[]>([]);
  allStocks    = signal<Stock[]>([]);
  stocksLoading = signal(true);
  stocksError  = signal('');

  // Signals so computed() reacts to changes
  searchTerm   = signal('');
  marketFilter = signal('ALL');

  filteredStocks = computed(() => {
    const term   = this.searchTerm().toLowerCase();
    const market = this.marketFilter();
    return this.allStocks().filter(s => {
      const matchesMarket = market === 'ALL' || s.market === market;
      const matchesSearch = !term || s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term);
      return matchesMarket && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe(data => this.stats.set(data));
    this.dashboardService.getActivity().subscribe(data => this.activity.set(data));
    this.loadStocks();
  }

  loadStocks(): void {
    this.stocksLoading.set(true);
    this.stocksError.set('');
    this.stockService.getStocks().subscribe({
      next:  data => { this.allStocks.set(data); this.stocksLoading.set(false); },
      error: ()   => { this.stocksError.set('STOCKS.ERROR'); this.stocksLoading.set(false); },
    });
  }

  formatPrice(n: number):   string { return n.toFixed(2); }
  absChange(n: number):     string { return Math.abs(n).toFixed(2); }
  absPercent(n: number):    string { return Math.abs(n).toFixed(2); }
}
