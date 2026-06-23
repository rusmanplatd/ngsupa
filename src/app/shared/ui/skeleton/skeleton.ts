import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  host: {
    'aria-busy': 'true',
    'aria-live': 'polite',
    '[class]': 'hostClasses()',
    '[style.width]': 'widthStyle()',
    '[style.height]': 'heightStyle()',
  },
  template: ``,
  styles: `
    :host {
      display: block;
      background: linear-gradient(
        90deg,
        var(--skeleton-base) 25%,
        var(--skeleton-shine) 50%,
        var(--skeleton-base) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `,
})
export class SkeletonComponent {
  readonly variant = input<'text' | 'circle' | 'rect'>('text');
  readonly width = input<string | null>(null);
  readonly height = input<string | null>(null);
  readonly lines = input(1);

  protected readonly hostClasses = computed(() => {
    switch (this.variant()) {
      case 'circle':
        return 'rounded-full aspect-square';
      case 'rect':
        return 'rounded-xl';
      default:
        return 'rounded-md';
    }
  });

  protected readonly widthStyle = computed(() => {
    if (this.width()) return this.width();
    switch (this.variant()) {
      case 'circle': return this.height() || '40px';
      case 'rect': return '100%';
      default: return '100%';
    }
  });

  protected readonly heightStyle = computed(() => {
    if (this.height()) return this.height();
    switch (this.variant()) {
      case 'circle': return this.width() || '40px';
      case 'rect': return '120px';
      default: return '14px';
    }
  });
}

/** Helper component for multiple skeleton lines */
@Component({
  selector: 'app-skeleton-group',
  imports: [SkeletonComponent],
  host: {
    class: 'block space-y-2.5',
    'aria-busy': 'true',
  },
  template: `
    @for (w of lineWidths(); track $index) {
      <app-skeleton variant="text" [width]="w" [height]="height()" />
    }
  `,
})
export class SkeletonGroupComponent {
  readonly lines = input(3);
  readonly height = input<string | null>('14px');

  protected readonly lineWidths = computed(() => {
    const n = this.lines();
    const widths = ['100%', '92%', '78%', '85%', '65%', '95%', '72%', '88%'];
    return Array.from({ length: n }, (_, i) => widths[i % widths.length]);
  });
}
