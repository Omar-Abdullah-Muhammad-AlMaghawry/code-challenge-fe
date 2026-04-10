import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatMenuModule, TranslatePipe],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
})
export class DashboardLayout {
  private authService  = inject(AuthService);
  readonly langService = inject(LanguageService);

  sidenavOpen = signal(true);
  username    = this.authService.getUser();
  currentLangLabel = computed(() =>
    this.langService.languages.find(l => l.code === this.langService.currentLang())?.label ?? 'English'
  );

  navItems: NavItem[] = [
    { label: 'NAV.HOME',      icon: 'home',      route: '/dashboard/home'      },
    { label: 'NAV.ANALYTICS', icon: 'bar_chart', route: '/dashboard/analytics' },
    { label: 'NAV.SETTINGS',  icon: 'settings',  route: '/dashboard/settings'  },
  ];

  toggleSidenav(): void { this.sidenavOpen.update(v => !v); }
  logout(): void        { this.authService.logout(); }
}
