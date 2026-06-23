import { Component, input, computed } from '@angular/core';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'neutral' | 'info';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    @if (dot()) {
      <span class="block rounded-full" [class]="dotSizeClass()"></span>
    } @else if (count() !== null) {
      {{ displayCount() }}
    } @else {
      <ng-content />
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      white-space: nowrap;
      line-height: 1;
      vertical-align: middle;
    }
  `,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');
  readonly size = input<BadgeSize>('sm');
  readonly dot = input(false);
  readonly count = input<number | null>(null);
  readonly maxCount = input(99);
  readonly ariaLabel = input<string | null>(null);
  readonly subtle = input(false);

  protected readonly displayCount = computed(() => {
    const c = this.count();
    if (c === null) return '';
    return c > this.maxCount() ? `${this.maxCount()}+` : `${c}`;
  });

  protected readonly dotSizeClass = computed(() => {
    return this.size() === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  });

  protected readonly hostClasses = computed(() => {
    const v = this.variant();
    const s = this.size();
    const isDot = this.dot();
    const isSubtle = this.subtle();

    const solidMap: Record<BadgeVariant, string> = {
      default: 'bg-system-blue text-white',
      success: 'bg-system-green text-white',
      warning: 'bg-system-orange text-white',
      error: 'bg-system-red text-white',
      neutral: 'bg-[var(--fill-secondary)] text-[var(--text-secondary)]',
      info: 'bg-system-teal text-white',
    };

    const subtleMap: Record<BadgeVariant, string> = {
      default: 'bg-system-blue-light text-system-blue',
      success: 'bg-system-green-light text-system-green',
      warning: 'bg-system-orange-light text-system-orange',
      error: 'bg-system-red-light text-system-red',
      neutral: 'bg-[var(--fill-primary)] text-[var(--text-secondary)]',
      info: 'bg-system-teal-light text-system-teal',
    };

    const variantMap = isSubtle ? subtleMap : solidMap;

    if (isDot) {
      return `rounded-full p-0 ${variantMap[v]}`;
    }

    const sizeMap: Record<BadgeSize, string> = {
      sm: 'min-w-[18px] h-[18px] px-1.5 text-[10px] rounded-full',
      md: 'min-w-[22px] h-[22px] px-2 text-xs rounded-full',
    };

    return `${sizeMap[s]} ${variantMap[v]}`;
  });
}
