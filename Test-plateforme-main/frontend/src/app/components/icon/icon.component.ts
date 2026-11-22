import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Lucide icon names used by the interface (paths inlined, ISC license: no icon dependency). */
export type IconName =
  | 'coffee'
  | 'clipboard-list'
  | 'flask-conical'
  | 'play'
  | 'chart-column'
  | 'book-open'
  | 'settings'
  | 'search'
  | 'plus'
  | 'x'
  | 'check'
  | 'ban'
  | 'pencil'
  | 'trash-2'
  | 'chevron-down'
  | 'chevron-right'
  | 'filter'
  | 'sparkles'
  | 'download'
  | 'rotate-cw'
  | 'circle-check'
  | 'circle-x'
  | 'triangle-alert'
  | 'menu'
  | 'folder'
  | 'inbox'
  | 'server'
  | 'info'
  | 'shield-check';

/**
 * Purely presentational inline SVG icon. Sizing and stroke come from the global `.icon` classes.
 * Usage: <app-icon name="plus" /> or <app-icon name="search" size="sm" />
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.icon-host]': 'true' },
  template: `<svg
    class="icon"
    [class.icon-sm]="size() === 'sm'"
    [class.icon-lg]="size() === 'lg'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    @switch (name()) {
      @case ('coffee') { <path d="M10 2v2"/> <path d="M14 2v2"/> <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/> <path d="M6 2v2"/> }
      @case ('clipboard-list') { <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/> <path d="M12 11h4"/> <path d="M12 16h4"/> <path d="M8 11h.01"/> <path d="M8 16h.01"/> }
      @case ('flask-conical') { <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/> <path d="M6.453 15h11.094"/> <path d="M8.5 2h7"/> }
      @case ('play') { <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/> }
      @case ('chart-column') { <path d="M3 3v16a2 2 0 0 0 2 2h16"/> <path d="M18 17V9"/> <path d="M13 17V5"/> <path d="M8 17v-3"/> }
      @case ('book-open') { <path d="M12 5v16"/> <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/> }
      @case ('settings') { <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/> <circle cx="12" cy="12" r="3"/> }
      @case ('search') { <path d="m21 21-4.34-4.34"/> <circle cx="11" cy="11" r="8"/> }
      @case ('plus') { <path d="M5 12h14"/> <path d="M12 5v14"/> }
      @case ('x') { <path d="M18 6 6 18"/> <path d="m6 6 12 12"/> }
      @case ('check') { <path d="M20 6 9 17l-5-5"/> }
      @case ('ban') { <circle cx="12" cy="12" r="10"/> <path d="M4.929 4.929 19.07 19.071"/> }
      @case ('pencil') { <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/> <path d="m15 5 4 4"/> }
      @case ('trash-2') { <path d="M10 11v6"/> <path d="M14 11v6"/> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/> <path d="M3 6h18"/> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/> }
      @case ('chevron-down') { <path d="m6 9 6 6 6-6"/> }
      @case ('chevron-right') { <path d="m9 18 6-6-6-6"/> }
      @case ('filter') { <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/> }
      @case ('sparkles') { <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/> <path d="M20 2v4"/> <path d="M22 4h-4"/> <circle cx="4" cy="20" r="2"/> }
      @case ('download') { <path d="M12 15V3"/> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/> <path d="m7 10 5 5 5-5"/> }
      @case ('rotate-cw') { <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/> <path d="M21 3v5h-5"/> }
      @case ('circle-check') { <circle cx="12" cy="12" r="10"/> <path d="m16 9-5.5 5.5L8 12"/> }
      @case ('circle-x') { <circle cx="12" cy="12" r="10"/> <path d="m15 9-6 6"/> <path d="m9 9 6 6"/> }
      @case ('triangle-alert') { <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/> <path d="M12 9v4"/> <path d="M12 17h.01"/> }
      @case ('menu') { <path d="M4 5h16"/> <path d="M4 12h16"/> <path d="M4 19h16"/> }
      @case ('folder') { <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/> }
      @case ('inbox') { <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/> <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/> }
      @case ('server') { <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/> <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/> <line x1="6" x2="6.01" y1="6" y2="6"/> <line x1="6" x2="6.01" y1="18" y2="18"/> }
      @case ('info') { <circle cx="12" cy="12" r="10"/> <path d="M12 16v-4"/> <path d="M12 8h.01"/> }
      @case ('shield-check') { <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/> <path d="m9 12 2 2 4-4"/> }
    }
  </svg>`
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
