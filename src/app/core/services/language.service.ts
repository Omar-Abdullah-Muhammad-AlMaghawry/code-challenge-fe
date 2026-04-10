import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

export interface Language {
  code:  string;
  label: string;
  dir:   'ltr' | 'rtl';
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private http = inject(HttpClient);

  readonly languages: Language[] = [
    { code: 'en', label: 'English',  dir: 'ltr' },
    { code: 'ar', label: 'العربية', dir: 'rtl' },
    { code: 'es', label: 'Español',  dir: 'ltr' },
    { code: 'de', label: 'Deutsch',  dir: 'ltr' },
  ];

  /** Emits whenever the active language changes — used by TranslatePipe to trigger re-render. */
  readonly langChange$ = new Subject<string>();

  readonly currentLang = signal<string>('en');
  private translations: Record<string, unknown> = {};

  /** Called once from APP_INITIALIZER — loads the persisted language before first render. */
  init(): Promise<void> {
    const saved = localStorage.getItem('lang') ?? 'en';
    return this.load(saved);
  }

  setLanguage(code: string): void {
    this.load(code);
  }

  translate(key: string, params?: Record<string, string>): string {
    const parts = key.split('.');
    let node: unknown = this.translations;
    for (const part of parts) {
      if (node && typeof node === 'object') {
        node = (node as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    if (typeof node !== 'string') return key;
    if (!params) return node;
    return node.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? `{{${k}}}`);
  }

  private load(code: string): Promise<void> {
    return new Promise(resolve => {
      this.http.get<Record<string, unknown>>(`/assets/i18n/${code}.json`).subscribe({
        next: data => {
          this.translations = data;
          this.currentLang.set(code);
          localStorage.setItem('lang', code);
          const lang = this.languages.find(l => l.code === code);
          const dir = lang?.dir ?? 'ltr';
          document.documentElement.setAttribute('dir',  dir);
          document.documentElement.setAttribute('lang', code);
          document.body.setAttribute('dir', dir);
          document.querySelector('.cdk-overlay-container')?.setAttribute('dir', dir);
          this.langChange$.next(code);
          resolve();
        },
        error: () => resolve(),
      });
    });
  }
}
