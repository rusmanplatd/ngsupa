import { Component, input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-avatar',
  host: {
    class: 'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    '[style.width.px]': 'sizeMap[size()]',
    '[style.height.px]': 'sizeMap[size()]',
    '[attr.aria-label]': 'alt() || name()',
  },
  template: `
    @if (src() && !imgError()) {
      <img
        [src]="src()"
        [alt]="alt() || name() || 'Avatar'"
        (error)="imgError.set(true)"
        class="h-full w-full object-cover"
      />
    } @else {
      <span
        class="flex h-full w-full items-center justify-center font-semibold text-white"
        [class]="fallbackClasses()"
        [style.font-size.px]="fontSizeMap[size()]"
      >
        {{ initials() }}
      </span>
    }
    @if (status()) {
      <span
        class="absolute bottom-0 right-0 block rounded-full border-2 border-[var(--surface-primary)]"
        [class]="statusClasses()"
        [style.width.px]="statusSizeMap[size()]"
        [style.height.px]="statusSizeMap[size()]"
        [attr.aria-label]="status() + ' status'"
      ></span>
    }
  `,
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly alt = input<string | null>(null);
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly status = input<'online' | 'offline' | 'away' | null>(null);

  protected readonly imgError = signal(false);

  protected readonly sizeMap: Record<string, number> = {
    xs: 24, sm: 32, md: 40, lg: 56, xl: 80,
  };

  protected readonly fontSizeMap: Record<string, number> = {
    xs: 10, sm: 12, md: 15, lg: 20, xl: 28,
  };

  protected readonly statusSizeMap: Record<string, number> = {
    xs: 6, sm: 8, md: 10, lg: 12, xl: 16,
  };

  protected readonly initials = computed(() => {
    const n = this.name();
    if (!n) return '?';
    return n
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  protected readonly fallbackClasses = computed(() => {
    const n = this.name() || '';
    const colors = [
      'bg-[var(--color-primary)]',
      'bg-[var(--color-error)]',
      'bg-[var(--color-success)]',
      'bg-[var(--color-warning)]',
      'bg-[var(--color-info)]',
      'bg-system-purple',
      'bg-system-pink',
      'bg-system-indigo',
    ];
    const hash = n
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  });

  protected readonly statusClasses = computed(() => {
    switch (this.status()) {
      case 'online': return 'bg-[var(--color-success)]';
      case 'offline': return 'bg-[var(--text-tertiary)]';
      case 'away': return 'bg-[var(--color-warning)]';
      default: return '';
    }
  });
}
