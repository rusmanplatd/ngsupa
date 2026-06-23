import { Component, input, computed } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flush';

@Component({
  selector: 'app-card',
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'interactive() ? "button" : null',
    '[attr.tabindex]': 'interactive() ? 0 : null',
  },
  template: `
    <ng-content select="[card-header]" />
    @if (variant() !== 'flush' && padding() !== 'none') {
      <div [class]="paddingClass()">
        <ng-content />
      </div>
    } @else {
      <ng-content />
    }
    <ng-content select="[card-footer]" />
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
    }

    :host([role='button']) {
      cursor: pointer;
      transition: transform var(--duration-fast) cubic-bezier(0.2, 0, 0, 1),
                  box-shadow var(--duration-fast) cubic-bezier(0.2, 0, 0, 1);
    }

    :host([role='button']:hover) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    :host([role='button']:active) {
      transform: translateY(0) scale(0.98);
    }
  `,
})
export class CardComponent {
  readonly variant = input<CardVariant>('default');
  readonly interactive = input(false);
  readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('md');

  protected readonly paddingClass = computed(() => {
    const padMap = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };
    return padMap[this.padding()];
  });

  protected readonly hostClasses = computed(() => {
    const base = 'rounded-2xl';
    switch (this.variant()) {
      case 'elevated':
        return `${base} bg-[var(--surface-elevated)] shadow-lg`;
      case 'outlined':
        return `${base} bg-[var(--surface-primary)] border border-[var(--border-default)]`;
      case 'flush':
        return `${base} bg-[var(--surface-primary)]`;
      default:
        return `${base} bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-md`;
    }
  });
}
