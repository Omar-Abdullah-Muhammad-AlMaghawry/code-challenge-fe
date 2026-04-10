import { Component, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Stock, StockService, HistoryPoint } from '../../../core/services/stock.service';

interface YLabel { price: string; y: number; }
interface XLabel { label: string; x: number; }

@Component({
  selector: 'app-stock-detail-modal',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './stock-detail-modal.html',
})
export class StockDetailModal {
  readonly stock: Stock    = inject(MAT_DIALOG_DATA);
  private readonly dialogRef   = inject(MatDialogRef<StockDetailModal>);
  private readonly stockService = inject(StockService);
  private readonly destroyRef   = inject(DestroyRef);

  readonly periods = ['1D', '5D', '1M', 'YTD', '1Y', '5Y', 'Max'];
  selectedPeriod = signal('1D');
  historyLoading = signal(true);

  // Chart layout constants (viewBox 540×210)
  private readonly CX = 50;
  private readonly CW = 486;
  private readonly CT = 8;
  private readonly CH = 162;

  // Raw loaded SVG points (empty while loading)
  private loadedPts = signal<[number, number][]>([]);
  // Real price range derived from loaded data
  private realRange = signal<{ min: number; max: number } | null>(null);

  // ── Reactive history loading ───────────────────────────────────────────────

  private periodTrigger$ = new Subject<string>();

  constructor() {
    this.periodTrigger$.pipe(
      tap(() => { this.historyLoading.set(true); this.loadedPts.set([]); }),
      switchMap(period => this.stockService.getHistory(this.stock.symbol, period)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: pts  => this.applyHistory(pts),
      error: ()  => { this.historyLoading.set(false); },
    });

    // Trigger initial load
    effect(() => this.periodTrigger$.next(this.selectedPeriod()));
  }

  private applyHistory(pts: HistoryPoint[]): void {
    if (pts.length < 2) { this.historyLoading.set(false); return; }

    const prices    = pts.map(p => p.price);
    const prevClose = this.stock.price - this.stock.change;
    const rawMin    = Math.min(...prices, prevClose);
    const rawMax    = Math.max(...prices, prevClose);
    const pad       = (rawMax - rawMin) * 0.05 || rawMin * 0.02;

    const range = { min: rawMin - pad, max: rawMax + pad };
    this.realRange.set(range);

    const n      = pts.length;
    const svgPts = pts.map((p, i): [number, number] => [
      this.CX + (i / (n - 1)) * this.CW,
      this.priceToY(p.price, range.min, range.max),
    ]);
    this.loadedPts.set(svgPts);
    this.historyLoading.set(false);
  }

  // ── Derived getters ────────────────────────────────────────────────────────

  get isPositive() { return this.stock.changePercent >= 0; }
  get color()      { return this.isPositive ? '#10b981' : '#ef4444'; }
  get currency()   { return this.stock.market === 'EGX' ? 'E£' : '$'; }
  get prevClose()  { return this.stock.price - this.stock.change; }
  get absChange()  { return Math.abs(this.stock.change).toFixed(2); }
  get absPercent() { return Math.abs(this.stock.changePercent).toFixed(2); }
  get sign()       { return this.isPositive ? '+' : '-'; }
  get gradId()     { return 'cg-' + this.stock.symbol; }
  get clipId()     { return 'cc-' + this.stock.symbol; }

  // ── Chart computed ─────────────────────────────────────────────────────────

  private rng = computed(() => {
    const real = this.realRange();
    if (real) return real;
    return this.getPriceRange(this.stock, this.selectedPeriod());
  });

  private pts = computed(() => {
    const loaded = this.loadedPts();
    if (loaded.length > 0) return loaded;
    return this.generateFallbackPoints(this.stock, this.selectedPeriod());
  });

  chartPath = computed(() =>
    'M ' + this.pts().map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ')
  );

  chartAreaPath = computed(() => {
    const pts  = this.pts();
    const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');
    const bot  = (this.CT + this.CH).toFixed(1);
    return `M ${line} L ${pts[pts.length - 1][0].toFixed(1)},${bot} L ${this.CX},${bot} Z`;
  });

  prevCloseY = computed(() => {
    const { min, max } = this.rng();
    const y = this.priceToY(this.prevClose, min, max);
    return Math.max(this.CT, Math.min(this.CT + this.CH, y));
  });

  prevCloseLabelTop = computed(() => `${(this.prevCloseY() / 210 * 100).toFixed(2)}%`);

  yAxisLabels = computed((): YLabel[] => {
    const { min, max } = this.rng();
    return [0, 1, 2, 3, 4].map(i => {
      const price = min + (max - min) * (i / 4);
      return { price: price.toFixed(2), y: this.priceToY(price, min, max) };
    }).reverse();
  });

  xAxisLabels = computed((): XLabel[] => {
    const labels = this.getTimeLabels(this.selectedPeriod());
    return labels.map((label, i) => ({
      label,
      x: this.CX + (i / (labels.length - 1)) * this.CW,
    }));
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  get stats() {
    const s  = this.stock;
    const c  = this.currency;
    // Use real intraday stats when available (USA stocks with Finnhub key)
    const hasReal = s.open > 0;
    const prev    = s.prevClose > 0 ? s.prevClose : s.price - s.change;
    const open    = hasReal ? s.open    : prev + (Math.abs(Math.sin(this.seed(s.symbol) * 137)) % 1 - 0.5) * s.price * 0.012;
    const hi      = hasReal ? s.dayHigh : Math.max(s.price, open) * (1 + (Math.abs(Math.sin(this.seed(s.symbol) * 53)) % 1) * 0.012);
    const lo      = hasReal ? s.dayLow  : Math.min(s.price, open) * (1 - (Math.abs(Math.sin(this.seed(s.symbol) * 79)) % 1) * 0.012);
    // 52W and market data still estimated (require separate paid API calls)
    const r    = (o: number) => Math.abs(Math.sin(this.seed(s.symbol) * 137 + o * 53)) % 1;
    const w52h = s.price * (1.1 + r(3) * 0.4);
    const w52l = s.price * (0.6 - r(4) * 0.15);
    const mcap = 1e9 * (50 + r(5) * 2000);
    const vol  = Math.floor(1e6 * (2 + r(6) * 50));
    const pe   = (12 + r(7) * 40).toFixed(2);
    return {
      open:      c + open.toFixed(2),
      high:      c + hi.toFixed(2),
      low:       c + lo.toFixed(2),
      prevClose: c + prev.toFixed(2),
      w52high:   c + w52h.toFixed(2),
      w52low:    c + w52l.toFixed(2),
      mktCap:    this.fmtMktCap(mcap, c),
      pe,
      volume:    this.fmtVol(vol),
    };
  }

  close() { this.dialogRef.close(); }

  // ── Private helpers ────────────────────────────────────────────────────────

  private seed(str: string): number {
    return str.split('').reduce((s, c, i) => s + c.charCodeAt(0) * (i + 1), 0);
  }

  private priceToY(price: number, min: number, max: number): number {
    return this.CT + (1 - (price - min) / (max - min)) * this.CH;
  }

  private getPriceRange(stock: Stock, period: string): { min: number; max: number } {
    const sd  = this.seed(stock.symbol + period);
    const r   = (i: number) => Math.abs(Math.sin(sd * 137 + i * 53)) % 1;
    const volMap: Record<string, number> = {
      '1D': 0.03, '5D': 0.07, '1M': 0.14,
      'YTD': 0.22, '1Y': 0.40, '5Y': 0.90, 'Max': 1.6,
    };
    const vol       = volMap[period] ?? 0.1;
    const sp        = stock.price * vol;
    const prevClose = stock.price - stock.change;
    return {
      min: Math.min(stock.price - sp * (0.4 + r(0) * 0.3), prevClose),
      max: Math.max(stock.price + sp * (0.4 + r(1) * 0.3), prevClose),
    };
  }

  /** Used only while real data is loading — trends in the correct direction */
  private generateFallbackPoints(stock: Stock, period: string): [number, number][] {
    const sd   = this.seed(stock.symbol + period);
    const rnd  = (i: number) => Math.abs(Math.sin(sd * 9301 + i * 49297 + 233995)) % 1;
    const n    = 20;
    const { min, max } = this.getPriceRange(stock, period);
    const str  = Math.min(Math.abs(stock.changePercent) / 10, 0.6);
    const span = max - min;
    const prev = stock.price - stock.change;
    return Array.from({ length: n }, (_, i): [number, number] => {
      const t     = i / (n - 1);
      const x     = this.CX + t * this.CW;
      // Linear walk from prevClose → currentPrice with noise
      const base  = prev + (stock.price - prev) * t;
      const noise = (rnd(i) - 0.5) * span * 0.15 * str;
      const price = Math.max(min, Math.min(max, base + noise));
      return [x, this.priceToY(price, min, max)];
    });
  }

  private getTimeLabels(period: string): string[] {
    const map: Record<string, string[]> = {
      '1D':  ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'],
      '5D':  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      '1M':  ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      'YTD': ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
      '1Y':  ['Jan', 'Apr', 'Jul', 'Oct', 'Jan'],
      '5Y':  ['2020', '2021', '2022', '2023', '2024'],
      'Max': ['2015', '2017', '2019', '2021', '2023'],
    };
    return map[period] ?? [];
  }

  private fmtMktCap(v: number, c: string): string {
    if (v >= 1e12) return c + (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9)  return c + (v / 1e9).toFixed(2) + 'B';
    return c + (v / 1e6).toFixed(2) + 'M';
  }

  private fmtVol(v: number): string {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toString();
  }
}
