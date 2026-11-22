import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { IconComponent } from './components/icon/icon.component';

/** Breadcrumb labels for the topbar (presentation only, routes are defined in app.routes.ts). */
const PAGE_LABELS: Record<string, string> = {
  'test-cases': 'Test cases',
  requirements: 'Requirements',
  runs: 'Runs',
  reports: 'Reports',
  health: 'Settings & Health'
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, IconComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Testgen';

  private router = inject(Router);

  readonly sidebarOpen = signal(false);
  readonly pageLabel = signal(this.labelFor(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((e) => {
        this.pageLabel.set(this.labelFor(e.urlAfterRedirects));
        this.closeSidebar();
      });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  private labelFor(url: string): string {
    const segment = url.split(/[?#]/)[0].split('/').filter(Boolean)[0] ?? '';
    return PAGE_LABELS[segment] ?? 'Test cases';
  }
}
