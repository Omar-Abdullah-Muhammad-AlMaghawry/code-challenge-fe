import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { StockService, Stock } from '../../core/services/stock.service';
import { DashboardService, Stat, Activity } from '../../core/services/dashboard.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { StockDetailModal } from './stock-detail-modal/stock-detail-modal';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnDestroy {
  private authService      = inject(AuthService);
  private stockService     = inject(StockService);
  private dashboardService = inject(DashboardService);
  private dialog           = inject(MatDialog);

  username = this.authService.getUser();

  readonly marketTabs = [
    { value: 'ALL', labelKey: 'STOCKS.FILTER_ALL' },
    { value: 'USA', labelKey: 'STOCKS.FILTER_USA' },
    { value: 'EGX', labelKey: 'STOCKS.FILTER_EGX' },
  ];

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

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe(data => this.stats.set(data));
    this.dashboardService.getActivity().subscribe(data => this.activity.set(data));
    this.loadStocks();
    this.refreshInterval = setInterval(() => this.loadStocks(), 5 * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
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

  openDetail(stock: Stock): void {
    this.dialog.open(StockDetailModal, {
      data: stock,
      panelClass: 'stock-detail-panel',
      maxWidth: '700px',
      width: '90vw',
    });
  }

  // ── Sparkline helpers ──────────────────────────────────────────────────────

  /** SVG line path for the sparkline (M x,y L x,y …). */
  sparklinePath(stock: Stock): string {
    const pts = this.sparklinePoints(stock);
    return 'M ' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');
  }

  /** Closed SVG path for the shaded area under the sparkline. */
  sparklineArea(stock: Stock): string {
    const pts = this.sparklinePoints(stock);
    const last = pts[pts.length - 1];
    const linePart = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');
    return `M ${linePart} L ${last[0].toFixed(1)},30 L 0,30 Z`;
  }

  /** Y-coordinate of the final point (for the endpoint dot). */
  sparklineEndY(stock: Stock): number {
    const pts = this.sparklinePoints(stock);
    return pts[pts.length - 1][1];
  }

  /** Generates 8 deterministic points for a 80×30 viewport. */
  private sparklinePoints(stock: Stock): [number, number][] {
    // Seed from symbol so the same stock always gets the same shape
    const seed = stock.symbol.split('').reduce((s, c, i) => s + c.charCodeAt(0) * (i + 1), 0);
    const rand = (i: number) => (Math.abs(Math.sin(seed * 9301 + i * 49297 + 233995)) % 1);

    const n = 8;
    const W = 80, H = 30, pad = 3;
    const up = stock.changePercent >= 0;
    // Stronger trend for bigger movers (capped at 0.75 of height)
    const strength = Math.min(Math.abs(stock.changePercent) / 8, 0.75);

    return Array.from({ length: n }, (_, i): [number, number] => {
      const t  = i / (n - 1);
      const x  = t * W;
      // Trend: up → y decreases left→right; down → y increases
      const trend  = (up ? (1 - t) : t) * (H - pad * 2) * strength;
      const noise  = rand(i) * (H - pad * 2) * 0.28;
      const y = Math.max(pad, Math.min(H - pad, pad + (H - pad * 2) * 0.2 + trend + noise));
      return [x, y];
    });
  }
}
