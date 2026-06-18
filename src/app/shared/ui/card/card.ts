import { Component, input, computed } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined';

@Component({
  selector: 'app-card',
  host: {
    '[class]': 'hostClasses()',
  },
  template: `
    @if (hasHeader) {
      <div class="px-5 pt-4 pb-0">
        <ng-content select="[card-header]" />
      </div>
    }
    <div class="p-5">
      <ng-content />
    </div>
    @if (hasFooter) {
      <div class="border-t border-[var(--separator)] px-5 py-3">
        <ng-content select="[card-footer]" />
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
    }
  `,
})
export class CardComponent {
  readonly variant = input<CardVariant>('default');

  /** Projected content detection via CSS :has(), toggled in template */
  protected readonly hasHeader = true;
  protected readonly hasFooter = true;

  protected readonly hostClasses = computed(() => {
    const base = 'rounded-2xl';
    switch (this.variant()) {
      case 'elevated':
        return `${base} bg-[var(--surface-elevated)] shadow-lg`;
      case 'outlined':
        return `${base} bg-[var(--surface-primary)] border border-[var(--border-default)]`;
      default:
        return `${base} bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-md`;
    }
  });
}
