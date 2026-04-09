import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform, OnDestroy {
  private langService = inject(LanguageService);
  private cdr         = inject(ChangeDetectorRef);
  private sub: Subscription;

  constructor() {
    // When the language changes, mark this pipe's host view for check so
    // every translated string re-evaluates on the next change-detection cycle.
    this.sub = this.langService.langChange$.subscribe(() => this.cdr.markForCheck());
  }

  transform(key: string, params?: Record<string, string>): string {
    return this.langService.translate(key, params);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
